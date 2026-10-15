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
import MinimapCanvas from '@/components/MinimapCanvas.vue'

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
  loading: false,
  cardsCreatedIsOverLimit: false,
  isCopiedToNote: false,
  selectedSpaceData: null,
  isLoading: false,
  itemsOffset: { x: 0, y: 0 }
})

watch(() => props.visible, async (value, prevValue) => {
  globalStore.clearNotificationsWithPosition()
  await nextTick()
  if (value) {
    closeDialogs()
    scrollIntoView()
    updateSpaces()
    state.isCopiedToNote = false
    state.itemsOffset = { x: 0, y: 0 }
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

// minimap

watch(() => state.selectedSpace, (value, prevValue) => {
  if (!value) { return }
  updateSelectedSpaceData(state.selectedSpace)
})
const updateSelectedSpaceData = async (space) => {
  try {
    state.selectedSpaceData = null
    state.isLoading = true
    // local
    const cachedSpace = await cache.space(space.id)
    if (cachedSpace.cards) {
      state.selectedSpaceData = cachedSpace
    }
    // remote
    const remoteSpace = await spaceStore.getRemoteSpace(space)
    if (!remoteSpace) {
      throw new Error('remote space not found')
    }
    if (state.selectedSpace.id !== remoteSpace.id) {
      throw new Error('remoteSpace is not selected')
    }
    state.selectedSpaceData = remoteSpace
  } catch (error) {
    console.warn('🚒 updateSelectedSpaceData', error)
  }
  state.isLoading = false
}
const currentOffsetItems = computed(() => offsetItems(selectedItems.value, state.itemsOffset))
const minimapPageSize = computed(() => {
  const space = state.selectedSpaceData
  if (!space) { return }
  const selected = normalizedSelectedItems.value
  const cards = (space.cards || []).concat(selected.cards)
  const boxes = (space.boxes || []).concat(selected.boxes)
  const lists = (space.lists || []).concat(selected.lists)
  let lines = (space.lines || []).concat(selected.lines)
  lines = lines.map(line => {
    return {
      x: 0,
      y: line.y,
      height: 25
    }
  })
  const items = cards.concat(boxes).concat(lists).concat(lines)
  items.push({
    x: 0, y: 0, width: 500, height: 500 // minimum page size
  })
  const pageSize = utils.pageSizeFromItems(items)
  // room to move the items past the end of the space
  const rect = itemsRect.value
  return {
    width: pageSize.width + rect.width,
    height: pageSize.height + rect.height
  }
})
const normalizedSelectedItems = computed(() => offsetItems(selectedItems.value, { x: 0, y: 0 }))
const itemsRect = computed(() => {
  const items = normalizedSelectedItems.value
  const padding = 40
  const rect = utils.boundaryRectFromItems(items.cards.concat(items.boxes, items.lists))
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + (padding * 2),
    height: rect.height + (padding * 2)
  }
})
const minimapViewportRect = computed(() => {
  const rect = itemsRect.value
  return {
    ...rect,
    x: rect.x + state.itemsOffset.x,
    y: rect.y + state.itemsOffset.y
  }
})
const updateItemsOffset = (position) => {
  // keep the items inside the minimap page
  const rect = itemsRect.value
  const pageSize = minimapPageSize.value
  let x = Math.min(position.x, pageSize.width - rect.width)
  let y = Math.min(position.y, pageSize.height - rect.height)
  x = Math.max(x, 0)
  y = Math.max(y, 0)
  state.itemsOffset = {
    x: Math.round(x - rect.x),
    y: Math.round(y - rect.y)
  }
}
watch(minimapPageSize, (value, prevValue) => {
  if (!value) { return }
  updateItemsOffset(minimapViewportRect.value)
})
const offsetItems = (items, offset) => {
  items = utils.clone(items)
  const types = ['cards', 'boxes', 'lists']
  for (const type of types) {
    items[type] = items[type].filter(item => Boolean(item))
    for (const item of items[type]) {
      item.x = item.x + offset.x
      item.y = item.y + offset.y
    }
  }
  items.lines = items.lines.filter(line => Boolean(line))
  for (const line of items.lines) {
    line.y = line.y + offset.y
  }
  items.connections = items.connections.filter(connection => Boolean(connection))
  items = utils.removeOrphanedConnections(items)
  for (const connection of items.connections) {
    const start = utils.startCoordsFromConnectionPath(connection.path)
    if (!start) { continue }
    // only the path start is absolute, the curve and end are relative to it
    const startPath = `m${start.x + offset.x},${start.y + offset.y}`
    connection.path = connection.path.replace(/^m[\d.-]+,[\d.-]+/, startPath)
  }
  return items
}

// items

const selectedItems = computed(() => spaceStore.getSpaceSelectedItems)
const itemsCount = computed(() => utils.countArrayItems(normalizedSelectedItems.value))
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
  const condition = itemsCount.value !== 1
  return utils.pluralize('item', condition)
})
const actionLabelCapitalized = computed(() => utils.capitalizeFirstLetter(actionLabel.value))
const buttonLabel = computed(() => {
  const action = utils.capitalizeFirstLetter(actionLabel.value) // copy, move
  const item = utils.capitalizeFirstLetter(pluralItem.value) // item, items
  return `${action} ${item} to Space`
})

// copy text

const copyText = async (event) => {
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

// copy to note

const canEditSpace = computed(() => userStore.getUserCanEditSpace)
const copyToNote = () => {
  const note = spaceStore.note
  let newValue
  if (note) {
    newValue = `${note}\n\n${text.value}`
  } else {
    newValue = text.value
  }
  spaceStore.updateSpaceNote(newValue)
  state.isCopiedToNote = true
}
const openNote = () => {
  globalStore.triggerNoteIsVisible()
}

// copy or move

const copyToSelectedSpace = async (items) => {
  state.loading = true
  const selectedSpaceId = state.selectedSpace.id
  items = offsetItems(items, state.itemsOffset)
  newItems = await spaceStore.getNewItems(items, selectedSpaceId)
  newItems = utils.removeOrphanedConnections(newItems)
  // update cache
  const space = await cache.space(selectedSpaceId)
  const spaceIsCached = Boolean(space.id)
  if (!spaceIsCached) {
    await cache.saveSpace({ id: selectedSpaceId })
  }
  await cache.addToSpace(newItems, selectedSpaceId)
  // update server
  for (const list of newItems.lists) {
    list.shouldUpdateList = true
    await apiStore.addToQueue({ name: 'createList', body: list, spaceId: selectedSpaceId })
  }
  for (const card of newItems.cards) {
    await apiStore.addToQueue({ name: 'createCard', body: card, spaceId: selectedSpaceId })
  }
  for (const connection of newItems.connections) {
    await apiStore.addToQueue({ name: 'createConnection', body: connection, spaceId: selectedSpaceId })
  }
  for (const box of newItems.boxes) {
    await apiStore.addToQueue({ name: 'createBox', body: box, spaceId: selectedSpaceId })
  }
  for (const line of newItems.lines) {
    await apiStore.addToQueue({ name: 'createLine', body: line, spaceId: selectedSpaceId })
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
  }
  userStore.updateUserCardsCreatedCount(items.cards)
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
const isCardsCreatedIsOverLimit = () => {
  if (props.actionIsMove) { return }
  const items = selectedItems.value.cards.length
  return userStore.getUserCardsCreatedWillBeOverLimit(items)
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
  section.title-section
    .row.title-row
      span {{actionLabelCapitalized}} to
      div
        //- copy to note
        .button-wrap(v-if="!actionIsMove && text && canEditSpace")
          button.small-button(@click.left="copyToNote" title="Copy to Sidebar Note")
            img.icon.note(src="@/assets/note.svg")
        //- copy to clipboard
        .button-wrap(v-if="!actionIsMove && text")
          button.small-button(@click.left="copyText" title="Copy to Clipboard")
            img.icon.copy(src="@/assets/copy.svg")
            span Clipboard
    .row.badge.success.copied-to-note(v-if="state.isCopiedToNote")
      p Copied to Note
      button.small-button(title="Open Sidebar Note" @click="openNote")
        img.icon.note(src="@/assets/note.svg")
        span Open
  section
    //- space picker
    .row
      .button-wrap
        button(@click.left.stop="toggleSpacePickerIsVisible" :class="{active: state.spacePickerIsVisible}")
          img.preview-thumbnail-image(v-if="state.selectedSpace.previewThumbnailImage && isOnline" :src="state.selectedSpace.previewThumbnailImage")
          span {{state.selectedSpace.name}}
          img.icon.down-arrow(src="@/assets/down-arrow.svg")
        SpacePicker(:visible="state.spacePickerIsVisible" :selectedSpace="state.selectedSpace" :shouldShowNewSpace="true" @selectSpace="updateSelectedSpace" :showUserIfCurrentUserIsCollaborator="true" :shouldExcludeCurrentSpace="true")

    //- minimap
    .row.minimap-row(v-if="state.selectedSpaceData")
      MinimapCanvas(:visible="true" :space="state.selectedSpaceData" :selectedItems="currentOffsetItems" :size="210" :pageWidth="minimapPageSize.width" :pageHeight="minimapPageSize.height" :viewportRect="minimapViewportRect" @updateViewportRectPosition="updateItemsOffset" :preventAnimation="true" :shouldPulseViewport="true" :parentIsDialog="true" :shouldDrawBackgroundImage="true")
      Loader(:visible="state.isLoading")
    .row(v-else-if="state.isLoading")
      Loader(:visible="true")

    //- recent spaces
    //- .row.recent-spaces-row(v-if="recentSpaces.length")
    //-   .badge.secondary.button-badge(v-for="recentSpace in recentSpaces" :key="recentSpace.id" @click="updateSelectedSpace(recentSpace)" :class="{active: selectedSpaceIsRecentSpace(recentSpace)}")
    //-     span {{recentSpace.name}}
    //- submit button
    button(@click.left="moveOrCopyToSpace" :class="{active: state.loading}")
      img.icon.cut(v-if="actionIsMove" src="@/assets/cut.svg")
      img.icon.copy(v-else src="@/assets/copy.svg")
      span {{buttonLabel}}
      Loader(:visible="state.loading")

  //- error
  section.error-card-limit(v-if="state.cardsCreatedIsOverLimit")
    .badge.danger Out of Cards
    p To add more cards you'll need to upgrade
    button(@click.left.stop="triggerUpgradeUserIsVisible") Upgrade for Unlimited
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
  .minimap-row
    position relative
    .loader
      position absolute
      top 4px
      right 4px
  .copied-to-note
    margin-right 0
    justify-content space-between
    button
      margin 0
      margin-left 6px
</style>
