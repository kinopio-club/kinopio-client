<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

import { nanoid } from 'nanoid'

const store = useStore()
const cardStore = useCardStore()
const connectionStore = useConnectionStore()

let useSiblingConnectionType
let browserZoomLevel = 0
let disableContextMenu = false
let spaceKeyIsDown = false

let prevCursorPosition, currentCursorPosition, prevRightClickPosition, prevRightClickTime

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'triggerAddCard') {
      const options = mutation.payload
      addCard(options)
    } else if (mutation.type === 'triggerAddChildCard') {
      const options = mutation.payload
      addChildCard(options)
    } else if (mutation.type === 'triggerSelectAllItemsBelowCursor') {
      const position = mutation.payload
      selectAllItemsBelowCursor(position)
    } else if (mutation.type === 'triggerSelectAllItemsAboveCursor') {
      const position = mutation.payload
      selectAllItemsAboveCursor(position)
    } else if (mutation.type === 'triggerSelectAllItemsRightOfCursor') {
      const position = mutation.payload
      selectAllItemsRightOfCursor(position)
    } else if (mutation.type === 'triggerSelectAllItemsLeftOfCursor') {
      const position = mutation.payload
      selectAllItemsLeftOfCursor(position)
    }
  })
  window.addEventListener('keyup', handleShortcuts)
  // event.metaKey only works on keydown
  window.addEventListener('keydown', handleMetaKeyShortcuts)
  window.addEventListener('mousedown', handleMouseDownEvents)
  window.addEventListener('mousemove', handleMouseMoveEvents)
  window.addEventListener('mouseup', handleMouseUpEvents)
  window.addEventListener('scroll', handleScrollEvents)
  window.addEventListener('contextmenu', handleContextMenuEvents)
  window.addEventListener('copy', handleCopyCutEvent)
  window.addEventListener('cut', handleCopyCutEvent)
  window.addEventListener('paste', handlePasteEvent)
})
onBeforeUnmount(() => {
  window.removeEventListener('keyup', handleShortcuts)
  window.removeEventListener('keydown', handleMetaKeyShortcuts)
  window.removeEventListener('mousedown', handleMouseDownEvents)
  window.removeEventListener('mousemove', handleMouseMoveEvents)
  window.removeEventListener('mouseup', handleMouseUpEvents)
  window.removeEventListener('scroll', handleScrollEvents)
  window.removeEventListener('copy', handleCopyCutEvent)
  window.removeEventListener('cut', handleCopyCutEvent)
  window.removeEventListener('paste', handlePasteEvent)
})

const isDisabledKeyboardShortcut = (value) => {
  const disabledKeyboardShortcuts = store.state.currentUser.disabledKeyboardShortcuts
  const isDisabled = disabledKeyboardShortcuts.includes(value)
  return isDisabled
}

// check scope

const checkIsSpaceScope = (event) => {
  const tagName = event.target.tagName
  const isFromInput = tagName === 'INPUT' || tagName === 'TEXTAREA'
  if (isFromInput) { return }
  const isBody = tagName === 'BODY'
  const isMain = tagName === 'MAIN'
  const nodeList = event.target.classList
  const classes = [...nodeList]
  const isFocusedCard = classes.includes('card')
  const isSpaceNameButton = classes.includes('space-name-button-wrap') // for paste in empty spaces
  return isBody || isMain || isFocusedCard || isSpaceNameButton
}
const checkIsCardScope = (event) => {
  const isFromCardName = event.target.closest('dialog.card-details')
  const isFromCard = event.target.classList[0] === 'card'
  return isFromCard || isFromCardName
}
const checkIsMinimapDialogScope = (event) => {
  const isFromDialog = event.target.closest('dialog.minimap')
  return isFromDialog
}
const checkIsPanScope = (event) => {
  const isFromDialog = event.target.closest('dialog')
  return !isFromDialog
}
const checkIsButtonScope = (event) => {
  const isFromButton = event.target.closest('button')
  return isFromButton
}
const isCanvasScope = (event) => {
  const fromDialog = event.target.closest('dialog')
  if (fromDialog) { return }
  const tagName = event.target.tagName
  return tagName === 'CANVAS'
}

// on key up
const handleShortcuts = (event) => {
  const key = event.key.toLowerCase()
  const keyCode = event.code // physical key on the keyboard
  // console.warn('🎹', key)
  // const isFromCard = event.target.classList[0] === 'card'
  const isSpaceScope = checkIsSpaceScope(event)
  const isMinimapDialogScope = checkIsMinimapDialogScope(event)
  const toolbarIsDrawing = store.state.currentUserToolbar === 'drawing'
  const canEditSpace = store.getters['currentUser/canEditSpace']()
  // ?
  if (key === '?' && isSpaceScope) {
    store.commit('triggerKeyboardShortcutsIsVisible')
  // n
  } else if (key === 'n' && isSpaceScope) {
    if (store.state.isAddPage) { return }
    if (isDisabledKeyboardShortcut('newSpace')) { return }
    store.dispatch('currentSpace/addSpace')
    store.commit('addNotification', { message: 'New space created (N)', icon: 'add', type: 'success' })
    store.commit('triggerSpaceDetailsInfoIsVisible')
  // m
  } else if (key === 'm' && (isSpaceScope || isMinimapDialogScope)) {
    store.commit('triggerMinimapIsVisible')
  // t
  } else if (key === 't' && isSpaceScope) {
    store.commit('addNotification', { message: 'Theme toggled (T)', type: 'info' })
    store.dispatch('themes/toggle')
    store.dispatch('themes/isSystem', false)
  // Backspace, Clear, Delete
  } else if ((key === 'backspace' || key === 'clear' || key === 'delete') && isSpaceScope) {
    remove()
  // Escape
  } else if (key === 'escape') {
    store.dispatch('closeAllDialogs')
    store.dispatch('currentUserToolbar', 'card')
  } else if (key === '1' && isSpaceScope) {
    let value = store.state.currentUser.filterShowUsers
    value = !value
    store.dispatch('currentUser/toggleFilterShowUsers', value)
  // 2
  } else if (key === '2' && isSpaceScope) {
    let value = store.state.currentUser.filterShowDateUpdated
    value = !value
    store.dispatch('currentUser/toggleFilterShowDateUpdated', value)
  // 3
  } else if (key === '3' && isSpaceScope) {
    let value = store.state.currentUser.filterUnchecked
    value = !value
    store.dispatch('currentUser/toggleFilterUnchecked', value)
  // 4
  } else if (key === '4' && isSpaceScope) {
    let value = store.state.currentUser.filterComments
    value = !value
    store.dispatch('currentUser/toggleFilterComments', value)
  // ' '
  } else if (key === ' ' && isSpaceScope) {
    store.dispatch('currentUserIsPanning', false)
    store.commit('currentUserIsPanningReady', false)
    spaceKeyIsDown = false
  // b
  } else if ((key === 'b' || keyCode === 'KeyB') && isSpaceScope) {
    let cards
    const multipleCardIds = store.state.multipleCardsSelectedIds
    const cardId = store.state.cardDetailsIsVisibleForCardId
    // Surround Selected Cards with Box
    if (cardId) {
      cards = [cardStore.getCard(cardId)]
      containItemsInNewBox(cards)
    } else if (multipleCardIds.length) {
      cards = multipleCardIds.map(id => cardStore.getCard(id))
      containItemsInNewBox(cards)
    // Toolbar Box Mode
    } else {
      store.dispatch('toggleCurrentUserToolbar', 'box')
    }
  // d
  } else if (key === 'd' && isSpaceScope) {
    if (!canEditSpace) { return }
    if (toolbarIsDrawing && store.state.drawingEraserIsActive) {
      store.commit('drawingEraserIsActive', false)
      return
    }
    store.dispatch('toggleCurrentUserToolbar', 'drawing')
  // e
  } else if (key === 'e' && isSpaceScope && toolbarIsDrawing) {
    store.dispatch('toggleDrawingEraserIsActive')
  // s
  } else if (key === 's' && isSpaceScope && toolbarIsDrawing) {
    store.dispatch('currentUser/cycleDrawingBrushSize')
  }
}
// on key down
const handleMetaKeyShortcuts = (event) => {
  const key = event.key.toLowerCase()
  const isMeta = event.metaKey || event.ctrlKey
  const isCardScope = checkIsCardScope(event)
  const isSpaceScope = checkIsSpaceScope(event)
  const isFromInput = event.target.closest('input') || event.target.closest('textarea')
  const toolbarIsDrawing = store.state.currentUserToolbar === 'drawing'
  // Add Child Card
  if (event.shiftKey && key === 'enter' && (isSpaceScope || isCardScope)) {
    const shouldAddChildCard = store.state.currentUser.cardSettingsShiftEnterShouldAddChildCard
    if (!shouldAddChildCard) { return }
    addChildCard()
  // Add Card
  } else if (key === 'enter' && isSpaceScope) {
    addCard()
  // Redo
  } else if (event.shiftKey && isMeta && key === 'z' && !isFromInput) {
    event.preventDefault()
    store.dispatch('history/redo')
  // Undo
  } else if (isMeta && key === 'z' && !isFromInput) {
    event.preventDefault()
    store.dispatch('history/undo')
  // Select All Cards Below Cursor
  } else if (isMeta && event.shiftKey && key === 'a' && isSpaceScope && !toolbarIsDrawing) {
    event.preventDefault()
    selectAllItemsBelowCursor()
  // Select All Cards and Connections
  } else if (isMeta && key === 'a' && isSpaceScope && !toolbarIsDrawing) {
    event.preventDefault()
    selectAllItems()
  // Search/Jump-to Space
  } else if (isMeta && key === 'k' && isSpaceScope) {
    event.preventDefault()
    focusOnSpaceDetailsFilter()
  // Search/Jump-to Card
  } else if (isMeta && key === 'f') {
    event.preventDefault()
    focusOnSearchCardFilter(event)
  // Show previous search card
  } else if (isMeta && event.shiftKey && key === 'g') {
    event.preventDefault()
    store.commit('triggerShowPreviousSearchCard')
  // Show next search card
  } else if (isMeta && key === 'g') {
    event.preventDefault()
    store.commit('triggerShowNextSearchCard')
  // Zoom Reset
  } else if (isMeta && key === '0') {
    browserZoomLevel = 0
    store.commit('triggerSpaceZoomReset')
  // Zoom Out
  } else if (isMeta && key === '-') {
    const shouldNativeZoom = browserZoomLevel > 0
    browserZoomLevel = Math.max(0, browserZoomLevel - 1)
    if (shouldNativeZoom) { return }
    event.preventDefault()
    store.commit('triggerCenterZoomOrigin')
    store.dispatch('zoomSpace', { shouldZoomOut: true, speed: 10 })
  // Zoom In
  } else if (isMeta && key === '=') {
    const zoom = store.state.spaceZoomPercent
    if (zoom === 100) {
      browserZoomLevel += 1
      return
    }
    event.preventDefault()
    store.commit('triggerCenterZoomOrigin')
    store.dispatch('zoomSpace', { shouldZoomIn: true, speed: 10 })
    // Toggle Zoom Out
  } else if (key === 'z' && isSpaceScope) {
    event.preventDefault()
    store.commit('triggerSpaceZoomOutMax')
  } else if (key === 'p' && isSpaceScope && !isMeta) {
    const value = !store.state.isPresentationMode
    store.commit('isPresentationMode', value)
    event.preventDefault()
  // Pan
  } else if (key === ' ' && isSpaceScope) {
    event.preventDefault()
    spaceKeyIsDown = true
    store.commit('currentUserIsPanningReady', true)
  // Lock Cards
  } else if (event.shiftKey && isMeta && key === 'l') {
    event.preventDefault()
    toggleLockCards()
  }
}
// on mouse down
const checkIsOnMinimap = (event) => {
  return Boolean(event.target.closest('#space-minimap'))
}
const handleMouseDownEvents = (event) => {
  const rightMouseButton = 2
  const middleMouseButton = 1
  const rightAndLeftButtons = 3
  const isRightClick = rightMouseButton === event.button
  const isMiddleClick = middleMouseButton === event.button
  const isRightAndLeftClick = rightAndLeftButtons === event.buttons
  const isPanScope = checkIsPanScope(event)
  const toolbarIsBox = store.state.currentUserToolbar === 'box'
  const isNotConnecting = !store.state.currentUserIsDrawingConnection
  const shouldBoxSelect = event.shiftKey && isPanScope && !toolbarIsBox && isNotConnecting && !store.state.currentUserIsResizingBox
  const userDisablePan = store.state.currentUser.shouldDisableRightClickToPan
  const shouldPan = (isRightClick || isMiddleClick) && isPanScope && !userDisablePan
  const position = utils.cursorPositionInPage(event)
  const isButtonScope = checkIsButtonScope(event)
  const isMinimap = checkIsOnMinimap(event)
  if (isButtonScope) { return }
  if (isRightAndLeftClick && isMinimap) {
    store.commit('shouldCancelNextMouseUpInteraction', true)
    return
  }
  if (shouldBoxSelect) {
    event.preventDefault()
    store.commit('currentUserIsBoxSelecting', true)
    store.commit('currentUserBoxSelectMove', position)
    store.commit('currentUserBoxSelectStart', position)
  } else if (shouldPan) {
    prevRightClickPosition = utils.cursorPositionInViewport(event)
    prevRightClickTime = utils.unixTime()
    event.preventDefault()
    if (!isMinimap) {
      store.dispatch('currentUserIsPanning', true)
    }
    disableContextMenu = true
  } else if (store.state.currentUserIsPanningReady) {
    event.preventDefault()
    if (!isMinimap) {
      store.dispatch('currentUserIsPanning', true)
    }
  }
  if (isRightClick && userDisablePan) {
    if (!isCanvasScope(event)) { return }
    store.dispatch('triggerSonarPing', event)
  }
}
// on mouse move
const handleMouseMoveEvents = (event) => {
  const position = utils.cursorPositionInPage(event)
  currentCursorPosition = position
  // box selection
  if (store.state.currentUserIsBoxSelecting) {
    store.commit('currentUserBoxSelectMove', position)
  }
}
// on mouse up
// right clicks don't trigger mouse up
const handleMouseUpEvents = async (event) => {
  if (store.state.shouldCancelNextMouseUpInteraction) { return }
  const shouldPan = store.state.currentUserIsPanning
  // handle outside window
  const isFromOutsideWindow = event.target.nodeType === Node.DOCUMENT_NODE
  let isFromCard
  if (!isFromOutsideWindow) {
    isFromCard = event.target.closest('.card-wrap')
  }
  // end panning
  const position = utils.cursorPositionInPage(event)
  prevCursorPosition = undefined
  store.dispatch('currentUserIsPanning', false)
  store.commit('currentUserIsBoxSelecting', false)

  // sonar ping
  await nextTick()
  const currentPosition = utils.cursorPositionInViewport(event)
  const currentTime = utils.unixTime()
  const cursorsAreClose = utils.cursorsAreClose(prevRightClickPosition, currentPosition)
  const timeDelta = currentTime - prevRightClickTime
  const timesAreClose = timeDelta < 400 // ms
  if (shouldPan && cursorsAreClose && timesAreClose && !store.state.multipleSelectedActionsIsVisible) {
    store.dispatch('triggerSonarPing', event)
  }
}
// on scroll
const handleScrollEvents = (event) => {
  prevCursorPosition = undefined
}
// on native right-click context menu
const handleContextMenuEvents = (event) => {
  if (disableContextMenu || store.state.currentUserIsPaintingLocked) {
    disableContextMenu = false
    event.preventDefault()
  }
}

const scrollIntoView = (card) => {
  const element = document.querySelector(`.card-wrap [data-card-id="${card.id}"]`)
  store.commit('scrollElementIntoView', { element })
}

// Add Parent and Child Cards

const addCard = async (options) => {
  options = options || {}
  if (store.state.shouldPreventNextEnterKey) {
    store.commit('shouldPreventNextEnterKey', false)
    return
  }
  const canEditSpace = store.getters['currentUser/canEditSpace']()
  if (!canEditSpace) { return }
  const parentCardId = store.state.parentCardId
  let parentCard = document.querySelector(`.card[data-card-id="${parentCardId}"]`)
  const childCardId = store.state.childCardId
  let childCard = document.querySelector(`.card[data-card-id="${childCardId}"]`)
  const childCardData = cardStore.getCard(childCardId)
  const shouldOutdentChildToParent = childCard && !childCardData
  const spaceBetweenCards = consts.spaceBetweenCards
  let position = {}
  let isParentCard = true
  if (shouldOutdentChildToParent) {
    const rect = utils.cardElementDimensions({ id: childCardId })
    const parentRect = utils.cardElementDimensions({ id: parentCardId })
    position = {
      x: parentRect.x,
      y: rect.y
    }
    childCard = false
  } else if (childCard) {
    isParentCard = false
    const rect = utils.cardElementDimensions({ id: childCardId })
    position = {
      x: rect.x,
      y: rect.y + rect.height + spaceBetweenCards
    }
  } else if (parentCard) {
    const rect = utils.cardElementDimensions({ id: parentCardId })
    position = {
      x: rect.x,
      y: rect.y + rect.height + spaceBetweenCards
    }
  } else {
    position = {
      x: 100,
      y: 120
    }
  }
  position = nonOverlappingCardPosition(position)
  parentCard = cardStore.getCard(parentCardId)
  let backgroundColor
  if (parentCard) {
    backgroundColor = parentCard.backgroundColor
  }
  store.commit('shouldPreventNextEnterKey', true)
  const newCard = { position, isParentCard, backgroundColor, id: options.id }
  cardStore.createCard(newCard)
  if (childCard) {
    store.commit('childCardId', store.state.cardDetailsIsVisibleForCardId)
    await nextTick()
    addConnection()
  }
}

const addChildCard = async (options) => {
  options = options || {}
  useSiblingConnectionType = false
  const spaceBetweenCards = consts.spaceBetweenCards

  const parentCardId = store.state.parentCardId
  const childCardId = store.state.childCardId
  const parentCardElement = document.querySelector(`.card[data-card-id="${parentCardId}"]`)
  const childCardElement = document.querySelector(`.card[data-card-id="${childCardId}"]`)
  let baseCardElement, baseCardId
  if (childCardElement) {
    baseCardElement = childCardElement
    baseCardId = childCardId
  } else if (parentCardElement) {
    baseCardElement = parentCardElement
    baseCardId = parentCardId
  } else {
    addCard(options)
    return
  }
  const rect = utils.cardElementDimensions({ id: baseCardId }) // baseCardElement.getBoundingClientRect()
  const initialPosition = {
    x: rect.x + rect.width + spaceBetweenCards,
    y: rect.y + rect.height + spaceBetweenCards
  }
  const position = nonOverlappingCardPosition(initialPosition)
  const parentCard = cardStore.getCard(parentCardId)
  const newChildCardId = options.id || nanoid()
  const newCard = { position, backgroundColor: parentCard.backgroundColor, id: newChildCardId }
  cardStore.createCard(newCard)
  store.commit('childCardId', store.state.cardDetailsIsVisibleForCardId)
  await nextTick()
  addConnection(baseCardId, position)
}

// recursive
const nonOverlappingCardPosition = (position) => {
  const spaceBetweenCards = consts.spaceBetweenCards
  const cards = cardStore.getCardsSelectableInViewport
  if (!utils.arrayHasItems(cards)) { return position }
  const overlappingCard = cards.find(card => {
    const isBetweenX = utils.isBetween({
      value: position.x,
      min: card.x,
      max: card.width + card.x
    })
    const isBetweenY = utils.isBetween({
      value: position.y,
      min: card.y,
      max: card.height + card.y
    })
    return isBetweenX && isBetweenY
  })
  if (overlappingCard) {
    position.y = position.y + overlappingCard.height + spaceBetweenCards
    return nonOverlappingCardPosition(position)
  } else {
    return position
  }
}

const addConnectionType = () => {
  const hasConnectionType = connectionStore.getNewConnectionType
  const shouldUseLastConnectionType = store.state.currentUser.shouldUseLastConnectionType
  if ((shouldUseLastConnectionType || useSiblingConnectionType) && hasConnectionType) { return }
  connectionStore.createConnectionType()
  useSiblingConnectionType = true
}

const addConnection = (baseCardId, position) => {
  const endCurrentCardId = store.state.cardDetailsIsVisibleForCardId
  if (baseCardId) {
    store.commit('parentCardId', baseCardId) // update the parent for sibling children
  } else {
    baseCardId = store.state.parentCardId
  }
  const baseCard = document.querySelector(`.card[data-card-id="${baseCardId}"]`)
  if (!baseCard) { return }
  const controlPoint = store.state.currentUser.defaultConnectionControlPoint
  const estimatedEndItemConnectorPosition = utils.estimatedNewCardConnectorPosition(position)
  const path = connectionStore.getConnectionPathBetweenItems({
    startItemId: baseCardId,
    endItemId: endCurrentCardId,
    controlPoint,
    estimatedEndItemConnectorPosition
  })
  const connection = {
    startItemId: baseCardId,
    endItemId: endCurrentCardId,
    path,
    controlPoint
  }
  addConnectionType()
  connectionStore.createConnection(connection)
}

const selectedCardIds = () => {
  return store.state.multipleCardsSelectedIds || []
}

// Remove

const removeCardById = (cardId) => {
  cardStore.removeCard(cardId)
}

const clearAllSelectedCards = () => {
  store.dispatch('clearMultipleSelected')
  store.commit('cardDetailsIsVisibleForCardId', '')
  store.commit('triggerUpdateHeaderAndFooterPosition')
}

const canEditCardById = (cardId) => {
  const isSpaceMember = store.getters['currentUser/isSpaceMember']()
  const card = cardStore.getCard(cardId)
  const cardIsCreatedByCurrentUser = store.getters['currentUser/cardIsCreatedByCurrentUser'](card)
  const canEditSpace = store.getters['currentUser/canEditSpace']()
  if (isSpaceMember) { return true }
  if (canEditSpace && cardIsCreatedByCurrentUser) { return true }
  return false
}

const canEditConnectionById = (connectionId) => {
  const isSpaceMember = store.getters['currentUser/isSpaceMember']()
  const connection = connectionStore.getConnection(connectionId)
  const connectionIsCreatedByCurrentUser = store.getters['currentUser/connectionIsCreatedByCurrentUser'](connection)
  const canEditSpace = store.getters['currentUser/canEditSpace']()
  if (isSpaceMember) { return true }
  if (canEditSpace && connectionIsCreatedByCurrentUser) { return true }
  return false
}

const remove = () => {
  store.dispatch('history/resume')
  const selectedConnectionIds = store.state.multipleConnectionsSelectedIds
  const cardIds = selectedCardIds()
  const boxes = store.getters['currentBoxes/isSelected']
  selectedConnectionIds.forEach(connectionId => {
    if (canEditConnectionById(connectionId)) {
      connectionStore.removeConnection(connectionId)
    }
  })
  cardIds.forEach(cardId => {
    if (canEditCardById(cardId)) {
      removeCardById(cardId)
    }
  })
  boxes.forEach(box => {
    const canEditBox = store.getters['currentUser/canEditBox'](box)
    if (canEditBox) {
      store.dispatch('currentBoxes/remove', box)
    }
  })
  connectionStore.removeAllUnusedConnectionTypes()
  clearAllSelectedCards()
  store.dispatch('closeAllDialogs')
}

// Copy, Cut

const writeSelectedToClipboard = async (position) => {
  const selectedItems = store.getters['currentSpace/selectedItems']
  let { cards, connectionTypes, connections, boxes } = selectedItems
  // data
  cards = utils.sortByY(cards)
  boxes = utils.sortByY(boxes)
  let data = { cards, connections, connectionTypes, boxes }
  data = utils.updateSpaceItemsRelativeToOrigin(data, position)
  store.commit('clipboardData', data)
  // text
  let items = cards.concat(boxes)
  items = utils.sortByY(items)
  const text = utils.nameStringFromItems(items)
  // clipboard
  try {
    console.info('🎊 copyData', data, text)
    await navigator.clipboard.writeText(text)
  } catch (error) {
    console.warn('🚑 writeSelectedToClipboard', error)
    throw { error }
  }
}

const handleCopyCutEvent = async (event) => {
  const isSpaceScope = checkIsSpaceScope(event)
  if (!isSpaceScope) { return }
  store.commit('clearNotificationsWithPosition')
  const position = currentCursorPosition || prevCursorPosition
  event.preventDefault()
  try {
    await writeSelectedToClipboard(position)
    if (event.type === 'cut') { remove() }
    store.commit('addNotificationWithPosition', { message: utils.pastTense(event.type), position, type: 'success', layer: 'app', icon: 'cut' })
  } catch (error) {
    console.warn('🚑 handleCopyCutEvent', error)
    const message = error.message || `Could not ${event.type}`
    store.commit('addNotificationWithPosition', { message, position, type: 'danger', layer: 'app', icon: 'cut' })
  }
}

// Paste

const normalizePasteData = (data) => {
  data.cards = data.cards.map(card => {
    card.name = utils.decodeEntitiesFromHTML(card.name)
    return card
  })
  data.boxes = data.boxes.map(box => {
    box.name = utils.decodeEntitiesFromHTML(box.name)
    return box
  })
  return data
}

const handlePastePlainText = async (data, position) => {
  store.dispatch('history/pause')
  const cardNames = utils.splitCardNameByParagraphAndSentence(data.text)
  // add card(s)
  let cards = cardNames.map(name => {
    return {
      id: nanoid(),
      name,
      x: position.x,
      y: position.y
    }
  })
  cardStore.createCards(cards)
  setTimeout(async () => {
    cardStore.distributeCardsVertically(cards)
    await nextTick()
    // select
    const cardIds = cards.map(card => card.id)
    store.commit('multipleCardsSelectedIds', cardIds)
    // ⏺ history
    cards = cardIds.map(cardId => cardStore.getCard(cardId))
    store.dispatch('history/resume')
    store.dispatch('history/add', { cards, useSnapshot: true })
  }, 100)
}

const afterPaste = ({ cards, boxes }) => {
  cards.forEach(card => {
    store.dispatch('checkIfItemShouldIncreasePageSize', card)
    cardStore.normalizeCardUrls(card.id)
  })
  boxes.forEach(box => {
    store.dispatch('checkIfItemShouldIncreasePageSize', box)
  })
}
const kinopioClipboardDataFromData = (data) => {
  if (!data.text) { return }
  if (data.file) { return }
  // match text with names
  let isKinopioClipboardData
  const names = data.text.split('\n\n') // "xyz\n\nabc" -> ["xyz", "abc"]
  names.forEach(name => {
    const card = store.state.clipboardData?.cards?.find(card => card.name === name)
    const box = store.state.clipboardData?.boxes?.find(box => box.name === name)
    if (card || box) {
      isKinopioClipboardData = true
    }
  })
  if (!isKinopioClipboardData) { return }
  return utils.clone(store.state.clipboardData)
}
const getClipboardData = async () => {
  store.commit('clearNotificationsWithPosition')
  const position = currentCursorPosition || prevCursorPosition
  try {
    const data = await utils.dataFromClipboard()
    data.kinopio = kinopioClipboardDataFromData(data, position)
    if (data.text || data.file || data.kinopio) {
      store.commit('addNotificationWithPosition', { message: 'Pasted', position, type: 'success', layer: 'app', icon: 'cut' })
      return data
    }
  } catch (error) {
    console.error('🚑 getClipboardData', error)
    store.commit('addNotificationWithPosition', { message: 'Could not paste', position, type: 'danger', layer: 'app', icon: 'cut' })
  }
}

const handlePasteEvent = async (event) => {
  const isSpaceScope = checkIsSpaceScope(event)
  if (!isSpaceScope) { return }
  event.preventDefault()
  let items
  let position = currentCursorPosition || prevCursorPosition
  position = utils.cursorPositionInSpace(null, position)
  // check card limits
  if (store.getters['currentSpace/shouldPreventAddCard']) {
    store.commit('notifyCardsCreatedIsOverLimit', true)
    return
  }
  // check read only
  store.dispatch('currentUser/notifyReadOnly', position)
  const canEditSpace = store.getters['currentUser/canEditSpace']()
  if (!canEditSpace) { return }
  // get clipboard data
  const data = await getClipboardData()
  console.info('🎊 pasteData', data, position)
  if (!data) { return }
  store.commit('closeAllDialogs')
  store.commit('clearMultipleSelected')
  // add data items
  if (data.file) {
    store.dispatch('upload/addCardsAndUploadFiles', { files: [data.file], position })
  // add kinopio items
  } else if (data.kinopio) {
    items = utils.updateSpaceItemsAddPosition(data.kinopio, position)
    items = await store.dispatch('currentSpace/newItems', { items })
    store.dispatch('currentSpace/addItems', items)
    // select new items
    await nextTick()
    store.dispatch('closeAllDialogs')
    const cardIds = items.cards.map(card => card.id)
    const boxIds = items.boxes.map(box => box.id)
    store.dispatch('addMultipleToMultipleCardsSelected', cardIds)
    store.dispatch('addMultipleToMultipleBoxesSelected', boxIds)
    await nextTick()
    const connectionIds = items.connections.map(connection => connection.map)
    connectionStore.updateConnectionPaths(connectionIds)
  // add plain text cards
  } else {
    data.text = utils.decodeEntitiesFromHTML(data.text)
    handlePastePlainText(data, position)
  }
  // update page size
  await nextTick()
  afterPaste(items)
}

// Select Items Relative to cursor

const selectAllItemsBelowCursor = (position) => {
  let zoom
  if (position) {
    zoom = 1
  } else {
    // is from keyboard shortcut
    position = currentCursorPosition
    zoom = store.getters.spaceZoomDecimal
  }
  // cards
  let cards = cardStore.getAllCardsSortedByY
  cards = cardStore.getCardsBelowY(position.y, zoom, cards)
  const cardIds = cards.map(card => card.id)
  // boxes
  let boxes = utils.clone(store.getters['currentBoxes/all'])
  boxes = boxes.filter(box => (box.y * zoom) > position.y)
  const boxIds = boxes.map(box => box.id)
  selectItemIds({ position, cardIds, boxIds })
}
const selectAllItemsAboveCursor = (position) => {
  let zoom
  if (position) {
    zoom = 1
  } else {
    // is from keyboard shortcut
    position = currentCursorPosition
    zoom = store.getters.spaceZoomDecimal
  }
  // cards
  let cards = cardStore.getAllCardsSortedByY
  cards = cardStore.getCardsAboveY(position.y, zoom, cards)
  const cardIds = cards.map(card => card.id)
  // boxes
  let boxes = utils.clone(store.getters['currentBoxes/all'])
  boxes = boxes.filter(box => (box.y * zoom) < position.y)
  const boxIds = boxes.map(box => box.id)
  selectItemIds({ position, cardIds, boxIds })
}
const selectAllItemsRightOfCursor = (position) => {
  let zoom
  if (position) {
    zoom = 1
  } else {
    // is from keyboard shortcut
    position = currentCursorPosition
    zoom = store.getters.spaceZoomDecimal
  }
  // cards
  let cards = cardStore.getAllCardsSortedByX
  cards = cardStore.getCardsRightOfX(position.x, zoom, cards)
  const cardIds = cards.map(card => card.id)
  // boxes
  let boxes = utils.clone(store.getters['currentBoxes/all'])
  boxes = boxes.filter(box => {
    return (box.x * zoom) >= position.x
  })
  const boxIds = boxes.map(box => box.id)
  selectItemIds({ position, cardIds, boxIds })
}
const selectAllItemsLeftOfCursor = (position) => {
  let zoom
  if (position) {
    zoom = 1
  } else {
    // is from keyboard shortcut
    position = currentCursorPosition
    zoom = store.getters.spaceZoomDecimal
  }
  // cards
  let cards = cardStore.getAllCardsSortedByX
  cards = cardStore.getCardsLeftOfX(position.x, zoom, cards)
  const cardIds = cards.map(card => card.id)
  // boxes
  let boxes = utils.clone(store.getters['currentBoxes/all'])
  boxes = boxes.filter(box => {
    return (box.x * zoom) <= position.x
  })
  const boxIds = boxes.map(box => box.id)
  selectItemIds({ position, cardIds, boxIds })
}

// Select All Cards, Connections, and Boxes

const selectItemIds = ({ position, cardIds, boxIds }) => {
  const preventMultipleSelectedActionsIsVisible = store.state.preventMultipleSelectedActionsIsVisible
  const isItemIds = Boolean(cardIds.length || boxIds.length)
  if (isItemIds && preventMultipleSelectedActionsIsVisible) {
    store.commit('multipleCardsSelectedIds', cardIds)
    store.commit('multipleBoxesSelectedIds', boxIds)
  } else if (isItemIds) {
    store.commit('multipleSelectedActionsPosition', position)
    store.commit('multipleSelectedActionsIsVisible', true)
    store.commit('multipleCardsSelectedIds', cardIds)
    store.commit('multipleBoxesSelectedIds', boxIds)
  } else {
    store.commit('multipleSelectedActionsIsVisible', false)
    store.commit('multipleCardsSelectedIds', [])
    store.commit('multipleBoxesSelectedIds', [])
  }
}
const selectAllItems = () => {
  const cardIds = cardStore.allIds
  const connectionIds = connectionStore.allIds
  const boxIds = utils.clone(store.state.currentBoxes.ids)
  const dialogOffset = {
    width: 200 / 2,
    height: 150 / 2
  }
  const viewportCenter = {
    x: (store.state.viewportWidth / 2) + window.scrollX - dialogOffset.width,
    y: (store.state.viewportHeight / 2) + window.scrollY - dialogOffset.height
  }
  store.commit('multipleSelectedActionsPosition', viewportCenter)
  store.commit('multipleSelectedActionsIsVisible', true)
  store.commit('multipleConnectionsSelectedIds', connectionIds)
  store.commit('multipleCardsSelectedIds', cardIds)
  store.commit('multipleBoxesSelectedIds', boxIds)
}

// Search/Jump-to

const focusOnSpaceDetailsFilter = async () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSpaceDetailsVisible')
  await nextTick()
  await nextTick()
  await nextTick()
  store.commit('triggerFocusResultsFilter')
}
const focusOnSearchCardFilter = async (event) => {
  store.dispatch('closeAllDialogs')
  store.commit('searchIsVisible', true)
  if (event.shiftKey) {
    store.commit('triggerSearchScopeIsRemote')
  } else {
    store.commit('triggerSearchScopeIsLocal')
  }
  await nextTick()
  await nextTick()
  await nextTick()
  store.commit('triggerFocusResultsFilter')
}

// Lock Cards

const toggleLockCards = () => {
  const multipleCardIds = store.state.multipleCardsSelectedIds
  const cardId = store.state.cardDetailsIsVisibleForCardId
  let cards
  if (multipleCardIds.length) {
    cards = multipleCardIds.map(id => cardStore.getCard(id))
  } else if (cardId) {
    cards = [cardStore.getCard(cardId)]
  } else {
    cards = cardStore.getAllCards
    cards = cards.filter(card => utils.isPointInsideRect(currentCursorPosition, card))
  }
  cards = cards.filter(card => Boolean(card))
  if (!cards) { return }
  // update
  const lockedCards = cards.filter(card => card.isLocked)
  const shouldLock = cards.length !== lockedCards.length
  cards.forEach(card => {
    const update = { id: card.id, isLocked: shouldLock }
    cardStore.updateCard(update)
  })
}

// Create Boxes

const containItemsInNewBox = async (cards) => {
  const isSpaceMember = store.getters['currentUser/isSpaceMember']()
  if (!isSpaceMember) { return }
  const rect = utils.boundaryRectFromItems(cards)
  // box size
  const padding = consts.spaceBetweenCards
  const paddingTop = 30 + padding
  // same as Box shrinkToMinBoxSize
  const box = {
    id: nanoid(),
    x: rect.x - padding,
    y: rect.y - paddingTop,
    resizeWidth: rect.width + (padding * 2),
    resizeHeight: rect.height + (padding + paddingTop)
  }
  store.dispatch('currentBoxes/add', { box })
  store.dispatch('closeAllDialogs')
  await nextTick()
  await nextTick()
  store.commit('boxDetailsIsVisibleForBoxId', box.id)
  store.commit('clearMultipleSelected')
}
</script>

<template lang='pug'>
</template>
