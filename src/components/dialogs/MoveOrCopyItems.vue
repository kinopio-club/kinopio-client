<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import cache from '@/cache.js'
import utils from '@/utils.js'
import SpacePicker from '@/components/dialogs/SpacePicker.vue'
import Loader from '@/components/Loader.vue'
const store = useStore()

const dialogElement = ref(null)

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

// spaces

const currentSpace = computed(() => store.state.currentSpace)
const updateSpaces = () => {
  const spaces = cache.getAllSpaces()
  state.spaces = spaces.filter(space => {
    const spaceIsNotCurrent = space.id !== currentSpace.value.id
    const spaceHasId = Boolean(space.id)
    return spaceIsNotCurrent && spaceHasId
  })
  state.selectedSpace = state.spaces[0]
}
const updateSelectedSpace = (space) => {
  state.selectedSpace = space
  state.spacePickerIsVisible = false
}
const toggleSpacePickerIsVisible = () => {
  state.spacePickerIsVisible = !state.spacePickerIsVisible
}
const isOnline = computed(() => state.isOnline)

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
const text = computed(() => utils.textFromCardNames(selectedItems.value.cards))

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

const copyToSelectedSpace = (items) => {
  state.loading = true
  const selectedSpaceId = state.selectedSpace.id
  const selectedSpaceisCurrentSpace = selectedSpaceId === store.state.currentSpace.id
  const newItems = store.getters['currentSpace/newItems']({ items, selectedSpaceId })
  // update cache
  const spaceIsCached = Boolean(cache.space(selectedSpaceId).cards)
  if (!spaceIsCached) {
    cache.saveSpace({ id: selectedSpaceId })
  }
  cache.addToSpace(newItems, selectedSpaceId)
  // update current space
  if (selectedSpaceisCurrentSpace) {
    store.dispatch('currentCards/addMultiple', { cards: newItems.cards, shouldOffsetPosition: true })
    newItems.connectionTypes.forEach(connectionType => store.dispatch('currentConnections/addType', connectionType))
    newItems.connections.forEach(connection => store.dispatch('currentConnections/add', { connection, type: { id: connection.connectionTypeId } }))
    newItems.boxes.forEach(box => store.dispatch('currentBoxes/add', { box }))
  }
  // update server
  newItems.cards.forEach(card => store.dispatch('api/addToQueue', { name: 'createCard', body: card, spaceId: selectedSpaceId }))
  newItems.connectionTypes.forEach(connectionType => store.dispatch('api/addToQueue', { name: 'createConnectionType', body: connectionType, spaceId: selectedSpaceId }))
  newItems.connections.forEach(connection => store.dispatch('api/addToQueue', { name: 'createConnection', body: connection, spaceId: selectedSpaceId }))
  newItems.boxes.forEach(box => store.dispatch('api/addToQueue', { name: 'createBox', body: box, spaceId: selectedSpaceId }))
  console.log('🚚 copies created', newItems)
  state.loading = false
}
const moveOrCopyToSpace = async () => {
  if (state.loading) { return }
  const items = selectedItems.value
  if (isCardsCreatedIsOverLimit()) {
    state.cardsCreatedIsOverLimit = true
    return
  }
  copyToSelectedSpace(items)
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
  store.commit('notifyMoveOrCopyToSpaceDetails', { id: state.selectedSpace.id, name: state.selectedSpace.name, message })
  store.commit('notifyMoveOrCopyToSpace', true)
}
const notifyNewSpaceSuccess = (newSpace) => {
  const action = utils.pastTense(actionLabel.value)
  const message = `${newSpace.name} added with ${itemsCount.value} ${pluralItem.value} ${action} ` // SpacePalace added with 3 cards copied
  store.commit('notifyMoveOrCopyToSpaceDetails', { id: newSpace.id, name: newSpace.name, message })
  store.commit('notifyMoveOrCopyToSpace', true)
}
</script>

<template lang="pug">
dialog.narrow.more-or-copy-cards(v-if="visible" :open="visible" ref="dialogElement" @click.left.stop="closeDialogs")
  section(v-if="!actionIsMove")
    //- Copy Card Names
    button(@click.left="copyText")
      img.icon.copy(src="@/assets/copy.svg")
      span Copy Card Names
  section
    .row
      p {{actionLabelCapitalized}} {{pluralItem}} to space
    .row
      .button-wrap
        button(@click.left.stop="toggleSpacePickerIsVisible" :class="{active: state.spacePickerIsVisible}")
          img.preview-thumbnail-image(v-if="state.selectedSpace.previewThumbnailImage && isOnline" :src="state.selectedSpace.previewThumbnailImage")
          span {{state.selectedSpace.name}}
          img.down-arrow(src="@/assets/down-arrow.svg")
        SpacePicker(:visible="state.spacePickerIsVisible" :selectedSpace="state.selectedSpace" :shouldShowNewSpace="true" @selectSpace="updateSelectedSpace" :showUserIfCurrentUserIsCollaborator="true")
    button(@click.left="moveOrCopyToSpace" :class="{active: state.loading}")
      img.icon.cut(v-if="actionIsMove" src="@/assets/cut.svg")
      img.icon.copy(v-else src="@/assets/copy.svg")
      span {{buttonLabel}}
      Loader(:visible="state.loading")
  .error-card-limit(v-if="state.cardsCreatedIsOverLimit")
    .badge.danger Out of Cards
    p To add more cards you'll need to upgrade
    button(@click.left.stop="triggerUpgradeUserIsVisible") Upgrade for Unlimited
</template>

<style lang="stylus">
.more-or-copy-cards
  top calc(100% - 8px)
  cursor initial
  .error-card-limit
    margin-top 10px
  dialog.space-picker
    .results-section
      max-height 250px
</style>
