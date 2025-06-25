<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useAnalyticsStore } from '@/stores/useAnalyticsStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'
import { useHistoryStore } from '@/stores/useHistoryStore'

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
import PaintSelectCanvas from '@/components/layers/PaintSelectCanvas.vue'
import DrawingCanvas from '@/components/layers/DrawingCanvas.vue'
import DrawingCanvasBackground from '@/components/layers/DrawingCanvasBackground.vue'
import DrawingHandler from '@/components/layers/DrawingHandler.vue'
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
import MinimapCanvas from '@/components/MinimapCanvas.vue'

import utils from '@/utils.js'
import cache from '@/cache.js'
import consts from '@/consts.js'

import sortBy from 'lodash-es/sortBy'
import uniq from 'lodash-es/uniq'
import debounce from 'lodash-es/debounce'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const connectionStore = useConnectionStore()
const boxStore = useBoxStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()
const groupStore = useGroupStore()
const analyticsStore = useAnalyticsStore()
const broadcastStore = useBroadcastStore()
const historyStore = useHistoryStore()

let unsubscribes

let prevCursor, endCursor, shouldCancel
let processQueueIntervalTimer, hourlyTasks

// expose pinia stores to browser console for developers
window.globalStore = useGlobalStore()
window.cardStore = useCardStore()
window.connectionStore = useConnectionStore()
window.boxStore = useBoxStore()
window.spaceStore = useSpaceStore()
window.groupStore = useGroupStore()
if (consts.isDevelopment()) {
  window.userStore = useUserStore()
  window.historyStore = useHistoryStore()
}
console.info('🍍 Pinia stores: window.globalStore, window.spaceStore, window.cardStore, window.boxStore, window.groupStore')

// init user and space app state
const init = async () => {
  if (globalStore.shouldNotifyIsJoiningGroup) {
    globalStore.updateNotifyIsJoiningGroup(true)
  }
  apiStore.updateDateImage()
  analyticsStore.event('pageview')
  await cache.migrateFromLocalStorage() // legacy
  await spaceStore.initializeSpace()
  // broadcastStore.connect()
  await groupStore.initializeGroups()
  await globalStore.updateTags()
  checkIfShouldShowExploreOnLoad()
  historyStore.init()
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
    globalStore.webfontIsLoaded = true
  })
  updateIconsNotDraggable()
  setTimeout(() => {
    spaceStore.updateInboxCache()
  }, 15000) // 15 seconds after mounted

  // ⏰ scheduled tasks
  // retry failed sync operations
  processQueueIntervalTimer = setInterval(() => {
    apiStore.sendQueue()
  }, 5000) // every 5 seconds
  // update inbox space in local storage, one time
  hourlyTasks = setInterval(() => {
    spaceStore.updateInboxCache()
    apiStore.updateDateImage()
  }, 1000 * 60 * 60 * 1) // every 1 hour

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerAddBox') {
        const event = args[0]
        addBox(event)
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})

onBeforeUnmount(() => {
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
  unsubscribes()
})

const state = reactive({
  startCursor: {}
})

const unlockedCards = computed(() => cardStore.getCardsIsNotLocked)
const isPainting = computed(() => globalStore.currentUserIsPainting)
const isPanningReady = computed(() => globalStore.currentUserIsPanningReady)
const isPanning = computed(() => globalStore.currentUserIsPanning)
const spaceIsReadOnly = computed(() => !userStore.getUserCanEditSpace)
const canEditSpace = computed(() => userStore.getUserCanEditSpace)
const isDrawingConnection = computed(() => globalStore.currentUserIsDrawingConnection)
const isResizingCard = computed(() => globalStore.currentUserIsResizingCard)
const isTiltingCard = computed(() => globalStore.currentUserIsTiltingCard)
const isDraggingCard = computed(() => globalStore.currentUserIsDraggingCard)
const isResizingBox = computed(() => globalStore.currentUserIsResizingBox)
const isDraggingBox = computed(() => globalStore.currentUserIsDraggingBox)
const checkIfShouldShowExploreOnLoad = () => {
  const shouldShow = globalStore.shouldShowExploreOnLoad
  if (shouldShow) {
    globalStore.triggerExploreIsVisible()
  }
  globalStore.shouldShowExploreOnLoad = false
}

// page size

watch(() => globalStore.currentUserIsDraggingCard, (value, prevValue) => {
  updatePageSizes(value)
})
watch(() => globalStore.currentUserIsResizingCard, (value, prevValue) => {
  if (prevValue && !value) {
    afterResizeCards()
  }
  updatePageSizes(value)
})
watch(() => globalStore.currentUserIsDraggingBox, (value, prevValue) => {
  updatePageSizes(value)
})

const updatePageSizes = async (value) => {
  if (!value) {
    await nextTick()
    globalStore.updatePageSizes()
  }
}
const updateViewportSizes = () => {
  globalStore.updateViewportSizes()
}

// user

const currentUser = computed(() => userStore.getUserAllState)
const users = computed(() => {
  let users = spaceStore.getSpaceAllUsers
  users = utils.excludeCurrentUser(users, userStore.id)
  return users
})

// styles

const spaceZoomDecimal = computed(() => globalStore.getSpaceZoomDecimal)
const pageHeight = computed(() => globalStore.pageHeight)
const pageWidth = computed(() => globalStore.pageWidth)
const styles = computed(() => {
  const zoom = globalStore.getSpaceCounterZoomDecimal
  return {
    width: `${pageWidth.value * zoom}px`,
    height: `${pageHeight.value * zoom}px`,
    transform: globalStore.getZoomTransform
  }
})

// page history

const loadSpaceOnBackOrForward = (event) => {
  const url = window.location.href
  if (!utils.urlIsSpace(url)) { return }
  const spaceId = utils.spaceIdFromUrl(url)
  const space = { id: spaceId }
  spaceStore.loadSpace(space)
}
const unloadPage = () => {
  broadcastStore.close()
  spaceStore.removeEmptyCards()
  globalStore.triggerUnloadPage()
}

// cards

const addCard = (event) => {
  let position = utils.cursorPositionInSpace(event)
  const isParentCard = true
  position = {
    x: position.x,
    y: position.y
  }
  userStore.notifyReadOnly(position)
  if (spaceIsReadOnly.value) { return }
  const newCard = { position, isParentCard }
  cardStore.createCard(newCard)
  globalStore.childCardId = ''
}
const addOrCloseCard = (event) => {
  const sidebarIsVisible = window.document.querySelector('dialog#sidebar')
  if (globalStore.shouldAddCard) {
    let position = utils.cursorPositionInSpace(event)
    // prevent addCard if position is outside space
    if (utils.isPositionOutsideOfSpace(position)) {
      position = utils.cursorPositionInPage(event)
      globalStore.addNotificationWithPosition({ message: 'Outside Space', position, type: 'info', icon: 'cancel', layer: 'app' })
      return
    }
    // add card
    addCard(event)
  // close item details
  } else if ((globalStore.cardDetailsIsVisibleForCardId || globalStore.boxDetailsIsVisibleForBoxId) && !sidebarIsVisible) {
    globalStore.closeAllDialogs()
  }
}
const tiltCards = (event) => {
  if (!prevCursor) { return }
  if (utils.isMultiTouch(event)) { return }
  const cardIds = globalStore.currentUserIsTiltingCardIds
  let delta = utils.distanceBetweenTwoPoints(endCursor, prevCursor)
  if (endCursor.x - prevCursor.x > 0 || endCursor.y - prevCursor.y > 0) {
    delta = -delta
  }
  cardStore.tiltCards(cardIds, delta)
}
const stopTiltingCards = () => {
  if (!globalStore.currentUserIsTiltingCard) { return }
  const cardIds = globalStore.currentUserIsTiltingCardIds
  cardStore.updateCardsDimensions(cardIds)
  const cards = cardIds.map(id => cardStore.getCard(id))
  globalStore.currentUserIsTiltingCard = false
  broadcastStore.update({ updates: { userId: currentUser.value.id }, action: 'removeRemoteUserTiltingCards' })
}
const resizeCards = (event) => {
  if (!prevCursor) { return }
  if (utils.isMultiTouch(event)) { return }
  const cardIds = globalStore.currentUserIsResizingCardIds
  const deltaX = endCursor.x - prevCursor.x
  cardStore.resizeCards(cardIds, deltaX)
}
const stopResizingCards = async () => {
  if (!globalStore.currentUserIsResizingCard) { return }
  const cardIds = globalStore.currentUserIsResizingCardIds
  const cards = cardIds.map(id => cardStore.getCard(id))
  await cardStore.updateCardsDimensions(cardIds)
  globalStore.currentUserIsResizingCard = false
  broadcastStore.update({ updates: { userId: currentUser.value.id }, action: 'removeRemoteUserResizingCards' })
}
const afterResizeCards = () => {
  if (!globalStore.shouldSnapToGrid) { return }
  const cardIds = globalStore.currentUserIsResizingCardIds
  const cards = cardIds.map(cardId => {
    let { id, resizeWidth } = cardStore.getCard(cardId)
    resizeWidth = utils.roundToNearest(resizeWidth)
    return { id, resizeWidth }
  })
  cardStore.updateCards(cards)
}
const addCardFromOutsideAppContext = (event) => {
  if (!consts.isSecureAppContext) { return }
  const currentSpace = spaceStore.getSpaceAllState
  const data = event.data
  if (data.name !== 'addedCardFromAddPage') { return }
  const card = data.value
  if (card.spaceId !== currentSpace.id) { return }
  cardStore.createCard(card)
}

// boxes

const addBox = (event) => {
  let position = utils.cursorPositionInSpace(event)
  if (utils.isPositionOutsideOfSpace(position)) {
    position = utils.cursorPositionInPage(event)
    globalStore.addNotificationWithPosition({ message: 'Outside Space', position, type: 'info', icon: 'cancel', layer: 'app' })
    return
  }
  userStore.notifyReadOnly(position)
  const shouldPrevent = !userStore.getUserCanEditSpace
  if (shouldPrevent) {
    globalStore.updateCurrentUserToolbar('card')
    return
  }
  const isResizing = true
  boxStore.createBox(position, isResizing)
  globalStore.currentBoxIsNew = true
  event.preventDefault() // allows dragging boxes without scrolling on touch
}
const resizeBoxes = () => {
  if (!prevCursor) { return }
  const boxes = boxStore.getBoxesResizing
  const ids = boxes.map(box => box.id)

  const zoom = globalStore.getSpaceCounterZoomDecimal
  let delta = {
    x: endCursor.x - prevCursor.x,
    y: endCursor.y - prevCursor.y
  }
  delta = {
    x: Math.round(delta.x * zoom),
    y: Math.round(delta.y * zoom)
  }
  boxStore.resizeBoxes(ids, delta)
}
const stopResizingBoxes = () => {
  if (!globalStore.currentUserIsResizingBox) { return }
  globalStore.currentUserIsResizingBox = false
  globalStore.updateCurrentUserToolbar('card')
  broadcastStore.update({ updates: { userId: currentUser.value.id }, action: 'removeRemoteUserResizingBoxes' })
  // globalStore.checkIfItemShouldIncreasePageSize(boxes[0])
}
const checkIfShouldSnapBoxes = (event) => {
  if (!globalStore.boxesWereDragged) { return }
  if (event.shiftKey) { return }
  const snapGuides = boxStore.boxSnapGuides
  if (!snapGuides.length) { return }
  snapGuides.forEach(snapGuide => {
    if (!globalStore.notifyBoxSnappingIsReady) { return }
    boxStore.updateBoxSnapToPosition(snapGuide)
  })
}
const checkIfShouldExpandBoxes = (event) => {
  if (!globalStore.cardsWereDragged) { return }
  if (event.shiftKey) { return }
  const snapGuides = boxStore.boxSnapGuides
  if (!snapGuides.length) { return }
  snapGuides.forEach(snapGuide => {
    if (!globalStore.notifyBoxSnappingIsReady) { return }
    console.log(snapGuide)
    boxStore.updateBoxSnapToSize(snapGuide)
  })
}
const unselectCardsInDraggedBox = () => {
  if (!globalStore.currentDraggingBoxId) { return }
  if (globalStore.multipleBoxesSelectedIds.length) { return }
  globalStore.clearMultipleSelected()
}
const showBoxDetails = async (event) => {
  if (!globalStore.currentBoxIsNew) { return }
  if (utils.isMobile()) { return }
  const boxId = globalStore.currentUserIsResizingBoxIds[0]
  await nextTick()
  await nextTick()
  updateSizeForNewBox(boxId)
  globalStore.updateBoxDetailsIsVisibleForBoxId(boxId)
}
const updateSizeForNewBox = (boxId) => {
  const box = boxStore.getBox(boxId)
  const isMinSize = box.resizeWidth === consts.minBoxSize && box.resizeHeight === consts.minBoxSize
  if (!isMinSize) { return }
  const update = {
    id: box.id,
    resizeWidth: consts.defaultBoxWidth,
    resizeHeight: consts.defaultBoxHeight
  }
  boxStore.updateBox(update)
}

// drag items

const dragItemsOnNextTick = async () => {
  await nextTick()
  dragItems()
}
const dragItems = () => {
  userStore.notifyReadOnly(prevCursor)
  const shouldPrevent = !userStore.getUserCanEditSpace
  if (shouldPrevent) { return }
  // cards
  cardStore.moveCards({ endCursor, prevCursor })
  // boxes
  checkShouldShowDetails()
  boxStore.moveBoxes({ endCursor, prevCursor })
}
const dragBoxes = (event) => {
  const isInitialDrag = !globalStore.boxesWereDragged
  if (isInitialDrag) {
    const updates = {
      boxId: globalStore.currentDraggingBoxId,
      userId: userStore.id
    }
    broadcastStore.update({ updates, action: 'addToRemoteBoxesDragging' })
    boxStore.selectItemsInSelectedBoxes()
  }
  if (event.altKey) { return } // should not select contained items if alt/option key
  dragItems()
}
// footer

const footerDialogIsVisible = () => {
  const activeFooterButton = document.querySelector('footer button.active')
  return Boolean(activeFooterButton)
}
const checkIfShouldHideFooter = (event) => {
  if (event.target.nodeType !== 1) { return } // firefox check
  const isTouchDevice = globalStore.isTouchDevice
  if (!isTouchDevice) { return }
  const node = event.target.nodeName
  const isTextarea = node === 'TEXTAREA'
  const isInput = node === 'INPUT'
  if (footerDialogIsVisible()) {
    globalStore.shouldHideFooter = false
  } else if (isTextarea || isInput) {
    globalStore.shouldHideFooter = true
  } else {
    globalStore.shouldHideFooter = false
  }
}

// multiple selected actions dialog

const showMultipleSelectedActions = (event) => {
  if (spaceIsReadOnly.value) { return }
  if (globalStore.preventMultipleSelectedActionsIsVisible) { return }
  const isMultipleSelected = globalStore.multipleCardsSelectedIds.length || globalStore.multipleConnectionsSelectedIds.length || globalStore.multipleBoxesSelectedIds.length
  if (isMultipleSelected) {
    const position = utils.cursorPositionInSpace(event)
    globalStore.multipleSelectedActionsPosition = position
    globalStore.updateMultipleSelectedActionsIsVisible(true)
  }
}

// minimap

const minimapIsVisible = computed(() => isPanningReady.value || isPanning.value)

// interactions

const isInteracting = computed(() => {
  return isDraggingCard.value || isDrawingConnection.value || isResizingCard.value || isResizingBox.value || isDraggingBox.value
})
watch(() => isInteracting.value, (value, prevValue) => {
  if (value) {
    globalStore.preventMultipleSelectedActionsIsVisible = true
  }
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
  if (!globalStore.shouldSnapToGrid && shouldSnap) {
    const item = globalStore.getCurrentInteractingItem
    globalStore.snapGuideLinesOrigin = {
      x: item.x,
      y: item.y
    }
  }
  // should snap to grid
  globalStore.shouldSnapToGrid = shouldSnap
}
const interact = (event) => {
  endCursor = utils.cursorPositionInViewport(event)
  updateShouldSnapToGrid(event)
  if (isDraggingCard.value) {
    dragItems()
  } else if (isDraggingBox.value) {
    globalStore.currentDraggingCardId = ''
    dragBoxes(event)
  } else if (isResizingCard.value) {
    resizeCards(event)
  } else if (isTiltingCard.value) {
    tiltCards(event)
  } else if (isResizingBox.value) {
    resizeBoxes()
  }
  prevCursor = endCursor
}
const checkShouldShowDetails = () => {
  const shouldShow = !utils.cursorsAreClose(state.startCursor, endCursor)
  if (!shouldShow) { return }
  if (globalStore.currentUserIsDraggingCard) {
    globalStore.preventDraggedCardFromShowingDetails = true
  } else if (globalStore.currentUserIsDraggingBox) {
    globalStore.preventDraggedBoxFromShowingDetails = true
  }
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
  if (globalStore.shouldCancelNextMouseUpInteraction) {
    globalStore.shouldCancelNextMouseUpInteraction = false
    return true
  }
  if (!event.target.closest) { return } // event is outside window
  const fromDialog = event.target.closest('dialog')
  const fromHeader = event.target.closest('header')
  const fromFooter = event.target.closest('footer')
  return Boolean(fromDialog || fromHeader || fromFooter)
}

// 💣 stopInteractions and Space/stopPainting are run after all mouse and touch end events

const isDevelpmentBadgeVisible = computed(() => {
  if (globalStore.isPresentationMode) { return }
  return consts.isDevelopment()
})
const handleTouchEnd = (event) => {
  globalStore.isPinchZooming = false
  globalStore.isTouchScrolling = false
  stopInteractions(event)
}
const stopInteractions = async (event) => {
  console.info('💣 stopInteractions')
  updateIconsNotDraggable()
  blurButtonClick(event)
  if (event.touches) {
    globalStore.triggerUpdateHeaderAndFooterPosition()
  }
  checkIfShouldHideFooter(event)
  checkIfShouldSnapBoxes(event)
  checkIfShouldExpandBoxes(event)
  if (shouldCancelInteraction(event)) { return }
  addOrCloseCard(event)
  unselectCardsInDraggedBox()
  showMultipleSelectedActions(event)
  showBoxDetails(event)
  globalStore.preventMultipleSelectedActionsIsVisible = false
  globalStore.importArenaChannelIsVisible = false
  globalStore.shouldAddCard = false
  globalStore.preventDraggedCardFromShowingDetails = false
  globalStore.preventDraggedBoxFromShowingDetails = false
  stopResizingCards()
  stopTiltingCards()
  stopResizingBoxes()
  globalStore.currentUserIsPainting = false
  globalStore.currentUserIsPaintingLocked = false
  globalStore.currentUserIsDraggingCard = false
  globalStore.currentUserIsDraggingBox = false
  globalStore.boxesWereDragged = false
  globalStore.cardsWereDragged = false
  globalStore.prevCursorPosition = utils.cursorPositionInPage(event)
  prevCursor = undefined
  globalStore.clearDraggingItems()
  await nextTick()
  await nextTick()
  globalStore.clearShouldExplicitlyRenderCardIds()
  globalStore.shouldSnapToGrid = false
  spaceStore.updateSpaceEditedAt()
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
  DrawingCanvasBackground
  ItemsLocked
  #box-backgrounds
  Connections
  Boxes
  Cards
  ItemUnlockButtons
  DrawingCanvas
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
  PaintSelectCanvas
  DrawingHandler
  SonarPing
//- page ui, dialogs
Header
Footer
TagDetails
UserDetails
#space-minimap.minimap-canvas-wrap(v-if="minimapIsVisible")
  MinimapCanvas(:visible="true" :size="200")
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

.is-interacting
  pointer-events all
.is-not-interacting
  *
    pointer-events none !important
    cursor default

.minimap-canvas-wrap
  position fixed
  right 8px
  bottom 50px

#box-backgrounds
  position absolute
  .box-background
    border-radius var(--entity-radius)
    position absolute
    z-index 0 !important
</style>
