<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import consts from '@/consts.js'

import { nanoid } from 'nanoid'

const store = useStore()

let useSiblingConnectionType
let browserZoomLevel = 0
let disableContextMenu = false
let spaceKeyIsDown = false

let prevCursorPosition, currentCursorPosition, prevRightClickPosition

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
    } else if (mutation.type === 'triggerSelectAllItemsRightOfCursor') {
      const position = mutation.payload
      selectAllItemsRightOfCursor(position)
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

// check scope

const checkIsSpaceScope = (event) => {
  const tagName = event.target.tagName
  const isFromInput = tagName === 'INPUT' || tagName === 'TEXTAREA'
  if (isFromInput) { return }
  const isBody = tagName === 'BODY'
  const isMain = tagName === 'MAIN'
  const nodeList = event.target.classList
  const classes = [ ...nodeList ]
  const isFocusedCard = classes.includes('card')
  return isBody || isMain || isFocusedCard
}
const checkIsCardScope = (event) => {
  const isFromCardName = event.target.closest('dialog.card-details')
  const isFromCard = event.target.classList[0] === 'card'
  return isFromCard || isFromCardName
}
const checkIsPanScope = (event) => {
  const isFromDialog = event.target.closest('dialog')
  return !isFromDialog
}

// on key up
const handleShortcuts = (event) => {
  const key = event.key.toLowerCase()
  // console.warn('🎹', key)
  // const isFromCard = event.target.classList[0] === 'card'
  const isSpaceScope = checkIsSpaceScope(event)
  // ?
  if (key === '?' && isSpaceScope) {
    store.commit('triggerKeyboardShortcutsIsVisible')
  // n
  } else if (key === 'n' && isSpaceScope) {
    if (store.state.isAddPage) { return }
    store.dispatch('currentSpace/addSpace')
    store.commit('addNotification', { message: 'New space created', icon: 'add', type: 'success', label: 'N' })
    store.commit('triggerSpaceDetailsInfoIsVisible')
  // t
  } else if (key === 't' && isSpaceScope) {
    store.commit('addNotification', { message: 'Theme toggled', type: 'info', label: 'T' })
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
  } else if (key === '4' && isSpaceScope) {
    let value = store.state.currentUser.filterComments
    value = !value
    store.dispatch('currentUser/toggleFilterComments', value)
  } else if (key === ' ' && isSpaceScope) {
    store.commit('currentUserIsPanning', false)
    store.commit('currentUserIsPanningReady', false)
    spaceKeyIsDown = false
  } else if (key === 'b' && isSpaceScope) {
    store.dispatch('currentUserToolbar', 'box')
  } else if (key === 'c' && isSpaceScope) {
    store.dispatch('currentUserToolbar', 'card')
  }
}
// on key down
const handleMetaKeyShortcuts = (event) => {
  const key = event.key.toLowerCase()
  const isMeta = event.metaKey || event.ctrlKey
  const isCardScope = checkIsCardScope(event)
  const isSpaceScope = checkIsSpaceScope(event)
  const isFromInput = event.target.closest('input') || event.target.closest('textarea')
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
  } else if (isMeta && event.shiftKey && key === 'a' && isSpaceScope) {
    event.preventDefault()
    selectAllItemsBelowCursor()
  // Select All Cards and Connections
  } else if (isMeta && key === 'a' && isSpaceScope) {
    event.preventDefault()
    selectAllItems()
  // Search/Jump-to Space
  } else if (isMeta && key === 'k') {
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
  } else if (key === 'p' && isSpaceScope) {
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
const handleMouseDownEvents = (event) => {
  const rightMouseButton = 2
  const middleMouseButton = 1
  const isRightClick = rightMouseButton === event.button
  const isMiddleClick = middleMouseButton === event.button
  const isPanScope = checkIsPanScope(event)
  const toolbarIsBox = store.state.currentUserToolbar === 'box'
  const isNotConnecting = !store.state.currentUserIsDrawingConnection
  const shouldBoxSelect = event.shiftKey && isPanScope && !toolbarIsBox && isNotConnecting
  const userDisablePan = store.state.currentUser.shouldDisableRightClickToPan
  const shouldPan = (isRightClick || isMiddleClick) && isPanScope && !userDisablePan
  const position = utils.cursorPositionInPage(event)
  if (shouldBoxSelect) {
    event.preventDefault()
    store.commit('currentUserIsBoxSelecting', true)
    store.commit('currentUserBoxSelectEnd', position)
    store.commit('currentUserBoxSelectStart', position)
  } else if (shouldPan) {
    prevRightClickPosition = utils.cursorPositionInPage(event)
    event.preventDefault()
    store.commit('currentUserIsPanning', true)
    disableContextMenu = true
  } else if (store.state.currentUserIsPanningReady) {
    event.preventDefault()
    store.commit('currentUserIsPanning', true)
  }
  if (isRightClick && userDisablePan) {
    store.dispatch('triggerSonarPing', event)
  }
}
// on mouse move
const handleMouseMoveEvents = (event) => {
  const panSpeedIsFast = store.state.currentUser.panSpeedIsFast
  let speed = 1
  if (panSpeedIsFast) {
    speed = 5
  }
  const position = utils.cursorPositionInPage(event)
  currentCursorPosition = position
  // box selection
  if (store.state.currentUserIsBoxSelecting) {
    store.commit('currentUserBoxSelectEnd', position)
  // panning
  } else if (store.state.currentUserIsPanning) {
    event.preventDefault()
    if (!prevCursorPosition) {
      prevCursorPosition = position
    }
    let delta = {
      x: Math.round((prevCursorPosition.x - position.x) * speed),
      y: Math.round((prevCursorPosition.y - position.y) * speed)
    }
    window.scrollBy(delta.x, delta.y, 'instant')
  }
}
// on mouse up
// right clicks don't trigger mouse up
const handleMouseUpEvents = (event) => {
  const shouldPan = store.state.currentUserIsPanning
  const cursorsAreClose = utils.cursorsAreClose(prevRightClickPosition, utils.cursorPositionInPage(event))
  if (shouldPan && cursorsAreClose && !store.state.multipleSelectedActionsIsVisible) {
    store.dispatch('triggerSonarPing', event)
  }
  const isFromOutsideWindow = event.target.nodeType === Node.DOCUMENT_NODE
  let isFromCard
  if (!isFromOutsideWindow) {
    isFromCard = event.target.closest('article#card')
  }
  const position = utils.cursorPositionInPage(event)
  prevCursorPosition = undefined
  store.commit('currentUserIsPanning', false)
  store.commit('currentUserIsBoxSelecting', false)
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
  const element = document.querySelector(`article [data-card-id="${card.id}"]`)
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
  const childCardData = store.getters['currentCards/byId'](childCardId)
  const shouldOutdentChildToParent = childCard && !childCardData
  const spaceBetweenCards = utils.spaceBetweenCards()
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
  parentCard = store.getters['currentCards/byId'](parentCardId)
  let backgroundColor
  if (parentCard) {
    backgroundColor = parentCard.backgroundColor
  }
  store.commit('shouldPreventNextEnterKey', true)
  store.dispatch('currentCards/add', { position, isParentCard, backgroundColor, id: options.id })
  if (childCard) {
    store.commit('childCardId', store.state.cardDetailsIsVisibleForCardId)
    await nextTick()
    addConnection()
  }
}

const addChildCard = async (options) => {
  options = options || {}
  useSiblingConnectionType = false
  const spaceBetweenCards = utils.spaceBetweenCards()
  const parentCardId = store.state.parentCardId
  const childCardId = store.state.childCardId
  let parentCardElement = document.querySelector(`.card[data-card-id="${parentCardId}"]`)
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
  let initialPosition = {
    x: rect.x + rect.width + spaceBetweenCards,
    y: rect.y + rect.height + spaceBetweenCards
  }
  const position = nonOverlappingCardPosition(initialPosition)
  const parentCard = store.getters['currentCards/byId'](parentCardId)
  const newChildCardId = options.id || nanoid()
  store.dispatch('currentCards/add', { position, backgroundColor: parentCard.backgroundColor, id: newChildCardId })
  store.commit('childCardId', store.state.cardDetailsIsVisibleForCardId)
  await nextTick()
  addConnection(baseCardId, position)
}

// recursive
const nonOverlappingCardPosition = (position) => {
  const spaceBetweenCards = utils.spaceBetweenCards()
  const cards = store.getters['currentCards/isSelectable'](position)
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
  const hasConnectionType = Boolean(store.getters['currentConnections/typeForNewConnections'])
  const shouldUseLastConnectionType = store.state.currentUser.shouldUseLastConnectionType
  if ((shouldUseLastConnectionType || useSiblingConnectionType) && hasConnectionType) { return }
  store.dispatch('currentConnections/addType')
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
  let connection = {
    startItemId: baseCardId,
    endItemId: endCurrentCardId,
    path: store.getters['currentConnections/connectionPathBetweenItems']({
      startItemId: baseCardId,
      endItemId: endCurrentCardId,
      controlPoint,
      estimatedEndItemConnectorPosition
    }),
    controlPoint
  }
  addConnectionType()
  const type = store.getters['currentConnections/typeForNewConnections']
  store.dispatch('currentConnections/add', { connection, type })
}

const selectedCardIds = () => {
  return store.state.multipleCardsSelectedIds || []
}

// Remove

const removeCardById = (cardId) => {
  const card = store.getters['currentCards/byId'](cardId)
  store.dispatch('currentCards/remove', card)
}

const clearAllSelectedCards = () => {
  store.dispatch('clearMultipleSelected')
  store.commit('cardDetailsIsVisibleForCardId', '')
  store.commit('triggerUpdateHeaderAndFooterPosition')
}

const canEditCardById = (cardId) => {
  const isSpaceMember = store.getters['currentUser/isSpaceMember']()
  const card = store.getters['currentCards/byId'](cardId)
  const cardIsCreatedByCurrentUser = store.getters['currentUser/cardIsCreatedByCurrentUser'](card)
  const canEditSpace = store.getters['currentUser/canEditSpace']()
  if (isSpaceMember) { return true }
  if (canEditSpace && cardIsCreatedByCurrentUser) { return true }
  return false
}

const canEditConnectionById = (connectionId) => {
  const isSpaceMember = store.getters['currentUser/isSpaceMember']()
  const connection = store.getters['currentConnections/byId'](connectionId)
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
      const connection = store.getters['currentConnections/byId'](connectionId)
      store.dispatch('currentConnections/remove', connection)
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
  store.dispatch('currentConnections/removeUnusedTypes')
  clearAllSelectedCards()
  store.dispatch('closeAllDialogs')
}

// Copy, Cut

const handleCopyCutEvent = async (event) => {
  const isSpaceScope = checkIsSpaceScope(event)
  if (!isSpaceScope) { return }
  store.commit('clearNotificationsWithPosition')
  const position = currentCursorPosition || prevCursorPosition
  event.preventDefault()
  try {
    await writeSelectedToClipboard()
    if (event.type === 'cut') { remove() }
    store.commit('addNotificationWithPosition', { message: utils.pastTense(event.type), position, type: 'success', layer: 'app', icon: 'cut' })
  } catch (error) {
    console.warn('🚑 handleCopyCutEvent', error)
    const message = error.message || `Could not ${event.type}`
    store.commit('addNotificationWithPosition', { message, position, type: 'danger', layer: 'app', icon: 'cut' })
  }
}

// Paste

const notifyPasted = (position) => {
  store.commit('addNotificationWithPosition', { message: 'Pasted', position, type: 'success', layer: 'app', icon: 'cut' })
}

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
  store.dispatch('currentCards/addMultiple', { cards })
  store.dispatch('currentCards/distributeVertically', cards)
  await nextTick()
  // select
  const cardIds = cards.map(card => card.id)
  store.commit('multipleCardsSelectedIds', cardIds)
  // ⏺ history
  cards = cardIds.map(cardId => store.getters['currentCards/byId'](cardId))
  store.dispatch('history/resume')
  store.dispatch('history/add', { cards, useSnapshot: true })
  // update page size
  await nextTick()
  afterPaste({ cards, boxes: [] })
}

const afterPaste = ({ cards, boxes }) => {
  cards.forEach(card => {
    store.dispatch('checkIfItemShouldIncreasePageSize', card)
    store.dispatch('currentCards/updateURLQueryStrings', { cardId: card.id })
  })
  boxes.forEach(box => {
    store.dispatch('checkIfItemShouldIncreasePageSize', box)
  })
}

const getClipboardData = async () => {
  store.commit('clearNotificationsWithPosition')
  let position = currentCursorPosition || prevCursorPosition
  try {
    if (!navigator.clipboard.read) { // firefox
      const data = utils.clone(store.state.clipboardDataPolyfill)
      const emptyData = utils.objectHasKeys(data)
      if (!emptyData) {
        throw new Error('Firefox does not support paste')
      }
      return data
    }
    const data = await utils.dataFromClipboard()
    if (data.text || data.file) {
      notifyPasted(position)
      return data
    }
  } catch (error) {
    console.error('🚑 getClipboardData', error)
    store.commit('addNotificationWithPosition', { message: `Could not paste`, position, type: 'danger', layer: 'app', icon: 'cut' })
  }
}

const handlePasteEvent = async (event) => {
  const isSpaceScope = checkIsSpaceScope(event)
  if (!isSpaceScope) { return }
  event.preventDefault()
  let position = currentCursorPosition || prevCursorPosition
  position = utils.cursorPositionInSpace(null, position)
  // check card limits
  if (store.getters['currentSpace/shouldPreventAddCard']) {
    store.commit('notifyCardsCreatedIsOverLimit', true)
    return
  }
  // check read only
  store.dispatch('currentUser/notifyReadOnly', position)
  // get clipboard data
  let data = await getClipboardData()
  console.log('🎊 pasteData', data, position)
  if (!data) { return }
  store.commit('closeAllDialogs')
  store.commit('clearMultipleSelected')
  // add data items
  if (data.file) {
    store.dispatch('upload/addCardsAndUploadFiles', { files: [data.file], position })
  // add plain text cards
  } else {
    data.text = utils.decodeEntitiesFromHTML(data.text)
    handlePastePlainText(data, position)
  }
}

const writeSelectedToClipboard = async () => {
  const selectedItems = store.getters['currentSpace/selectedItems']
  const { cards, connectionTypes, connections, boxes } = selectedItems
  let data = { isKinopioData: true, cards, connections, connectionTypes, boxes }
  const text = utils.textFromCardNames(cards)
  console.log('🎊 copyData', data, text)
  try {
    store.commit('clipboardDataPolyfill', data)
    await navigator.clipboard.writeText(text)
  } catch (error) {
    console.warn('🚑 writeSelectedToClipboard', error)
    throw { error }
  }
}

// Select All Cards Below Cursor

const selectAllItemsBelowCursor = (position) => {
  const preventMultipleSelectedActionsIsVisible = store.state.preventMultipleSelectedActionsIsVisible
  let zoom
  if (position) {
    zoom = 1
  } else {
    // is from keyboard shortcut
    position = currentCursorPosition
    zoom = store.getters.spaceZoomDecimal
  }
  // cards
  const cards = store.getters['currentCards/isBelowY'](position.y, zoom)
  const cardIds = cards.map(card => card.id)
  // boxes
  let boxes = utils.clone(store.getters['currentBoxes/all'])
  boxes = boxes.filter(boxes => (boxes.y * zoom) > position.y)
  const boxIds = boxes.map(boxes => boxes.id)
  // select
  if (cardIds.length && preventMultipleSelectedActionsIsVisible) {
    store.commit('multipleCardsSelectedIds', cardIds)
    store.commit('multipleBoxesSelectedIds', boxIds)
  } else if (cardIds.length) {
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

// Select All Cards Right Of Cursor

const selectAllItemsRightOfCursor = (position) => {
  const preventMultipleSelectedActionsIsVisible = store.state.preventMultipleSelectedActionsIsVisible
  let zoom
  if (position) {
    zoom = 1
  } else {
    // is from keyboard shortcut
    position = currentCursorPosition
    zoom = store.getters.spaceZoomDecimal
  }
  // cards
  const cards = store.getters['currentCards/isRightOfX'](position.x, zoom)
  const cardIds = cards.map(card => card.id)
  // boxes
  let boxes = utils.clone(store.getters['currentBoxes/all'])
  boxes = boxes.filter(boxes => (boxes.x * zoom) > position.x)
  const boxIds = boxes.map(boxes => boxes.id)
  // select
  if (cardIds.length && preventMultipleSelectedActionsIsVisible) {
    store.commit('multipleCardsSelectedIds', cardIds)
    store.commit('multipleBoxesSelectedIds', boxIds)
  } else if (cardIds.length) {
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

// Select All Cards, Connections, and Boxes

const selectAllItems = () => {
  const cardIds = utils.clone(store.state.currentCards.ids)
  const connectionIds = utils.clone(store.state.currentConnections.ids)
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
  nextTick()
  nextTick()
  nextTick()
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
  nextTick()
  nextTick()
  nextTick()
  store.commit('triggerFocusResultsFilter')
}

// Lock Cards

const toggleLockCards = () => {
  const multipleCardIds = store.state.multipleCardsSelectedIds
  const cardId = store.state.cardDetailsIsVisibleForCardId
  let cards
  if (multipleCardIds.length) {
    cards = multipleCardIds.map(id => store.getters['currentCards/byId'](id))
  } else if (cardId) {
    cards = [store.getters['currentCards/byId'](cardId)]
  } else {
    cards = store.getters['currentCards/all']
    cards = cards.filter(card => utils.isPointInsideCard(currentCursorPosition, card))
  }
  cards = cards.filter(card => Boolean(card))
  if (!cards) { return }
  // update
  const lockedCards = cards.filter(card => card.isLocked)
  const shouldLock = cards.length !== lockedCards.length
  cards.forEach(card => {
    const update = { id: card.id, isLocked: shouldLock }
    store.dispatch('currentCards/update', { card: update })
  })
}
</script>

<template lang='pug'>
</template>
