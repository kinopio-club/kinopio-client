<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useUploadStore } from '@/stores/useUploadStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useHistoryStore } from '@/stores/useHistoryStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

import { nanoid } from 'nanoid'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const connectionStore = useConnectionStore()
const boxStore = useBoxStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const uploadStore = useUploadStore()
const themeStore = useThemeStore()
const historyStore = useHistoryStore()

let useSiblingConnectionType
let browserZoomLevel = 0
let disableContextMenu = false
let spaceKeyIsDown = false

let prevCursorPosition, currentCursorPosition, prevRightClickPosition, prevRightClickTime
let unsubscribes

onMounted(() => {
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
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerAddCard') {
        const options = args[0]
        addCard(options)
      } else if (name === 'triggerAddChildCard') {
        const options = args[0]
        addChildCard(options)
      } else if (name === 'triggerSelectAllItemsBelowCursor') {
        const position = args[0]
        selectAllItemsBelowCursor(position)
      } else if (name === 'triggerSelectAllItemsAboveCursor') {
        const position = args[0]
        selectAllItemsAboveCursor(position)
      } else if (name === 'triggerSelectAllItemsRightOfCursor') {
        const position = args[0]
        selectAllItemsRightOfCursor(position)
      } else if (name === 'triggerSelectAllItemsLeftOfCursor') {
        const position = args[0]
        selectAllItemsLeftOfCursor(position)
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
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
  unsubscribes()
})

const isDisabledKeyboardShortcut = (value) => {
  const disabledKeyboardShortcuts = userStore.disabledKeyboardShortcuts
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
  const isChromeFix = classes.includes('label')
  return isBody || isMain || isFocusedCard || isSpaceNameButton || isChromeFix
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
  const keyB = key === 'b' || keyCode === 'KeyB'
  const keyN = key === 'n' || keyCode === 'KeyN'
  const keyM = key === 'm' || keyCode === 'KeyM'
  const keyT = key === 't' || keyCode === 'KeyT'
  // const isFromCard = event.target.classList[0] === 'card'
  const isSpaceScope = checkIsSpaceScope(event)
  const isMinimapDialogScope = checkIsMinimapDialogScope(event)
  const toolbarIsDrawing = globalStore.getToolbarIsDrawing
  const canEditSpace = userStore.getUserCanEditSpace
  // ?
  if (key === '?' && isSpaceScope) {
    globalStore.triggerKeyboardShortcutsIsVisible()
  // n
  } else if (keyN && isSpaceScope) {
    if (globalStore.isAddPage) { return }
    if (isDisabledKeyboardShortcut('newSpace')) { return }
    spaceStore.createSpace()
    globalStore.addNotification({ message: 'New space created (N)', icon: 'add', type: 'success' })
    globalStore.triggerSpaceDetailsInfoIsVisible()
  // m
  } else if (keyM && (isSpaceScope || isMinimapDialogScope)) {
    globalStore.triggerMinimapIsVisible()
  // t
  } else if (keyT && isSpaceScope) {
    globalStore.addNotification({ message: 'Theme toggled (T)', type: 'info' })
    themeStore.toggleTheme()
    themeStore.updateThemeIsSystem(false)
  // Backspace, Clear, Delete
  } else if ((key === 'backspace' || key === 'clear' || key === 'delete') && isSpaceScope) {
    remove()
  // Escape
  } else if (key === 'escape') {
    globalStore.closeAllDialogs()
    globalStore.updateCurrentUserToolbar('card')
  } else if (key === '1' && isSpaceScope) {
    let value = userStore.filterShowUsers
    value = !value
    userStore.updateUser({ filterShowUsers: value })
  // 2
  } else if (key === '2' && isSpaceScope) {
    let value = userStore.filterShowDateUpdated
    value = !value
    userStore.updateUser({ filterShowDateUpdated: value })
  // 3
  } else if (key === '3' && isSpaceScope) {
    let value = userStore.filterUnchecked
    value = !value
    userStore.updateUser({ filterUnchecked: value })
  // 4
  } else if (key === '4' && isSpaceScope) {
    let value = userStore.filterComments
    value = !value
    userStore.updateUser({ filterComments: value })
  // ' '
  } else if (key === ' ' && isSpaceScope) {
    globalStore.updateCurrentUserIsPanning(false)
    globalStore.currentUserIsPanningReady = false
    spaceKeyIsDown = false
  // b
  } else if (keyB && isSpaceScope) {
    let cards
    const multipleCardIds = globalStore.multipleCardsSelectedIds
    const cardId = globalStore.cardDetailsIsVisibleForCardId
    // Surround Selected Cards with Box
    if (cardId) {
      cards = [cardStore.getCard(cardId)]
      containItemsInNewBox(cards)
    } else if (multipleCardIds.length) {
      cards = multipleCardIds.map(id => cardStore.getCard(id))
      containItemsInNewBox(cards)
    // Toolbar Box Mode
    } else {
      globalStore.toggleCurrentUserToolbar('box')
    }
  // d
  } else if (key === 'd' && isSpaceScope) {
    if (!canEditSpace) { return }
    if (toolbarIsDrawing && globalStore.drawingEraserIsActive) {
      globalStore.drawingEraserIsActive = false
      return
    }
    globalStore.toggleCurrentUserToolbar('drawing')
  // e
  } else if (key === 'e' && isSpaceScope && toolbarIsDrawing) {
    globalStore.toggleDrawingEraserIsActive()
  // s
  } else if (key === 's' && isSpaceScope && toolbarIsDrawing) {
    userStore.cycleDrawingBrushSize()
  }
}
// on key down
const handleMetaKeyShortcuts = (event) => {
  const key = event.key.toLowerCase()
  const keyCode = event.code // physical key on the keyboard
  const keyZ = key === 'z' || keyCode === 'KeyZ'
  const keyA = key === 'a' || keyCode === 'KeyA'
  const keyK = key === 'k' || keyCode === 'KeyK'
  const keyF = key === 'f' || keyCode === 'KeyF'
  const keyG = key === 'g' || keyCode === 'KeyG'
  const keyP = key === 'p' || keyCode === 'KeyP'
  const keyL = key === 'l' || keyCode === 'KeyL'
  const isMeta = event.metaKey || event.ctrlKey
  const isCardScope = checkIsCardScope(event)
  const isSpaceScope = checkIsSpaceScope(event)
  const isFromInput = event.target.closest('input') || event.target.closest('textarea')
  const toolbarIsDrawing = globalStore.getToolbarIsDrawing
  // Add Child Card
  if (event.shiftKey && key === 'enter' && (isSpaceScope || isCardScope)) {
    const shouldAddChildCard = userStore.cardSettingsShiftEnterShouldAddChildCard
    if (!shouldAddChildCard) { return }
    addChildCard()
  // Add Card
  } else if (key === 'enter' && isSpaceScope) {
    addCard()
  // Redo
  } else if (event.shiftKey && isMeta && keyZ && !isFromInput) {
    event.preventDefault()
    historyStore.redo()
  // Undo
  } else if (isMeta && keyZ && !isFromInput) {
    event.preventDefault()
    historyStore.undo()
  // Select All Cards Below Cursor
  } else if (isMeta && event.shiftKey && keyA && isSpaceScope && !toolbarIsDrawing) {
    event.preventDefault()
    selectAllItemsBelowCursor()
  // Select All Cards and Connections
  } else if (isMeta && keyA && isSpaceScope && !toolbarIsDrawing) {
    event.preventDefault()
    selectAllItems()
  // Search/Jump-to Space
  } else if (isMeta && keyK && isSpaceScope) {
    event.preventDefault()
    focusOnSpaceDetailsFilter()
  // Search/Jump-to Card
  } else if (isMeta && keyF) {
    event.preventDefault()
    focusOnSearchCardFilter(event)
  // Show previous search card
  } else if (isMeta && event.shiftKey && keyG) {
    event.preventDefault()
    globalStore.triggerShowPreviousSearchCard()
  // Show next search card
  } else if (isMeta && keyG) {
    event.preventDefault()
    globalStore.triggerShowNextSearchCard()
  // Zoom Reset
  } else if (isMeta && key === '0') {
    browserZoomLevel = 0
    globalStore.triggerSpaceZoomReset()
  // Zoom Out
  } else if (isMeta && key === '-') {
    const shouldNativeZoom = browserZoomLevel > 0
    browserZoomLevel = Math.max(0, browserZoomLevel - 1)
    if (shouldNativeZoom) { return }
    event.preventDefault()
    globalStore.triggerCenterZoomOrigin()
    globalStore.zoomSpace({ shouldZoomOut: true, speed: 10 })
  // Zoom In
  } else if (isMeta && key === '=') {
    const zoom = globalStore.spaceZoomPercent
    if (zoom === 100) {
      browserZoomLevel += 1
      return
    }
    event.preventDefault()
    globalStore.CenterZoomOrigin()
    globalStore.zoomSpace({ shouldZoomIn: true, speed: 10 })
    // Toggle Zoom Out
  } else if (keyZ && isSpaceScope) {
    event.preventDefault()
    globalStore.triggerSpaceZoomOutMax()
  } else if (keyP && isSpaceScope && !isMeta) {
    const value = !globalStore.isPresentationMode
    globalStore.isPresentationMode = value
    event.preventDefault()
  // Pan
  } else if (key === ' ' && isSpaceScope) {
    event.preventDefault()
    spaceKeyIsDown = true
    globalStore.currentUserIsPanningReady = true
  // Lock Cards
  } else if (event.shiftKey && isMeta && keyL) {
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
  const toolbarIsBox = globalStore.getToolbarIsBox
  const isNotConnecting = !globalStore.currentUserIsDrawingConnection
  const shouldBoxSelect = event.shiftKey && isPanScope && !toolbarIsBox && isNotConnecting && !globalStore.currentUserIsResizingBox
  const userDisablePan = userStore.shouldDisableRightClickToPan
  const shouldPan = (isRightClick || isMiddleClick) && isPanScope && !userDisablePan
  const position = utils.cursorPositionInPage(event)
  const isButtonScope = checkIsButtonScope(event)
  const isMinimap = checkIsOnMinimap(event)
  if (isButtonScope) { return }
  if (isRightAndLeftClick && isMinimap) {
    globalStore.shouldCancelNextMouseUpInteraction = true
    return
  }
  if (shouldBoxSelect) {
    event.preventDefault()
    globalStore.currentUserIsBoxSelecting = true
    globalStore.currentUserBoxSelectMove = position
    globalStore.currentUserBoxSelectStart = position
  } else if (shouldPan) {
    prevRightClickPosition = utils.cursorPositionInViewport(event)
    prevRightClickTime = utils.unixTime()
    event.preventDefault()
    if (!isMinimap) {
      globalStore.updateCurrentUserIsPanning(true)
    }
    disableContextMenu = true
  } else if (globalStore.currentUserIsPanningReady) {
    event.preventDefault()
    if (!isMinimap) {
      globalStore.updateCurrentUserIsPanning(true)
    }
  }
  if (isRightClick && userDisablePan) {
    if (!isCanvasScope(event)) { return }
    globalStore.normalizeTriggerSonarPing(event)
  }
}
// on mouse move
const handleMouseMoveEvents = (event) => {
  const position = utils.cursorPositionInPage(event)
  currentCursorPosition = position
  // box selection
  if (globalStore.currentUserIsBoxSelecting) {
    globalStore.currentUserBoxSelectMove = position
  }
}
// on mouse up
// right clicks don't trigger mouse up
const handleMouseUpEvents = async (event) => {
  if (globalStore.shouldCancelNextMouseUpInteraction) { return }
  const shouldPan = globalStore.currentUserIsPanning
  // handle outside window
  const isFromOutsideWindow = event.target.nodeType === Node.DOCUMENT_NODE
  let isFromCard
  if (!isFromOutsideWindow) {
    isFromCard = event.target.closest('.card-wrap')
  }
  // end panning
  const position = utils.cursorPositionInPage(event)
  prevCursorPosition = undefined
  globalStore.updateCurrentUserIsPanning(false)
  globalStore.currentUserIsBoxSelecting = false

  // sonar ping
  await nextTick()
  const currentPosition = utils.cursorPositionInViewport(event)
  const currentTime = utils.unixTime()
  const cursorsAreClose = utils.cursorsAreClose(prevRightClickPosition, currentPosition)
  const timeDelta = currentTime - prevRightClickTime
  const timesAreClose = timeDelta < 400 // ms
  if (shouldPan && cursorsAreClose && timesAreClose && !globalStore.multipleSelectedActionsIsVisible) {
    globalStore.normalizeTriggerSonarPing(event)
  }
}
// on scroll
const handleScrollEvents = (event) => {
  prevCursorPosition = undefined
}
// on native right-click context menu
const handleContextMenuEvents = (event) => {
  if (disableContextMenu || globalStore.currentUserIsPaintingLocked) {
    disableContextMenu = false
    event.preventDefault()
  }
}

const scrollIntoView = (card) => {
  const element = document.querySelector(`.card-wrap [data-card-id="${card.id}"]`)
  globalStore.scrollElementIntoView({ element })
}

// Add Parent and Child Cards

const addCard = async (options) => {
  options = options || {}
  if (globalStore.shouldPreventNextEnterKey) {
    globalStore.shouldPreventNextEnterKey = false
    return
  }
  const canEditSpace = userStore.getUserCanEditSpace
  if (!canEditSpace) { return }
  const parentCardId = globalStore.parentCardId
  let parentCard = document.querySelector(`.card[data-card-id="${parentCardId}"]`)
  const childCardId = globalStore.childCardId
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
  globalStore.shouldPreventNextEnterKey = true
  const newCard = { position, isParentCard, backgroundColor, id: options.id }
  cardStore.createCard(newCard)
  if (childCard) {
    globalStore.childCardId = globalStore.cardDetailsIsVisibleForCardId
    await nextTick()
    addConnection()
  }
}

const addChildCard = async (options) => {
  options = options || {}
  useSiblingConnectionType = false
  const spaceBetweenCards = consts.spaceBetweenCards

  const parentCardId = globalStore.parentCardId
  const childCardId = globalStore.childCardId
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
  globalStore.childCardId = globalStore.cardDetailsIsVisibleForCardId
  await nextTick()
  addConnection(baseCardId, position)
}

// recursive
const nonOverlappingCardPosition = (position) => {
  const spaceBetweenCards = consts.spaceBetweenCards
  const cards = cardStore.getCardsSelectableInViewport()
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
  const shouldUseLastConnectionType = userStore.shouldUseLastConnectionType
  if ((shouldUseLastConnectionType || useSiblingConnectionType) && hasConnectionType) { return }
  connectionStore.createConnectionType()
  useSiblingConnectionType = true
}

const addConnection = (baseCardId, position) => {
  const endCurrentCardId = globalStore.cardDetailsIsVisibleForCardId
  if (baseCardId) {
    globalStore.parentCardId = baseCardId // update the parent for sibling children
  } else {
    baseCardId = globalStore.parentCardId
  }
  const baseCard = document.querySelector(`.card[data-card-id="${baseCardId}"]`)
  if (!baseCard) { return }
  const controlPoint = userStore.defaultConnectionControlPoint
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
  return globalStore.multipleCardsSelectedIds || []
}

// Remove

const removeCardById = (cardId) => {
  cardStore.removeCard(cardId)
}

const clearAllSelectedCards = () => {
  globalStore.clearMultipleSelected()
  globalStore.updateCardDetailsIsVisibleForCardId('')
  globalStore.triggerUpdateHeaderAndFooterPosition()
}

const canEditCardById = (cardId) => {
  const isSpaceMember = userStore.getUserIsSpaceMember
  const card = cardStore.getCard(cardId)
  const cardIsCreatedByCurrentUser = userStore.getUserIsCardCreator(card)
  const canEditSpace = userStore.getUserCanEditSpace
  if (isSpaceMember) { return true }
  if (canEditSpace && cardIsCreatedByCurrentUser) { return true }
  return false
}

const canEditConnectionById = (connectionId) => {
  const isSpaceMember = userStore.getUserIsSpaceMember
  const connection = connectionStore.getConnection(connectionId)
  const connectionIsCreatedByCurrentUser = userStore.getItemIsCreatedByUser(connection)
  const canEditSpace = userStore.getUserCanEditSpace
  if (isSpaceMember) { return true }
  if (canEditSpace && connectionIsCreatedByCurrentUser) { return true }
  return false
}

const remove = () => {
  const selectedConnectionIds = globalStore.multipleConnectionsSelectedIds
  const cardIds = selectedCardIds()
  const boxes = boxStore.getBoxesSelected
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
    const canEditBox = userStore.getUserCanEditBox(box)
    if (canEditBox) {
      boxStore.removeBox(box.id)
    }
  })
  connectionStore.removeAllUnusedConnectionTypes()
  clearAllSelectedCards()
  globalStore.closeAllDialogs()
}

// Copy, Cut

const writeSelectedToClipboard = async (position) => {
  const selectedItems = spaceStore.getSpaceSelectedItems
  let { cards, connectionTypes, connections, boxes } = selectedItems
  // data
  cards = utils.sortByY(cards)
  boxes = utils.sortByY(boxes)
  let data = { cards, connections, connectionTypes, boxes }
  data = utils.updateSpaceItemsRelativeToOrigin(data, position)
  // text
  let items = cards.concat(boxes)
  items = utils.sortByY(items)
  const text = utils.nameStringFromItems(items)
  // clipboard
  try {
    globalStore.clipboardData = { data, text }
    console.info('🎊 copyData', globalStore.clipboardData)
    await navigator.clipboard.writeText(text)
    return text
  } catch (error) {
    console.warn('🚑 writeSelectedToClipboard', error)
    throw { error }
  }
}
const handleCopyCutEvent = async (event) => {
  const isSpaceScope = checkIsSpaceScope(event)
  if (!isSpaceScope) { return }
  globalStore.clearNotificationsWithPosition()
  const position = currentCursorPosition || prevCursorPosition
  event.preventDefault()
  try {
    await writeSelectedToClipboard(position)
    if (event.type === 'cut') { remove() }
    globalStore.addNotificationWithPosition({ message: utils.pastTense(event.type), position, type: 'success', layer: 'app', icon: 'cut' })
  } catch (error) {
    console.warn('🚑 handleCopyCutEvent', error)
    const message = error.message || `Could not ${event.type}`
    globalStore.addNotificationWithPosition({ message, position, type: 'danger', layer: 'app', icon: 'cut' })
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
    globalStore.multipleCardsSelectedIds = cardIds
    // ⏺ history
    cards = cardIds.map(cardId => cardStore.getCard(cardId))
  }, 100)
}

const clipboardDataFromData = (data) => {
  if (!data.text) { return }
  if (data.file) { return }
  if (data.text !== globalStore.clipboardData.text) { return }
  return utils.clone(globalStore.clipboardData)
}
const getClipboardData = async () => {
  globalStore.clearNotificationsWithPosition()
  const position = currentCursorPosition || prevCursorPosition
  try {
    const data = await utils.dataFromClipboard()
    data.clipboardData = clipboardDataFromData(data, position)
    if (data.text || data.file || data.clipboardData) {
      globalStore.addNotificationWithPosition({ message: 'Pasted', position, type: 'success', layer: 'app', icon: 'cut' })
      return data
    }
  } catch (error) {
    console.error('🚑 getClipboardData', error)
    globalStore.addNotificationWithPosition({ message: 'Could not paste', position, type: 'danger', layer: 'app', icon: 'cut' })
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
  if (spaceStore.getShouldPreventAddCard) {
    globalStore.updateNotifyCardsCreatedIsOverLimit(true)
    return
  }
  // check read only
  userStore.notifyReadOnly(position)
  const canEditSpace = userStore.getUserCanEditSpace
  if (!canEditSpace) { return }
  // get clipboard data
  const data = await getClipboardData()
  let itemsData = data.clipboardData?.data
  if (globalStore.clipboardData.text === data.text) {
    itemsData = globalStore.clipboardData.data
  }

  console.info('🎊 pasteData', data, itemsData, position, globalStore.clipboardData, Boolean(data))

  if (!data) { return }
  console.log('☎️START')
  globalStore.closeAllDialogs()
  globalStore.clearMultipleSelected()
  // add data items
  if (data.file) {
    uploadStore.addCardsAndUploadFiles({ files: [data.file], position })
  // add kinopio items
  } else if (itemsData) {
    console.log('☎️', itemsData)
    items = utils.updateSpaceItemsAddPosition(itemsData, position)
    items = await spaceStore.getNewItems(items)
    console.log('☎️☎️to createSpaceItems', items)

    await spaceStore.createSpaceItems(items)
    console.log('☎️☎️☎️', true)

    // select new items
    await nextTick()
    globalStore.closeAllDialogs()
    const cardIds = items.cards.map(card => card.id)
    const boxIds = items.boxes.map(box => box.id)
    globalStore.addMultipleToMultipleCardsSelected(cardIds)
    globalStore.addMultipleToMultipleBoxesSelected(boxIds)
    await nextTick()
    const connectionIds = items.connections.map(connection => connection.map)
    connectionStore.updateConnectionPathsByItemIds(connectionIds)
  // add plain text cards
  } else {
    data.text = utils.decodeEntitiesFromHTML(data.text)
    handlePastePlainText(data, position)
  }
  // update page size
  await nextTick()
  globalStore.updatePageSizes()
}

// Select Items Relative to cursor

const selectAllItemsBelowCursor = (position) => {
  let zoom
  if (position) {
    zoom = 1
  } else {
    // is from keyboard shortcut
    position = currentCursorPosition
    zoom = globalStore.getSpaceZoomDecimal
  }
  // cards
  let cards = cardStore.getAllCardsSortedByY
  cards = cardStore.getCardsBelowY(position.y, zoom, cards)
  const cardIds = cards.map(card => card.id)
  // boxes
  let boxes = boxStore.getAllBoxes
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
    zoom = globalStore.getSpaceZoomDecimal
  }
  // cards
  let cards = cardStore.getAllCardsSortedByY
  cards = cardStore.getCardsAboveY(position.y, zoom, cards)
  const cardIds = cards.map(card => card.id)
  // boxes
  let boxes = boxStore.getAllBoxes
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
    zoom = globalStore.getSpaceZoomDecimal
  }
  // cards
  let cards = cardStore.getAllCardsSortedByX
  cards = cardStore.getCardsRightOfX(position.x, zoom, cards)
  const cardIds = cards.map(card => card.id)
  // boxes
  let boxes = boxStore.getAllBoxes
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
    zoom = globalStore.getSpaceZoomDecimal
  }
  // cards
  let cards = cardStore.getAllCardsSortedByX
  cards = cardStore.getCardsLeftOfX(position.x, zoom, cards)
  const cardIds = cards.map(card => card.id)
  // boxes
  let boxes = boxStore.getAllBoxes
  boxes = boxes.filter(box => {
    return (box.x * zoom) <= position.x
  })
  const boxIds = boxes.map(box => box.id)
  selectItemIds({ position, cardIds, boxIds })
}

// Select All Cards, Connections, and Boxes

const selectItemIds = ({ position, cardIds, boxIds }) => {
  const preventMultipleSelectedActionsIsVisible = globalStore.preventMultipleSelectedActionsIsVisible
  const isItemIds = Boolean(cardIds.length || boxIds.length)
  if (isItemIds && preventMultipleSelectedActionsIsVisible) {
    globalStore.updateMultipleCardsSelectedIds(cardIds)
    globalStore.updateMultipleBoxesSelectedIds(boxIds)
  } else if (isItemIds) {
    globalStore.multipleSelectedActionsPosition = position
    globalStore.updateMultipleSelectedActionsIsVisible(true)
    globalStore.updateMultipleCardsSelectedIds(cardIds)
    globalStore.updateMultipleBoxesSelectedIds(boxIds)
  } else {
    globalStore.updateMultipleSelectedActionsIsVisible(false)
  }
}
const selectAllItems = () => {
  const cardIds = cardStore.allIds
  const connectionIds = connectionStore.allIds
  const boxIds = boxStore.allIds
  const dialogOffset = {
    width: 200 / 2,
    height: 150 / 2
  }
  const viewportCenter = {
    x: (globalStore.viewportWidth / 2) + window.scrollX - dialogOffset.width,
    y: (globalStore.viewportHeight / 2) + window.scrollY - dialogOffset.height
  }
  globalStore.multipleSelectedActionsPosition = viewportCenter
  globalStore.updateMultipleSelectedActionsIsVisible(true)
  globalStore.multipleConnectionsSelectedIds = connectionIds
  globalStore.multipleCardsSelectedIds = cardIds
  globalStore.multipleBoxesSelectedIds = boxIds
}

// Search/Jump-to

const focusOnSpaceDetailsFilter = async () => {
  globalStore.closeAllDialogs()
  globalStore.triggerSpaceDetailsVisible()
  await nextTick()
  await nextTick()
  await nextTick()
  globalStore.triggerFocusResultsFilter()
}
const focusOnSearchCardFilter = async (event) => {
  globalStore.closeAllDialogs()
  globalStore.searchIsVisible = true
  if (event.shiftKey) {
    globalStore.triggerSearchScopeIsRemote()
  } else {
    globalStore.triggerSearchScopeIsLocal()
  }
  await nextTick()
  await nextTick()
  await nextTick()
  globalStore.triggerFocusResultsFilter()
}

// Lock Cards

const toggleLockCards = () => {
  const multipleCardIds = globalStore.multipleCardsSelectedIds
  const cardId = globalStore.cardDetailsIsVisibleForCardId
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
  const isSpaceMember = userStore.getUserIsSpaceMember
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
  boxStore.createBox(box)
  globalStore.closeAllDialogs()
  await nextTick()
  await nextTick()
  globalStore.updateBoxDetailsIsVisibleForBoxId(box.id)
  globalStore.clearMultipleSelected()
}
</script>

<template lang='pug'>
</template>
