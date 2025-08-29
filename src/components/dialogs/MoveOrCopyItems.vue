<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import cache from '@/cache.js'
import utils from '@/utils.js'
import SpacePicker from '@/components/dialogs/SpacePicker.vue'
import Loader from '@/components/Loader.vue'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const connectionStore = useConnectionStore()
const boxStore = useBoxStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

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
  loading: false
})

watch(() => props.visible, async (value, prevValue) => {
  globalStore.clearNotificationsWithPosition()
  await nextTick()
  if (value) {
    closeDialogs()
    scrollIntoView()
    updateSpaces()
  }
})

const scrollIntoView = () => {
  const element = dialogElement.value
  globalStore.scrollElementIntoView({ element })
}
const closeDialogs = () => {
  state.spacePickerIsVisible = false
}
const isOnline = computed(() => state.isOnline)

// spaces

const currentSpace = computed(() => spaceStore.getSpaceAllState)
const updateSpaces = async () => {
  let spaces = await cache.getAllSpaces()
  spaces = utils.sortByUpdatedAt(spaces)
  state.spaces = spaces.filter(space => {
    const spaceIsNotCurrent = space.id !== currentSpace.value.id
    const spaceHasId = Boolean(space.id)
    const spaceHasName = Boolean(space.name)
    return spaceIsNotCurrent && spaceHasId && spaceHasName
  })
  state.selectedSpace = state.spaces[0]
}
const recentSpaces = computed(() => {
  const spaces = state.spaces.slice(0, 3) // 3 most recent spaces
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

const multipleCardsSelectedIds = computed(() => globalStore.multipleCardsSelectedIds)
const multipleBoxesSelectedIds = computed(() => globalStore.multipleBoxesSelectedIds)
const multipleCardsIsSelected = computed(() => {
  const numberOfCards = multipleCardsSelectedIds.value.length
  return Boolean(numberOfCards > 1)
})
const itemsCount = computed(() => multipleCardsSelectedIds.value.length + multipleBoxesSelectedIds.value.length)
const selectedItems = computed(() => spaceStore.getSpaceSelectedItems)
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
  globalStore.clearNotificationsWithPosition()
  const position = utils.cursorPositionInPage(event)
  try {
    await navigator.clipboard.writeText(text.value)
    globalStore.addNotificationWithPosition({ message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    globalStore.addNotificationWithPosition({ message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}

// copy or move

const copyToSelectedSpace = async (items) => {
  state.loading = true
  const selectedSpaceId = state.selectedSpace.id
  const selectedSpaceisCurrentSpace = selectedSpaceId === spaceStore.id
  newItems = await spaceStore.getNewItems(items, selectedSpaceId)
  // update cache
  const space = await cache.space(selectedSpaceId).cards
  const spaceIsCached = Boolean(space)
  if (!spaceIsCached) {
    await cache.saveSpace({ id: selectedSpaceId })
  }
  await cache.addToSpace(newItems, selectedSpaceId)
  // update current space
  if (selectedSpaceisCurrentSpace) {
    const shouldOffsetPosition = true
    cardStore.createCards(newItems.cards, shouldOffsetPosition)
    newItems.connectionTypes.forEach(connectionType => connectionStore.createConnectionType(connectionType))
    newItems.connections.forEach(connection => connectionStore.createConnection(connection))
    newItems.boxes.forEach(box => boxStore.createBox(box))
  }
  // update server
  for (const card of newItems.cards) {
    await apiStore.addToQueue({ name: 'createCard', body: card, spaceId: selectedSpaceId })
  }
  for (const connectionType of newItems.connectionTypes) {
    await apiStore.addToQueue({ name: 'createConnectionType', body: connectionType, spaceId: selectedSpaceId })
  }
  for (const connection of newItems.connections) {
    await apiStore.addToQueue({ name: 'createConnection', body: connection, spaceId: selectedSpaceId })
  }
  for (const box of newItems.boxes) {
    await apiStore.addToQueue({ name: 'createBox', body: box, spaceId: selectedSpaceId })
  }
  console.info('🚚 copies created', newItems)
  state.loading = false
}
const moveOrCopyToSpace = async () => {
  if (state.loading) { return }
  const items = selectedItems.value
  await copyToSelectedSpace(items)
  notifySuccess()
  if (props.actionIsMove) {
    removeCards(items.cards)
    removeBoxes(items.boxes)
    items.isRemoved = true
  }
  userStore.updateUserCardsCreatedCount(items.cards)
  connectionStore.removeAllUnusedConnectionTypes()
  globalStore.clearMultipleSelected()
  globalStore.closeAllDialogs()
}
const removeCards = (cards) => {
  const ids = cards.map(card => card.id)
  cardStore.removeCards(ids)
}
const removeBoxes = (boxes) => {
  const ids = boxes.map(box => box.id)
  boxStore.removeBoxes(ids)
}

// should upgrade user

const triggerUpgradeUserIsVisible = () => {
  globalStore.closeAllDialogs()
  globalStore.triggerUpgradeUserIsVisible()
}

// notify

const notifySuccess = () => {
  const action = utils.pastTense(actionLabel.value)
  const message = `${itemsCount.value} ${pluralItem.value} ${action} to ${state.selectedSpace.name}` // 3 cards copied to SpacePalace
  globalStore.notifyMoveOrCopyToSpaceDetails = { id: state.selectedSpace.id, name: state.selectedSpace.name, message, items: newItems }
  globalStore.notifyMoveOrCopyToSpace = true
}
const notifyNewSpaceSuccess = (newSpace) => {
  const action = utils.pastTense(actionLabel.value)
  const message = `${newSpace.name} added with ${itemsCount.value} ${pluralItem.value} ${action} ` // SpacePalace added with 3 cards copied
  globalStore.notifyMoveOrCopyToSpaceDetails = { id: newSpace.id, name: newSpace.name, message, items: newItems }
  globalStore.notifyMoveOrCopyToSpace = true
}
</script>

<template lang="pug">
dialog.narrow.more-or-copy-items(v-if="visible" :open="visible" ref="dialogElement" @click.left.stop="closeDialogs")
  section(v-if="!actionIsMove && text")
    //- Copy Card Names
    button(@click.left="copyText")
      img.icon.copy(src="@/assets/copy.svg")
      span Copy Card Names
  section
    .row
      p {{actionLabelCapitalized}} {{pluralItem}} to space
    //- space picker
    .row
      .button-wrap
        button(@click.left.stop="toggleSpacePickerIsVisible" :class="{active: state.spacePickerIsVisible}")
          img.preview-thumbnail-image(v-if="state.selectedSpace.previewThumbnailImage && isOnline" :src="state.selectedSpace.previewThumbnailImage")
          span {{state.selectedSpace.name}}
          img.icon.down-arrow(src="@/assets/down-arrow.svg")
        SpacePicker(:visible="state.spacePickerIsVisible" :selectedSpace="state.selectedSpace" :shouldShowNewSpace="true" @selectSpace="updateSelectedSpace" :showUserIfCurrentUserIsCollaborator="true" :shouldExcludeCurrentSpace="true")
    //- recent spaces
    .row.recent-spaces-row(v-if="recentSpaces.length")
      .badge.secondary.button-badge(v-for="recentSpace in recentSpaces" :key="recentSpace.id" @click="updateSelectedSpace(recentSpace)" :class="{active: selectedSpaceIsRecentSpace(recentSpace)}")
        span {{recentSpace.name}}
    //- submit button
    button(@click.left="moveOrCopyToSpace" :class="{active: state.loading}")
      img.icon.cut(v-if="actionIsMove" src="@/assets/cut.svg")
      img.icon.copy(v-else src="@/assets/copy.svg")
      span {{buttonLabel}}
      Loader(:visible="state.loading")
  //- error
  //- section.error-card-limit(v-if="state.spacesCreatedIsOverLimit")
  //-   .badge.danger Out of Spaces
  //-   p To add more spaces you'll need to upgrade
  //-   button(@click.left.stop="triggerUpgradeUserIsVisible") Upgrade for Unlimited
</template>

<style lang="stylus">
dialog.more-or-copy-items
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
    // top -100px
    .results-section
      max-height 250px
</style>
