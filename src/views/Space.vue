<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Card from '@/components/Card.vue'
import CardDetails from '@/components/dialogs/CardDetails.vue'
import OtherCardDetails from '@/components/dialogs/OtherCardDetails.vue'
import BoxDetails from '@/components/dialogs/BoxDetails.vue'
import UserLabelCursor from '@/components/UserLabelCursor.vue'
import ConnectionDetails from '@/components/dialogs/ConnectionDetails.vue'
import CodeLanguagePicker from '@/components/dialogs/CodeLanguagePicker.vue'
import MultipleSelectedActions from '@/components/dialogs/MultipleSelectedActions.vue'
import ScrollAtEdgesHandler from '@/components/ScrollAtEdgesHandler.vue'
import NotificationsWithPosition from '@/components/NotificationsWithPosition.vue'
import BoxSelecting from '@/components/BoxSelecting.vue'
import Boxes from '@/components/Boxes.vue'
import Cards from '@/components/Cards.vue'
import Connections from '@/components/Connections.vue'
import LockedItemButtons from '@/components/LockedItemButtons.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'

import sortBy from 'lodash-es/sortBy'
import uniq from 'lodash-es/uniq'
import debounce from 'lodash-es/debounce'

const store = useStore()

let prevCursor, endCursor, shouldCancel
let processQueueIntervalTimer, updateJournalDailyPromptTimer, updateInboxCache

// init user and space app state
store.dispatch('currentUser/init')
store.dispatch('currentSpace/init')
const currentUserIsSignedIn = store.getters['currentUser/isSignedIn']
if (currentUserIsSignedIn) {
  store.commit('broadcast/connect')
}

onMounted(() => {
  // bind events to window to receive events when mouse is outside window
  window.addEventListener('mousemove', interact)
  window.addEventListener('touchmove', interact)
  window.addEventListener('mouseup', stopInteractions)
  window.addEventListener('touchend', stopInteractions)
  window.addEventListener('resize', updatePageSizesDebounced)
  // when a card is added through Add.vue in a sharesheet with the space open behind it
  window.addEventListener('message', addCardFromOutsideAppContext)
  // load space tasks
  addInteractionBlur()
  window.addEventListener('unload', unloadPage)
  window.addEventListener('popstate', loadSpaceOnBackOrForward)
  document.fonts.ready.then(event => {
    store.commit('webfontIsLoaded', true)
    correctCardConnectionPaths()
  })
  store.dispatch('currentUser/restoreUserFavorites')
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerRestoreSpaceRemoteComplete') {
      dragItemsOnNextTick()
    }
  })
  // ⏰ scheduled tasks
  // retry failed sync operations
  processQueueIntervalTimer = setInterval(() => {
    store.dispatch('api/processQueueOperations')
  }, 5000) // every 5 seconds
  // update journal daily prompt
  updateJournalDailyPromptTimer = setInterval(() => {
    store.dispatch('currentUser/updateJournalDailyPrompt')
  }, 1000 * 60 * 60 * 1) // every hour
  // update inbox space in local storage
  setTimeout(() => {
    store.dispatch('currentSpace/updateInboxCache')
  }, 15000) // 15 seconds after mounted, one-time
  updateInboxCache = setInterval(() => {
    store.dispatch('currentSpace/updateInboxCache')
  }, 1000 * 60 * 60 * 1) // every 1 hour
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', interact)
  window.removeEventListener('touchmove', interact)
  window.removeEventListener('mouseup', stopInteractions)
  window.removeEventListener('touchend', stopInteractions)
  window.removeEventListener('resize', updatePageSizesDebounced)
  window.removeEventListener('unload', unloadPage)
  window.removeEventListener('message', addCardFromOutsideAppContext)
  window.removeEventListener('popstate', loadSpaceOnBackOrForward)
  clearInterval(processQueueIntervalTimer)
  clearInterval(updateJournalDailyPromptTimer)
  clearInterval(updateInboxCache)
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
  return {
    width: `${pageWidth.value * zoom}px`,
    height: `${pageHeight.value * zoom}px`,
    transform: store.getters.zoomTransform
  }
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

// page size

const updatePageSizesDebounced = debounce(() => {
  updatePageSizes()
}, 500)
const updatePageSizes = async () => {
  await nextTick()
  store.dispatch('updatePageSizes')
}

// connections

const correctCardConnectionPaths = () => {
  const space = utils.clone(store.state.currentSpace)
  const user = utils.clone(store.state.currentUser)
  const currentSpaceIsRemote = store.getters['currentSpace/isRemote']
  store.dispatch('currentConnections/correctPaths', { shouldUpdateApi: currentSpaceIsRemote })
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
const tiltCards = () => {
  if (!prevCursor) { return }
  const cardIds = store.state.currentUserIsTiltingCardIds
  const deltaX = endCursor.x - prevCursor.x
  store.dispatch('currentCards/tilt', { cardIds, deltaX })
}
const stopTiltingCards = () => {
  if (!store.state.currentUserIsTiltingCard) { return }
  store.dispatch('history/resume')
  const cardIds = store.state.currentUserIsTiltingCardIds
  const cards = cardIds.map(id => store.getters['currentCards/byId'](id))
  store.dispatch('history/add', { cards, useSnapshot: true })
  store.commit('currentUserIsTiltingCard', false)
  store.commit('broadcast/updateStore', { updates: { userId: currentUser.value.id }, type: 'removeRemoteUserTiltingCards' })
  cardIds.forEach(cardId => {
    store.dispatch('currentConnections/updatePaths', { cardId, shouldUpdateApi: true })
  })
}
const resizeCards = () => {
  if (!prevCursor) { return }
  const cardIds = store.state.currentUserIsResizingCardIds
  const deltaX = endCursor.x - prevCursor.x
  store.dispatch('currentCards/resize', { cardIds, deltaX })
}
const stopResizingCards = () => {
  if (!store.state.currentUserIsResizingCard) { return }
  store.dispatch('history/resume')
  const cardIds = store.state.currentUserIsResizingCardIds
  const cards = cardIds.map(id => store.getters['currentCards/byId'](id))
  store.dispatch('history/add', { cards, useSnapshot: true })
  store.commit('currentUserIsResizingCard', false)
  store.commit('broadcast/updateStore', { updates: { userId: currentUser.value.id }, type: 'removeRemoteUserResizingCards' })
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
  const boxIds = store.state.currentUserIsResizingBoxIds
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
  const boxIds = store.state.currentUserIsResizingBoxIds
  const boxes = boxIds.map(id => store.getters['currentBoxes/byId'](id))
  store.dispatch('history/add', { boxes, useSnapshot: true })
  store.commit('currentUserIsResizingBox', false)
  store.commit('currentUserToolbar', 'card')
  store.commit('broadcast/updateStore', { updates: { userId: currentUser.value.id }, type: 'removeRemoteUserResizingBoxes' })
  store.dispatch('checkIfItemShouldIncreasePageSize', boxes[0])
}
const checkIfShouldSnapBoxes = () => {
  if (!store.state.boxesWereDragged) { return }
  const snapGuides = store.state.currentBoxes.snapGuides
  if (!snapGuides.length) { return }
  snapGuides.forEach(snapGuide => store.dispatch('currentBoxes/snap', snapGuide))
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
    return true
  } else { return false }
})
const addInteractionBlur = () => {
  if (!utils.isMobile()) { return }
  const elements = document.querySelectorAll('button, li, label')
  elements.forEach(element => element.addEventListener('click', blur))
}
const blur = (event) => {
  event.target.blur()
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
const constrainCursorToAxis = (event) => {
  if (store.state.currentUserIsDraggingBox) { return }
  if (!event.shiftKey) { return }
  const delta = {
    x: Math.abs(endCursor.x - state.startCursor.x),
    y: Math.abs(endCursor.y - state.startCursor.y)
  }
  if (delta.x > delta.y) {
    endCursor.y = prevCursor.y
  } else {
    endCursor.x = prevCursor.x
  }
}
const interact = (event) => {
  endCursor = utils.cursorPositionInViewport(event)
  if (isDraggingCard.value || isDraggingBox.value) {
    constrainCursorToAxis(event)
    dragItems()
  }
  if (isResizingCard.value) {
    resizeCards()
  }
  if (isTiltingCard.value) {
    tiltCards()
  }
  if (isResizingBox.value) {
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
  if (event.target.nodeType === 9) { return true } // type 9 is Document
  const fromDialog = event.target.closest('dialog')
  const fromHeader = event.target.closest('header')
  const fromFooter = event.target.closest('footer')
  return Boolean(fromDialog || fromHeader || fromFooter)
}

// 💣 stopInteractions and Space/stopPainting are run on all mouse and touch end events

const stopInteractions = (event) => {
  console.log('💣 stopInteractions')
  const isCardsSelected = store.state.currentDraggingCardId || store.state.multipleCardsSelectedIds.length
  const isBoxesSelected = store.state.multipleBoxesSelectedIds
  if (isCardsSelected && store.state.cardsWereDragged) {
    store.dispatch('currentCards/afterMove')
  }
  if (isBoxesSelected && store.state.boxesWereDragged) {
    store.dispatch('currentBoxes/afterMove')
  }
  addInteractionBlur()
  if (event.touches) {
    store.commit('triggerUpdateHeaderAndFooterPosition')
  }
  checkIfShouldHideFooter(event)
  checkIfShouldSnapBoxes()
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
  updatePageSizes()
  store.commit('prevCursorPosition', utils.cursorPositionInPage(event))
  prevCursor = undefined
  store.commit('clearDraggingItems')
}

</script>

<template lang="pug">
main#space.space(
  :class="{'is-interacting': isInteracting, 'is-not-interacting': isPainting || isPanningReady}"
  @mousedown.left="initInteractions"
  @touchstart="initInteractions"
  :style="styles"
  :data-zoom="spaceZoomDecimal"
)
  Connections
  Boxes
  Cards
  LockedItemButtons
  //- Presence
  template(v-for="user in users")
    UserLabelCursor(:user="user")
  BoxDetails
  CardDetails
  OtherCardDetails
  ConnectionDetails
  CodeLanguagePicker
  MultipleSelectedActions
  ScrollAtEdgesHandler
  NotificationsWithPosition(layer="space")
  BoxSelecting
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
