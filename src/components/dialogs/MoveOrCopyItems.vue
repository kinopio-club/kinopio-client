<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import cache from '@/cache.js'
import utils from '@/utils.js'
import SpacePicker from '@/components/dialogs/SpacePicker.vue'
import Loader from '@/components/Loader.vue'
const store = useStore()

const dialogElement = ref(null)

let newItems

const props = defineProps({
  visible: Boolean,
  actionIsMove: Boolean
})

const state = reactive({
  spaces: [],
  selectedSpace: {},
  spacePickerIsVisible: false,
  loading: false,
  cardsCreatedIsOverLimit: false
})

watch(() => props.visible, async (value, prevValue) => {
  store.commit('clearNotificationsWithPosition')
  await nextTick()
  if (value) {
    closeDialogs()
    scrollIntoView()
    updateSpaces()
  }
})

const scrollIntoView = () => {
  const element = dialogElement.value
  store.commit('scrollElementIntoView', { element })
}
const closeDialogs = () => {
  state.spacePickerIsVisible = false
}
const isOnline = computed(() => state.isOnline)

// spaces

const currentSpace = computed(() => store.state.currentSpace)
const updateSpaces = async () => {
  const spaces = await cache.getAllSpaces()
  state.spaces = spaces.filter(space => {
    const spaceIsNotCurrent = space.id !== currentSpace.value.id
    const spaceHasId = Boolean(space.id)
    const spaceHasName = Boolean(space.name)
    return spaceIsNotCurrent && spaceHasId && spaceHasName
  })
  state.selectedSpace = state.spaces[0]
}
const recentSpaces = computed(() => {
  let spaces = utils.sortByUpdatedAt(state.spaces)
  spaces = spaces.slice(0, 4) // 4 most recent spaces
  return spaces
})
const updateSelectedSpace = (space) => {
  state.selectedSpace = space
  state.spacePickerIsVisible = false
}
const toggleSpacePickerIsVisible = () => {
  state.spacePickerIsVisible = !state.spacePickerIsVisible
}
const selectedSpaceIsRecentSpace = (space) => {
  return state.selectedSpace.id === space.id
}

// items

const multipleCardsSelectedIds = computed(() => store.state.multipleCardsSelectedIds)
const multipleBoxesSelectedIds = computed(() => store.state.multipleBoxesSelectedIds)
const multipleCardsIsSelected = computed(() => {
  const numberOfCards = multipleCardsSelectedIds.value.length
  return Boolean(numberOfCards > 1)
})
const itemsCount = computed(() => multipleCardsSelectedIds.value.length + multipleBoxesSelectedIds.value.length)
const selectedItems = computed(() => store.getters['currentSpace/selectedItems'])
const names = computed(() => selectedItems.value.cards.map(card => card.name))
const sortedByY = (items) => {
  items = items.sort((a, b) => {
    return a.y - b.y
  })
  return items
}
const text = computed(() => {
  let cards = selectedItems.value.cards
  cards = sortedByY(cards)
  return utils.nameStringFromItems(cards)
})

// labels

const actionLabel = computed(() => {
  if (props.actionIsMove) {
    return 'move'
  } else {
    return 'copy'
  }
})
const pluralItem = computed(() => {
  const condition = multipleCardsSelectedIds.value.length + multipleBoxesSelectedIds.value.length !== 1
  return utils.pluralize('item', condition)
})
const actionLabelCapitalized = computed(() => utils.capitalizeFirstLetter(actionLabel.value))
const buttonLabel = computed(() => {
  const action = utils.capitalizeFirstLetter(actionLabel.value) // copy, move
  const item = utils.capitalizeFirstLetter(pluralItem.value) // item, items
  return `${action} ${item} to Space`
})

// copy text

const copyText = async () => {
  store.commit('clearNotificationsWithPosition')
  const position = utils.cursorPositionInPage(event)
  try {
    await navigator.clipboard.writeText(text.value)
    store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}

// copy or move

const copyToSelectedSpace = async (items) => {
  state.loading = true
  const selectedSpaceId = state.selectedSpace.id
  const selectedSpaceisCurrentSpace = selectedSpaceId === store.state.currentSpace.id
  newItems = await store.dispatch('currentSpace/newItems', { items, spaceId: selectedSpaceId })
  // update cache
  const space = await cache.space(selectedSpaceId).cards
  const spaceIsCached = Boolean(space)
  if (!spaceIsCached) {
    await cache.saveSpace({ id: selectedSpaceId })
  }
  await cache.addToSpace(newItems, selectedSpaceId)
  // update current space
  if (selectedSpaceisCurrentSpace) {
    store.dispatch('currentCards/addMultiple', { cards: newItems.cards, shouldOffsetPosition: true })
    newItems.connectionTypes.forEach(connectionType => store.dispatch('currentConnections/addType', connectionType))
    newItems.connections.forEach(connection => store.dispatch('currentConnections/add', { connection, type: { id: connection.connectionTypeId } }))
    newItems.boxes.forEach(box => store.dispatch('currentBoxes/add', { box }))
  }
  // update server
  for (const card of newItems.cards) {
    await store.dispatch('api/addToQueue', { name: 'createCard', body: card, spaceId: selectedSpaceId })
  }
  for (const connectionType of newItems.connectionTypes) {
    await store.dispatch('api/addToQueue', { name: 'createConnectionType', body: connectionType, spaceId: selectedSpaceId })
  }
  for (const connection of newItems.connections) {
    await store.dispatch('api/addToQueue', { name: 'createConnection', body: connection, spaceId: selectedSpaceId })
  }
  for (const box of newItems.boxes) {
    await store.dispatch('api/addToQueue', { name: 'createBox', body: box, spaceId: selectedSpaceId })
  }
  console.info('🚚 copies created', newItems)
  state.loading = false
}
const moveOrCopyToSpace = async () => {
  if (state.loading) { return }
  const items = selectedItems.value
  if (isCardsCreatedIsOverLimit()) {
    state.cardsCreatedIsOverLimit = true
    return
  }
  await copyToSelectedSpace(items)
  notifySuccess()
  if (props.actionIsMove) {
    removeCards(items.cards)
    removeBoxes(items.boxes)
    items.isRemoved = true
    store.dispatch('history/resume')
    store.dispatch('history/add', items)
  }
  store.dispatch('currentUser/cardsCreatedCountUpdateBy', {
    cards: items.cards
  })
  store.dispatch('currentConnections/removeUnusedTypes')
  store.dispatch('clearMultipleSelected')
  store.dispatch('closeAllDialogs')
}
const removeCards = (cards) => {
  cards.forEach(card => {
    store.dispatch('currentCards/remove', card)
    store.dispatch('currentConnections/removeFromItem', card)
  })
}
const removeBoxes = (boxes) => {
  boxes.forEach(box => {
    store.dispatch('currentBoxes/remove', box)
  })
}

// should upgrade user

const triggerUpgradeUserIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerUpgradeUserIsVisible')
}
const isCardsCreatedIsOverLimit = () => {
  if (props.actionIsMove) { return }
  const items = selectedItems.value.cards.length
  return store.getters['currentUser/cardsCreatedWillBeOverLimit'](items)
}

// notify

const notifySuccess = () => {
  const action = utils.pastTense(actionLabel.value)
  const message = `${itemsCount.value} ${pluralItem.value} ${action} to ${state.selectedSpace.name}` // 3 cards copied to SpacePalace
  store.commit('notifyMoveOrCopyToSpaceDetails', { id: state.selectedSpace.id, name: state.selectedSpace.name, message, items: newItems })
  store.commit('notifyMoveOrCopyToSpace', true)
}
const notifyNewSpaceSuccess = (newSpace) => {
  const action = utils.pastTense(actionLabel.value)
  const message = `${newSpace.name} added with ${itemsCount.value} ${pluralItem.value} ${action} ` // SpacePalace added with 3 cards copied
  store.commit('notifyMoveOrCopyToSpaceDetails', { id: newSpace.id, name: newSpace.name, message, items: newItems })
  store.commit('notifyMoveOrCopyToSpace', true)
}
</script>

<template lang="pug">
dialog.narrow.more-or-copy-cards(v-if="visible" :open="visible" ref="dialogElement" @click.left.stop="closeDialogs")
  section(v-if="!actionIsMove && text")
    //- Copy Card Names
    button(@click.left="copyText")
      img.icon.copy(src="@/assets/copy.svg")
      span Copy Card Names
  section
    .row
      p {{actionLabelCapitalized}} {{pluralItem}} to space
    //- recent spaces
    .row.recent-spaces-row(v-if="recentSpaces.length")
      .badge.secondary.button-badge(v-for="recentSpace in recentSpaces" :key="recentSpace.id" @click="updateSelectedSpace(recentSpace)" :class="{active: selectedSpaceIsRecentSpace(recentSpace)}")
        span {{recentSpace.name}}
    //- space picker
    .row
      .button-wrap
        button(@click.left.stop="toggleSpacePickerIsVisible" :class="{active: state.spacePickerIsVisible}")
          img.preview-thumbnail-image(v-if="state.selectedSpace.previewThumbnailImage && isOnline" :src="state.selectedSpace.previewThumbnailImage")
          span {{state.selectedSpace.name}}
          img.down-arrow(src="@/assets/down-arrow.svg")
        SpacePicker(:visible="state.spacePickerIsVisible" :selectedSpace="state.selectedSpace" :shouldShowNewSpace="true" @selectSpace="updateSelectedSpace" :showUserIfCurrentUserIsCollaborator="true" :shouldExcludeCurrentSpace="true")
    //- submit button
    button(@click.left="moveOrCopyToSpace" :class="{active: state.loading}")
      img.icon.cut(v-if="actionIsMove" src="@/assets/cut.svg")
      img.icon.copy(v-else src="@/assets/copy.svg")
      span {{buttonLabel}}
      Loader(:visible="state.loading")
  //- error
  .error-card-limit(v-if="state.cardsCreatedIsOverLimit")
    .badge.danger Out of Cards
    p To add more cards you'll need to upgrade
    button(@click.left.stop="triggerUpgradeUserIsVisible") Upgrade for Unlimited
</template>

<style lang="stylus">
dialog.more-or-copy-cards
  top -100px
  cursor initial
  .error-card-limit
    margin-top 10px
  .recent-spaces-row
    flex-wrap wrap
    margin-bottom 0px
    .badge
      margin-bottom 10px
  dialog.space-picker
    top -100px
    .results-section
      max-height 250px
</style>
