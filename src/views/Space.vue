<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Card from '@/components/Card.vue'
import CardDetails from '@/components/dialogs/CardDetails.vue'
import OtherCardDetails from '@/components/dialogs/OtherCardDetails.vue'
import BoxDetails from '@/components/dialogs/BoxDetails.vue'
import ConnectionDetails from '@/components/dialogs/ConnectionDetails.vue'
import CodeLanguagePicker from '@/components/dialogs/CodeLanguagePicker.vue'
import MultipleSelectedActions from '@/components/dialogs/MultipleSelectedActions.vue'
import ScrollAtEdgesHandler from '@/components/ScrollAtEdgesHandler.vue'
import NotificationsWithPosition from '@/components/NotificationsWithPosition.vue'
import BoxSelecting from '@/components/BoxSelecting.vue'
import Boxes from '@/components/Boxes.vue'
import Cards from '@/components/Cards.vue'
import Connections from '@/components/Connections.vue'
import ItemUnlockButtons from '@/components/ItemUnlockButtons.vue'
import SnapGuideLines from '@/components/SnapGuideLines.vue'

import Header from '@/components/Header.vue'
import MainCanvas from '@/components/layers/MainCanvas.vue'
import SonarPing from '@/components/layers/SonarPing.vue'
import UserLabelCursor from '@/components/UserLabelCursor.vue'
import Footer from '@/components/Footer.vue'
import WindowHistoryHandler from '@/components/WindowHistoryHandler.vue'
import KeyboardShortcutsHandler from '@/components/KeyboardShortcutsHandler.vue'
import ScrollAndTouchHandler from '@/components/ScrollAndTouchHandler.vue'
import Panning from '@/components/Panning.vue'
import TagDetails from '@/components/dialogs/TagDetails.vue'
import ItemsLocked from '@/components/ItemsLocked.vue'
import UserDetails from '@/components/dialogs/UserDetails.vue'
import SpaceBackground from '@/components/SpaceBackground.vue'
import SpaceBackgroundTint from '@/components/SpaceBackgroundTint.vue'
import OutsideSpaceBackground from '@/components/OutsideSpaceBackground.vue'
import Preload from '@/components/Preload.vue'

import utils from '@/utils.js'
import cache from '@/cache.js'
import consts from '@/consts.js'

import sortBy from 'lodash-es/sortBy'
import uniq from 'lodash-es/uniq'
import debounce from 'lodash-es/debounce'

const store = useStore()

let unsubscribe

let prevCursor, endCursor, shouldCancel
let processQueueIntervalTimer, hourlyTasks

// init user and space app state
const init = async () => {
  store.dispatch('api/updateDateImage')
  store.dispatch('analytics/event', 'pageview')
  await cache.migrateFromLocalStorage()
  await store.dispatch('currentUser/init')
  await store.dispatch('currentSpace/init')
  await store.commit('broadcast/connect')
  await store.dispatch('groups/init')
  await store.dispatch('updateTags')
}
init()

onMounted(() => {
  // bind events to window to receive events when mouse is outside window
  window.addEventListener('touchstart', handleTouchStart)
  window.addEventListener('mousemove', interact)
  window.addEventListener('touchmove', interact)
  window.addEventListener('mouseup', stopInteractions)
  window.addEventListener('touchend', handleTouchEnd)
  window.addEventListener('visibilitychange', handleTouchEnd)
  // update viewport size
  window.addEventListener('touchend', updateViewportSizes)
  window.addEventListener('gesturecancel', updateViewportSizes)
  window.addEventListener('resize', updateViewportSizes)
  updateViewportSizes()
  // when a card is added through Add.vue in a sharesheet with the space open behind it
  window.addEventListener('message', addCardFromOutsideAppContext)
  // load space tasks
  window.addEventListener('beforeunload', unloadPage)
  window.addEventListener('popstate', loadSpaceOnBackOrForward)
  document.fonts.ready.then(event => {
    store.commit('webfontIsLoaded', true)
  })
  store.dispatch('currentUser/restoreUserFavorites')
  unsubscribe = store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerRestoreSpaceRemoteComplete') {
      dragItemsOnNextTick()
    }
  })
  updateIconsNotDraggable()

  setTimeout(() => {
    store.dispatch('currentSpace/updateInboxCache')
  }, 15000) // 15 seconds after mounted

  // ⏰ scheduled tasks
  // retry failed sync operations
  processQueueIntervalTimer = setInterval(() => {
    store.dispatch('api/sendQueue')
  }, 5000) // every 5 seconds
  // update inbox space in local storage, one time
  hourlyTasks = setInterval(() => {
    store.dispatch('currentSpace/updateInboxCache')
    store.dispatch('api/updateDateImage')
  }, 1000 * 60 * 60 * 1) // every 1 hour
})

onBeforeUnmount(() => {
  unsubscribe()
  window.removeEventListener('mousemove', interact)
  window.removeEventListener('touchmove', interact)
  window.removeEventListener('mouseup', stopInteractions)
  window.removeEventListener('touchend', handleTouchEnd)
  window.removeEventListener('visibilitychange', handleTouchEnd)
  window.removeEventListener('beforeunload', unloadPage)
  window.removeEventListener('message', addCardFromOutsideAppContext)
  window.removeEventListener('popstate', loadSpaceOnBackOrForward)
  window.removeEventListener('touchend', updateViewportSizes)
  window.removeEventListener('gesturecancel', updateViewportSizes)
  window.removeEventListener('resize', updateViewportSizes)
  clearInterval(processQueueIntervalTimer)
  clearInterval(hourlyTasks)
})

const state = reactive({
  startCursor: {}
})

const unlockedCards = computed(() => store.getters['currentCards/isNotLocked'])
const isPainting = computed(() => store.state.currentUserIsPainting)
const isPanningReady = computed(() => store.state.currentUserIsPanningReady)
const spaceIsReadOnly = computed(() => !store.getters['currentUser/canEditSpace']())
const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const isDrawingConnection = computed(() => store.state.currentUserIsDrawingConnection)
const isResizingCard = computed(() => store.state.currentUserIsResizingCard)
const isTiltingCard = computed(() => store.state.currentUserIsTiltingCard)
const isDraggingCard = computed(() => store.state.currentUserIsDraggingCard)
const isResizingBox = computed(() => store.state.currentUserIsResizingBox)
const isDraggingBox = computed(() => store.state.currentUserIsDraggingBox)

// page size

watch(() => store.state.currentUserIsDraggingCard, (value, prevValue) => {
  updatePageSizeFromMutation(value)
})
watch(() => store.state.currentUserIsResizingCard, (value, prevValue) => {
  updatePageSizeFromMutation(value)
  if (prevValue && !value) {
    afterResizeCards()
  }
})
watch(() => store.state.currentUserIsDraggingBox, (value, prevValue) => {
  updatePageSizeFromMutation(value)
})
watch(() => store.state.currentUserIsResizingBox, (value, prevValue) => {
  updatePageSizeFromMutation(value)
  if (prevValue && !value) {
    afterResizeBoxes()
  }
})
const updatePageSizeFromMutation = (value) => {
  if (!value) {
    store.dispatch('updatePageSizes')
  }
}
const updateViewportSizes = () => {
  store.dispatch('updateViewportSizes')
}

// user

const currentUser = computed(() => store.state.currentUser)
const users = computed(() => {
  const excludeCurrentUser = true
  return store.getters['currentSpace/allUsers'](excludeCurrentUser)
})

// styles

const spaceZoomDecimal = computed(() => store.getters.spaceZoomDecimal)
const pageHeight = computed(() => store.state.pageHeight)
const pageWidth = computed(() => store.state.pageWidth)
const styles = computed(() => {
  const zoom = 1 / spaceZoomDecimal.value
  let styles = {
    width: `${pageWidth.value * zoom}px`,
    height: `${pageHeight.value * zoom}px`,
    transform: store.getters.zoomTransform
  }
  if (zoom !== 1) {
    styles.willChange = 'transform'
  }
  return styles
})

// page history

const loadSpaceOnBackOrForward = (event) => {
  const url = window.location.href
  if (!utils.urlIsSpace(url)) { return }
  const spaceId = utils.spaceIdFromUrl(url)
  const space = { id: spaceId }
  store.dispatch('currentSpace/loadSpace', { space })
}
const unloadPage = () => {
  store.commit('broadcast/close')
  store.dispatch('currentSpace/removeEmptyCards')
  store.commit('triggerUnloadPage')
}

// cards

const addCard = (event) => {
  let position = utils.cursorPositionInSpace(event)
  const isParentCard = true
  position = {
    x: position.x,
    y: position.y
  }
  store.dispatch('currentUser/notifyReadOnly', position)
  if (spaceIsReadOnly.value) { return }
  store.dispatch('currentCards/add', { position, isParentCard })
  store.commit('childCardId', '')
}
const addOrCloseCard = (event) => {
  const sidebarIsVisible = window.document.querySelector('dialog#sidebar')
  if (store.state.shouldAddCard) {
    let position = utils.cursorPositionInSpace(event)
    // prevent addCard if position is outside space
    if (utils.isPositionOutsideOfSpace(position)) {
      position = utils.cursorPositionInPage(event)
      store.commit('addNotificationWithPosition', { message: 'Outside Space', position, type: 'info', icon: 'cancel', layer: 'app' })
      return
    }
    // add card
    addCard(event)
  // close item details
  } else if ((store.state.cardDetailsIsVisibleForCardId || store.state.boxDetailsIsVisibleForBoxId) && !sidebarIsVisible) {
    store.dispatch('closeAllDialogs')
  }
}
const tiltCards = (event) => {
  if (!prevCursor) { return }
  if (utils.isMultiTouch(event)) { return }
  const cardIds = store.state.currentUserIsTiltingCardIds
  let delta = utils.distanceBetweenTwoPoints(endCursor, prevCursor)
  if (endCursor.x - prevCursor.x > 0 || endCursor.y - prevCursor.y > 0) {
    delta = -delta
  }
  store.dispatch('currentCards/tilt', { cardIds, delta })
}
const stopTiltingCards = () => {
  if (!store.state.currentUserIsTiltingCard) { return }
  store.dispatch('history/resume')
  const cardIds = store.state.currentUserIsTiltingCardIds
  const cards = cardIds.map(id => store.getters['currentCards/byId'](id))
  store.dispatch('currentCards/updateDimensions', { cards })
  store.dispatch('history/add', { cards, useSnapshot: true })
  store.commit('currentUserIsTiltingCard', false)
  store.commit('broadcast/updateStore', { updates: { userId: currentUser.value.id }, type: 'removeRemoteUserTiltingCards' })
}
const resizeCards = (event) => {
  if (!prevCursor) { return }
  if (utils.isMultiTouch(event)) { return }
  const cardIds = store.state.currentUserIsResizingCardIds
  let deltaX = endCursor.x - prevCursor.x
  store.dispatch('currentCards/resize', { cardIds, deltaX })
}
const stopResizingCards = () => {
  if (!store.state.currentUserIsResizingCard) { return }
  store.dispatch('history/resume')
  const cardIds = store.state.currentUserIsResizingCardIds
  const cards = cardIds.map(id => store.getters['currentCards/byId'](id))
  store.dispatch('history/add', { cards, useSnapshot: true })
  store.commit('currentUserIsResizingCard', false)
  store.dispatch('currentCards/updateDimensions', { cards })
  store.commit('broadcast/updateStore', { updates: { userId: currentUser.value.id }, type: 'removeRemoteUserResizingCards' })
}
const afterResizeCards = () => {
  if (!store.state.shouldSnapToGrid) { return }
  const cardIds = store.state.currentUserIsResizingCardIds
  const cards = cardIds.map(cardId => {
    let { id, resizeWidth } = store.getters['currentCards/byId'](cardId)
    resizeWidth = utils.roundToNearest(resizeWidth)
    return { id, resizeWidth }
  })
  store.dispatch('currentCards/updateMultiple', cards)
}
const addCardFromOutsideAppContext = (event) => {
  if (!consts.isSecureAppContext) { return }
  const currentSpace = store.state.currentSpace
  const data = event.data
  if (data.name !== 'addedCardFromAddPage') { return }
  const card = data.value
  if (card.spaceId !== currentSpace.id) { return }
  store.commit('currentCards/create', { card, shouldPreventCache: true })
}

// boxes

const resizeBoxes = () => {
  if (!prevCursor) { return }
  const boxIds = store.getters['currentBoxes/isResizingIds']
  const zoom = store.getters.spaceCounterZoomDecimal
  let delta = {
    x: endCursor.x - prevCursor.x,
    y: endCursor.y - prevCursor.y
  }
  delta = {
    x: Math.round(delta.x * zoom),
    y: Math.round(delta.y * zoom)
  }
  store.dispatch('currentBoxes/resize', { boxIds, delta })
}
const stopResizingBoxes = () => {
  if (!store.state.currentUserIsResizingBox) { return }
  store.dispatch('history/resume')
  const boxIds = store.getters['currentBoxes/isResizingIds']
  const boxes = boxIds.map(id => store.getters['currentBoxes/byId'](id))
  store.dispatch('currentConnections/updateMultiplePaths', boxes)
  store.dispatch('history/add', { boxes, useSnapshot: true })
  store.commit('currentUserIsResizingBox', false)
  store.dispatch('currentUserToolbar', 'card')
  store.commit('broadcast/updateStore', { updates: { userId: currentUser.value.id }, type: 'removeRemoteUserResizingBoxes' })
  store.dispatch('checkIfItemShouldIncreasePageSize', boxes[0])
}
const afterResizeBoxes = () => {
  const boxIds = store.getters['currentBoxes/isResizingIds']
  const boxes = boxIds.map(boxId => {
    let { resizeWidth, resizeHeight } = utils.boxElementDimensions({ id: boxId })
    if (store.state.shouldSnapToGrid) {
      resizeWidth = utils.roundToNearest(resizeWidth)
      resizeHeight = utils.roundToNearest(resizeHeight)
    }
    return { id: boxId, resizeWidth, resizeHeight }
  })
  store.dispatch('currentBoxes/updateMultiple', boxes)
}
const checkIfShouldSnapBoxes = (event) => {
  if (!store.state.boxesWereDragged) { return }
  if (event.shiftKey) { return }
  const snapGuides = store.state.currentBoxes.snapGuides
  if (!snapGuides.length) { return }
  snapGuides.forEach(snapGuide => {
    const elapsedTime = Date.now() - snapGuide.time
    const shouldSnap = elapsedTime >= consts.boxSnapGuideWaitingDuration
    if (!shouldSnap) { return }
    store.dispatch('currentBoxes/snap', snapGuide)
  })
}
const checkIfShouldExpandBoxes = (event) => {
  if (!store.state.cardsWereDragged) { return }
  if (event.shiftKey) { return }
  const snapGuides = store.state.currentBoxes.snapGuides
  if (!snapGuides.length) { return }
  snapGuides.forEach(snapGuide => {
    const elapsedTime = Date.now() - snapGuide.time
    const shouldSnap = elapsedTime >= consts.boxSnapGuideWaitingDuration
    if (!shouldSnap) { return }
    store.dispatch('currentBoxes/expand', snapGuide)
  })
}
const unselectCardsInDraggedBox = () => {
  if (!store.state.currentDraggingBoxId) { return }
  if (store.state.multipleBoxesSelectedIds.length) { return }
  store.dispatch('clearMultipleSelected')
}
const showBoxDetails = async (event) => {
  if (!store.state.currentBoxIsNew) { return }
  if (utils.isMobile()) { return }
  const boxId = store.state.currentUserIsResizingBoxIds[0]
  await nextTick()
  await nextTick()
  store.commit('boxDetailsIsVisibleForBoxId', boxId)
}

// drag items

const dragItemsOnNextTick = async () => {
  await nextTick()
  dragItems()
}
const dragItems = () => {
  store.dispatch('history/pause')
  const prevCursor = cursor()
  store.dispatch('currentUser/notifyReadOnly', prevCursor)
  const shouldPrevent = !store.getters['currentUser/canEditSpace']()
  if (shouldPrevent) { return }
  store.dispatch('currentCards/move', {
    endCursor,
    prevCursor: prevCursor
  })
  checkShouldShowDetails()
  store.dispatch('currentBoxes/move', {
    endCursor,
    prevCursor: prevCursor
  })
}

// footer

const footerDialogIsVisible = () => {
  const activeFooterButton = document.querySelector('footer button.active')
  return Boolean(activeFooterButton)
}
const checkIfShouldHideFooter = (event) => {
  if (event.target.nodeType !== 1) { return } // firefox check
  const isTouchDevice = store.state.isTouchDevice
  if (!isTouchDevice) { return }
  const node = event.target.nodeName
  const isTextarea = node === 'TEXTAREA'
  const isInput = node === 'INPUT'
  if (footerDialogIsVisible()) {
    store.commit('shouldHideFooter', false)
  } else if (isTextarea || isInput) {
    store.commit('shouldHideFooter', true)
  } else {
    store.commit('shouldHideFooter', false)
  }
}

// multiple selected actions dialog

const showMultipleSelectedActions = (event) => {
  if (spaceIsReadOnly.value) { return }
  if (store.state.preventMultipleSelectedActionsIsVisible) { return }
  const isMultipleSelected = store.state.multipleCardsSelectedIds.length || store.state.multipleConnectionsSelectedIds.length || store.state.multipleBoxesSelectedIds.length
  if (isMultipleSelected) {
    const position = utils.cursorPositionInSpace(event)
    store.commit('multipleSelectedActionsPosition', position)
    store.commit('multipleSelectedActionsIsVisible', true)
  }
}

// interactions

const isInteracting = computed(() => {
  if (isDraggingCard.value || isDrawingConnection.value || isResizingCard.value || isResizingBox.value || isDraggingBox.value) {
    store.commit('preventMultipleSelectedActionsIsVisible', true)
    return true
  } else { return false }
})
const blurButtonClick = (event) => {
  const isMouseOrTouchEvent = event.type.includes('mouse') || event.type.includes('touch')
  if (!isMouseOrTouchEvent) { return }
  if (!event.target.closest) { return } // event is outside window
  const isButton = event.target.closest('button')
  const isLi = event.target.closest('li')
  const isLabel = event.target.closest('label')
  if (isButton || isLi || isLabel) {
    event.target.blur()
  }
}
const updateIconsNotDraggable = () => {
  const iconElements = document.querySelectorAll('img.icon')
  iconElements.forEach(element => {
    element.draggable = false
  })
}
const handleTouchStart = (event) => {
  prevCursor = utils.cursorPositionInViewport(event)
}
const initInteractions = (event) => {
  if (eventIsFromTextarea(event)) {
    shouldCancel = true
  } else {
    shouldCancel = false
  }
  if (spaceIsReadOnly.value) { return }
  state.startCursor = utils.cursorPositionInViewport(event)
}
const updateShouldSnapToGrid = (event) => {
  let shouldSnap = isDraggingCard.value || isDraggingBox.value || isResizingCard.value || isResizingBox.value
  shouldSnap = shouldSnap && event.shiftKey
  // update snap guide line origin
  if (!store.state.shouldSnapToGrid && shouldSnap) {
    const item = store.getters.currentInteractingItem
    store.commit('snapGuideLinesOrigin', {
      x: item.x,
      y: item.y
    })
  }
  // should snap to grid
  store.commit('shouldSnapToGrid', shouldSnap)
}
const interact = (event) => {
  endCursor = utils.cursorPositionInViewport(event)
  updateShouldSnapToGrid(event)
  if (isDraggingCard.value) {
    dragItems()
  } else if (isDraggingBox.value) {
    store.commit('currentDraggingCardId', '')
    dragItems()
  } else if (isResizingCard.value) {
    resizeCards(event)
  } else if (isTiltingCard.value) {
    tiltCards(event)
  } else if (isResizingBox.value) {
    resizeBoxes()
  }
  prevCursor = utils.cursorPositionInViewport(event)
}
const checkShouldShowDetails = () => {
  const shouldShow = !utils.cursorsAreClose(state.startCursor, endCursor)
  if (!shouldShow) { return }
  if (store.state.currentUserIsDraggingCard) {
    store.commit('preventDraggedCardFromShowingDetails', true)
  } else if (store.state.currentUserIsDraggingBox) {
    store.commit('preventDraggedBoxFromShowingDetails', true)
  }
}
const cursor = () => {
  const zoom = store.getters.spaceCounterZoomDecimal
  let cursor
  if (utils.objectHasKeys(prevCursor)) {
    cursor = prevCursor
  } else {
    cursor = state.startCursor
  }
  cursor = {
    x: cursor.x * zoom,
    y: cursor.y * zoom
  }
  // if shift key held down
  return cursor
}
const eventIsFromTextarea = (event) => {
  if (event.target.nodeType !== 1) { return } // firefox check
  const node = event.target.nodeName
  const isTextarea = node === 'TEXTAREA'
  const isInput = node === 'INPUT'
  if (event.srcElement.type === 'range') { return false }
  if (isTextarea || isInput) {
    return true
  }
}
const shouldCancelInteraction = (event) => {
  if (shouldCancel) {
    shouldCancel = false
    return true
  }
  if (eventIsFromTextarea(event)) { return true }
  if (!event.target.closest) { return } // event is outside window
  const fromDialog = event.target.closest('dialog')
  const fromHeader = event.target.closest('header')
  const fromFooter = event.target.closest('footer')
  return Boolean(fromDialog || fromHeader || fromFooter)
}

// 💣 stopInteractions and Space/stopPainting are run after all mouse and touch end events

const isDevelpmentBadgeVisible = computed(() => {
  if (store.state.isPresentationMode) { return }
  return consts.isDevelopment()
})
const handleTouchEnd = (event) => {
  store.commit('isPinchZooming', false)
  store.commit('isTouchScrolling', false)
  stopInteractions(event)
}
const stopInteractions = async (event) => {
  console.log('💣 stopInteractions')
  const isCardsSelected = store.state.currentDraggingCardId || store.state.multipleCardsSelectedIds.length
  const isBoxesSelected = store.state.multipleBoxesSelectedIds
  if (isCardsSelected && store.state.cardsWereDragged) {
    store.dispatch('currentCards/afterMove')
  }
  if (isBoxesSelected && store.state.boxesWereDragged) {
    store.dispatch('currentBoxes/afterMove')
  }
  updateIconsNotDraggable()
  blurButtonClick(event)
  if (event.touches) {
    store.commit('triggerUpdateHeaderAndFooterPosition')
  }
  checkIfShouldHideFooter(event)
  checkIfShouldSnapBoxes(event)
  checkIfShouldExpandBoxes(event)
  if (shouldCancelInteraction(event)) { return }
  addOrCloseCard(event)
  unselectCardsInDraggedBox()
  showMultipleSelectedActions(event)
  showBoxDetails(event)
  store.commit('preventMultipleSelectedActionsIsVisible', false)
  store.commit('importArenaChannelIsVisible', false)
  store.commit('shouldAddCard', false)
  store.commit('preventDraggedCardFromShowingDetails', false)
  store.commit('preventDraggedBoxFromShowingDetails', false)
  stopResizingCards()
  stopTiltingCards()
  stopResizingBoxes()
  store.commit('currentUserIsPainting', false)
  store.commit('currentUserIsPaintingLocked', false)
  store.commit('currentUserIsDraggingCard', false)
  store.commit('currentUserIsDraggingBox', false)
  store.commit('boxesWereDragged', false)
  store.commit('cardsWereDragged', false)
  store.commit('prevCursorPosition', utils.cursorPositionInPage(event))
  prevCursor = undefined
  store.commit('clearDraggingItems')
  await nextTick()
  await nextTick()
  store.commit('clearShouldExplicitlyRenderCardIds', null, { root: true })
  store.commit('shouldSnapToGrid', false)
}
</script>

<template lang="pug">
//- page
OutsideSpaceBackground
//- user presence cursors
template(v-for="user in users")
  UserLabelCursor(:user="user")
//- space
main#space.space(
  :class="{'is-interacting': isInteracting, 'is-not-interacting': isPainting || isPanningReady}"
  @mousedown.left="initInteractions"
  @touchstart="initInteractions"
  :style="styles"
  :data-zoom="spaceZoomDecimal"
)
  SpaceBackground
  SpaceBackgroundTint
  ItemsLocked
  Boxes
  Connections
  Cards
  ItemUnlockButtons
  BoxDetails
  CardDetails
  OtherCardDetails
  ConnectionDetails
  CodeLanguagePicker
  MultipleSelectedActions
  ScrollAtEdgesHandler
  NotificationsWithPosition(layer="space")
  BoxSelecting
  SnapGuideLines
aside
  MainCanvas
  SonarPing
//- page ui, dialogs
Header
Footer
TagDetails
UserDetails
//- handlers
WindowHistoryHandler
KeyboardShortcutsHandler
ScrollAndTouchHandler
Panning
NotificationsWithPosition(layer="app")
Preload
.badge.label-badge.development-badge(v-if="isDevelpmentBadgeVisible")
  span DEV
</template>

<style lang="stylus">
.space
  width 100%
  height 100vh
  pointer-events none // so that painting can receive events
  position relative // used by svg connections
  transform-origin top left
  z-index 0
  .card-overlap-indicator
    position absolute
    z-index calc(var(--max-z) - 70)
    pointer-events all
    cursor pointer
    span
      line-height 1.5

.is-interacting
  pointer-events all
.is-not-interacting
  *
    pointer-events none !important
    cursor default

</style>
