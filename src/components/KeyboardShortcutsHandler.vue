<template lang='pug'>
</template>

<script>
import utils from '@/utils.js'
import consts from '@/consts.js'

import { nanoid } from 'nanoid'

let useSiblingConnectionType
let browserZoomLevel = 0
let disableContextMenu = false
let spaceKeyIsDown = false

let prevCursorPosition, currentCursorPosition, prevRightClickPosition

const checkIsSpaceScope = (event) => {
  const tagName = event.target.tagName
  const isFromInput = tagName === 'INPUT' || tagName === 'TEXTAREA'
  if (isFromInput) { return }
  const isBody = tagName === 'BODY'
  const isMain = tagName === 'MAIN'
  const isFocusedCard = event.target.className === 'card'
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

export default {
  name: 'KeyboardShortcutsHandler',
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerAddCard') {
        const options = mutation.payload
        this.addCard(options)
      } else if (mutation.type === 'triggerAddChildCard') {
        const options = mutation.payload
        this.addChildCard(options)
      } else if (mutation.type === 'triggerSelectAllItemsBelowCursor') {
        const position = mutation.payload
        this.selectAllItemsBelowCursor(position)
      }
    })
  },
  mounted () {
    window.addEventListener('keyup', this.handleShortcuts)
    // event.metaKey only works on keydown
    window.addEventListener('keydown', this.handleMetaKeyShortcuts)
    window.addEventListener('mousedown', this.handleMouseDownEvents)
    window.addEventListener('mousemove', this.handleMouseMoveEvents)
    window.addEventListener('mouseup', this.handleMouseUpEvents)
    window.addEventListener('scroll', this.handleScrollEvents)
    window.addEventListener('contextmenu', this.handleContextMenuEvents)
    window.addEventListener('copy', this.handleCopyCutEvent)
    window.addEventListener('cut', this.handleCopyCutEvent)
    window.addEventListener('paste', this.handlePasteEvent)
  },
  beforeUnmount () {
    window.removeEventListener('keyup', this.handleShortcuts)
    window.removeEventListener('keydown', this.handleMetaKeyShortcuts)
    window.removeEventListener('mousedown', this.handleMouseDownEvents)
    window.removeEventListener('mousemove', this.handleMouseMoveEvents)
    window.removeEventListener('mouseup', this.handleMouseUpEvents)
    window.removeEventListener('scroll', this.handleScrollEvents)
    window.removeEventListener('copy', this.handleCopyCutEvent)
    window.removeEventListener('cut', this.handleCopyCutEvent)
    window.removeEventListener('paste', this.handlePasteEvent)
  },
  computed: {
  },
  methods: {
    // on key up
    handleShortcuts (event) {
      const key = event.key.toLowerCase()
      // console.warn('🎹', key)
      // const isFromCard = event.target.classList[0] === 'card'
      const isSpaceScope = checkIsSpaceScope(event)
      // ?
      if (key === '?' && isSpaceScope) {
        this.$store.commit('triggerKeyboardShortcutsIsVisible')
      // n
      } else if (key === 'n' && isSpaceScope) {
        if (this.$store.state.isAddPage) { return }
        this.$store.dispatch('currentSpace/addSpace')
        this.$store.commit('addNotification', { message: 'New space created', icon: 'add', type: 'success', label: 'N' })
        this.$store.commit('triggerSpaceDetailsInfoIsVisible')
      // t
      } else if (key === 't' && isSpaceScope) {
        this.$store.commit('addNotification', { message: 'Theme toggled', type: 'info', label: 'T' })
        this.$store.dispatch('themes/toggle')
        this.$store.dispatch('themes/isSystem', false)
      // Backspace, Clear, Delete
      } else if ((key === 'backspace' || key === 'clear' || key === 'delete') && isSpaceScope) {
        this.remove()
      // Escape
      } else if (key === 'escape') {
        this.$store.dispatch('closeAllDialogs')
        this.$store.commit('currentUserToolbar', 'card')
      } else if (key === '1' && isSpaceScope) {
        let value = this.$store.state.currentUser.filterShowUsers
        value = !value
        this.$store.dispatch('currentUser/toggleFilterShowUsers', value)
      // 2
      } else if (key === '2' && isSpaceScope) {
        let value = this.$store.state.currentUser.filterShowDateUpdated
        value = !value
        this.$store.dispatch('currentUser/toggleFilterShowDateUpdated', value)
      // 3
      } else if (key === '3' && isSpaceScope) {
        let value = this.$store.state.currentUser.filterUnchecked
        value = !value
        this.$store.dispatch('currentUser/toggleFilterUnchecked', value)
      } else if (key === '4' && isSpaceScope) {
        let value = this.$store.state.currentUser.filterComments
        value = !value
        this.$store.dispatch('currentUser/toggleFilterComments', value)
      } else if (key === ' ' && isSpaceScope) {
        this.$store.commit('currentUserIsPanning', false)
        this.$store.commit('currentUserIsPanningReady', false)
        spaceKeyIsDown = false
      } else if (key === 'b' && isSpaceScope) {
        this.$store.commit('currentUserToolbar', 'box')
      } else if (key === 'c' && isSpaceScope) {
        this.$store.commit('currentUserToolbar', 'card')
      }
    },
    // on key down
    handleMetaKeyShortcuts (event) {
      const key = event.key.toLowerCase()
      const isMeta = event.metaKey || event.ctrlKey
      const isCardScope = checkIsCardScope(event)
      const isSpaceScope = checkIsSpaceScope(event)
      const isFromInput = event.target.closest('input') || event.target.closest('textarea')
      console.log('🐸🐸', key, isMeta, event.shiftKey, event)

      // Add Child Card
      if (event.shiftKey && key === 'enter' && (isSpaceScope || isCardScope)) {
        this.addChildCard()
      // Add Card
      } else if (key === 'enter' && isSpaceScope) {
        this.addCard()
      // Redo
      } else if (event.shiftKey && isMeta && key === 'z' && !isFromInput) {
        event.preventDefault()
        this.$store.dispatch('history/redo')
      // Undo
      } else if (isMeta && key === 'z' && !isFromInput) {
        event.preventDefault()
        this.$store.dispatch('history/undo')
      // Select All Cards Below Cursor
      } else if (isMeta && event.shiftKey && key === 'a' && isSpaceScope) {
        event.preventDefault()
        this.selectAllItemsBelowCursor()
      // Select All Cards and Connections
      } else if (isMeta && key === 'a' && isSpaceScope) {
        event.preventDefault()
        this.selectAllItems()
      // Search/Jump-to Space
      } else if (isMeta && key === 'k') {
        event.preventDefault()
        this.focusOnSpaceDetailsFilter()
      // Search/Jump-to Card
      } else if (isMeta && key === 'f') {
        console.log('🐸🐸search test🐸🐸🐸🐸', event, isMeta, event.shiftKey)
        event.preventDefault()
        this.focusOnSearchCardFilter(event)
      // Show previous search card
      } else if (isMeta && event.shiftKey && key === 'g') {
        event.preventDefault()
        this.$store.commit('triggerShowPreviousSearchCard')
      // Show next search card
      } else if (isMeta && key === 'g') {
        event.preventDefault()
        this.$store.commit('triggerShowNextSearchCard')
      // Zoom Reset
      } else if (isMeta && key === '0') {
        browserZoomLevel = 0
        this.$store.commit('triggerSpaceZoomReset')
      // Zoom Out
      } else if (isMeta && key === '-') {
        const shouldNativeZoom = browserZoomLevel > 0
        browserZoomLevel = Math.max(0, browserZoomLevel - 1)
        if (shouldNativeZoom) { return }
        event.preventDefault()
        this.$store.commit('triggerCenterZoomOrigin')
        this.$store.dispatch('zoomSpace', { shouldZoomOut: true, speed: 10 })
      // Zoom In
      } else if (isMeta && key === '=') {
        const zoom = this.$store.state.spaceZoomPercent
        if (zoom === 100) {
          browserZoomLevel += 1
          return
        }
        event.preventDefault()
        this.$store.commit('triggerCenterZoomOrigin')
        this.$store.dispatch('zoomSpace', { shouldZoomIn: true, speed: 10 })
        // Toggle Zoom Out
      } else if (key === 'z' && isSpaceScope) {
        event.preventDefault()
        this.$store.commit('triggerSpaceZoomOutMax')
      } else if (key === 'p' && isSpaceScope) {
        const value = !this.$store.state.isPresentationMode
        this.$store.commit('isPresentationMode', value)
        event.preventDefault()
      // Pan
      } else if (key === ' ' && isSpaceScope) {
        event.preventDefault()
        spaceKeyIsDown = true
        this.$store.commit('currentUserIsPanningReady', true)
      // Lock Cards
      } else if (event.shiftKey && isMeta && key === 'l') {
        event.preventDefault()
        this.toggleLockCards()
      }
    },
    // on mouse down
    handleMouseDownEvents (event) {
      const rightMouseButton = 2
      const middleMouseButton = 1
      const isRightClick = rightMouseButton === event.button
      const isMiddleClick = middleMouseButton === event.button
      const isPanScope = checkIsPanScope(event)
      const toolbarIsBox = this.$store.state.currentUserToolbar === 'box'
      const isNotConnecting = !this.$store.state.currentUserIsDrawingConnection
      const shouldBoxSelect = event.shiftKey && isPanScope && !toolbarIsBox && isNotConnecting
      const userDisablePan = this.$store.state.currentUser.shouldDisableRightClickToPan
      const shouldPan = (isRightClick || isMiddleClick) && isPanScope && !userDisablePan
      const position = utils.cursorPositionInPage(event)
      if (shouldBoxSelect) {
        event.preventDefault()
        this.$store.commit('currentUserIsBoxSelecting', true)
        this.$store.commit('currentUserBoxSelectEnd', position)
        this.$store.commit('currentUserBoxSelectStart', position)
      } else if (shouldPan) {
        if (consts.isDevelopment) { return }
        prevRightClickPosition = utils.cursorPositionInPage(event)
        event.preventDefault()
        this.$store.commit('currentUserIsPanning', true)
        disableContextMenu = true
        return false
      } else if (this.$store.state.currentUserIsPanningReady) {
        event.preventDefault()
        this.$store.commit('currentUserIsPanning', true)
      }
    },
    // on mouse move
    handleMouseMoveEvents (event) {
      const panSpeedIsFast = this.$store.state.currentUser.panSpeedIsFast
      let speed = 1
      if (panSpeedIsFast) {
        speed = 5
      }
      const position = utils.cursorPositionInPage(event)
      currentCursorPosition = position
      // box selection
      if (this.$store.state.currentUserIsBoxSelecting) {
        this.$store.commit('currentUserBoxSelectEnd', position)
      // panning
      } else if (this.$store.state.currentUserIsPanning) {
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
    },
    // on mouse up
    handleMouseUpEvents (event) {
      const rightMouseButton = 2
      const isRightClick = rightMouseButton === event.button
      const isFromOutsideWindow = event.target.nodeType === Node.DOCUMENT_NODE
      let isFromCard
      if (!isFromOutsideWindow) {
        isFromCard = event.target.closest('article#card')
      }
      const position = utils.cursorPositionInPage(event)
      let isNearPrevRightClickPosition
      if (isRightClick && prevRightClickPosition) {
        isNearPrevRightClickPosition = utils.distanceBetweenTwoPoints(prevRightClickPosition, position) <= 5
      }
      prevCursorPosition = undefined
      this.$store.commit('currentUserIsPanning', false)
      this.$store.commit('currentUserIsBoxSelecting', false)
      if (isRightClick && isFromCard && isNearPrevRightClickPosition) {
        console.log('🐁 is right click on card') // temp
      }
    },
    // on scroll
    handleScrollEvents (event) {
      prevCursorPosition = undefined
    },
    // on native context menu
    handleContextMenuEvents (event) {
      if (disableContextMenu) {
        disableContextMenu = false
        event.preventDefault()
        return false
      }
    },

    scrollIntoView (card) {
      const element = document.querySelector(`article [data-card-id="${card.id}"]`)
      utils.scrollIntoView({ element })
    },

    // Add Parent and Child Cards

    updateWithZoom (object) {
      const zoom = this.$store.getters.spaceCounterZoomDecimal
      object.x = Math.round(object.x * zoom)
      object.y = Math.round(object.y * zoom)
      return object
    },

    addCard (options) {
      options = options || {}
      if (this.$store.state.shouldPreventNextEnterKey) {
        this.$store.commit('shouldPreventNextEnterKey', false)
        return
      }
      const canEditSpace = this.$store.getters['currentUser/canEditSpace']()
      if (!canEditSpace) { return }
      const parentCardId = this.$store.state.parentCardId
      let parentCard = document.querySelector(`.card[data-card-id="${parentCardId}"]`)
      const childCardId = this.$store.state.childCardId
      let childCard = document.querySelector(`.card[data-card-id="${childCardId}"]`)
      const childCardData = this.$store.getters['currentCards/byId'](childCardId)
      const shouldOutdentChildToParent = childCard && !childCardData
      const scroll = this.$store.getters.windowScrollWithSpaceOffset()
      const spaceBetweenCards = utils.spaceBetweenCards()
      let position = {}
      let isParentCard = true
      if (shouldOutdentChildToParent) {
        const rect = childCard.getBoundingClientRect()
        const parentRect = parentCard.getBoundingClientRect()
        position = {
          x: scroll.x + parentRect.x,
          y: scroll.y + rect.y
        }
        childCard = false
      } else if (childCard) {
        isParentCard = false
        const rect = childCard.getBoundingClientRect()
        position = {
          x: scroll.x + rect.x,
          y: scroll.y + rect.y + rect.height + spaceBetweenCards
        }
      } else if (parentCard) {
        const rect = parentCard.getBoundingClientRect()
        position = {
          x: scroll.x + rect.x,
          y: scroll.y + rect.y + rect.height + spaceBetweenCards
        }
      } else {
        position = {
          x: scroll.x + 100,
          y: scroll.y + 120
        }
      }
      position = this.updateWithZoom(position)
      position = this.nonOverlappingCardPosition(position)
      parentCard = this.$store.getters['currentCards/byId'](parentCardId)
      let backgroundColor
      if (parentCard) {
        backgroundColor = parentCard.backgroundColor
      }
      this.$store.commit('shouldPreventNextEnterKey', true)
      this.$store.dispatch('currentCards/add', { position, isParentCard, backgroundColor, id: options.id })
      if (childCard) {
        this.$store.commit('childCardId', this.$store.state.cardDetailsIsVisibleForCardId)
        this.$nextTick(() => {
          this.addConnection()
        })
      }
    },

    addChildCard (options) {
      options = options || {}
      useSiblingConnectionType = false
      const spaceBetweenCards = utils.spaceBetweenCards()
      const scroll = this.$store.getters.windowScrollWithSpaceOffset()
      const parentCardId = this.$store.state.parentCardId
      const childCardId = this.$store.state.childCardId
      let parentCard = document.querySelector(`.card[data-card-id="${parentCardId}"]`)
      const childCard = document.querySelector(`.card[data-card-id="${childCardId}"]`)
      let baseCard, baseCardId
      if (childCard) {
        baseCard = childCard
        baseCardId = childCardId
      } else if (parentCard) {
        baseCard = parentCard
      } else {
        this.addCard(options)
        return
      }
      const rect = baseCard.getBoundingClientRect()
      let initialPosition = {
        x: scroll.x + rect.x + rect.width + spaceBetweenCards,
        y: scroll.y + rect.y + rect.height + spaceBetweenCards
      }
      initialPosition = this.updateWithZoom(initialPosition)
      const position = this.nonOverlappingCardPosition(initialPosition)
      parentCard = this.$store.getters['currentCards/byId'](parentCardId)
      this.$store.dispatch('currentCards/add', { position, backgroundColor: parentCard.backgroundColor, id: options.id })
      this.$store.commit('childCardId', this.$store.state.cardDetailsIsVisibleForCardId)
      this.$nextTick(() => {
        this.addConnection(baseCardId)
      })
    },

    // recursive
    nonOverlappingCardPosition (position) {
      const spaceBetweenCards = utils.spaceBetweenCards()
      const cards = this.$store.getters['currentCards/isSelectable'](position)
      if (!cards) { return position }
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
        return this.nonOverlappingCardPosition(position)
      } else {
        return position
      }
    },

    addConnectionType () {
      const hasConnectionType = Boolean(this.$store.getters['currentConnections/typeForNewConnections'])
      const shouldUseLastConnectionType = this.$store.state.currentUser.shouldUseLastConnectionType
      if ((shouldUseLastConnectionType || useSiblingConnectionType) && hasConnectionType) { return }
      this.$store.dispatch('currentConnections/addType')
      useSiblingConnectionType = true
    },

    addConnection (cardId) {
      const currentCardId = this.$store.state.cardDetailsIsVisibleForCardId
      let baseCardId
      if (cardId) {
        baseCardId = cardId
        this.$store.commit('parentCardId', cardId) // update the parent for sibling children
      } else {
        baseCardId = this.$store.state.parentCardId
      }
      const baseCard = document.querySelector(`.card[data-card-id="${baseCardId}"]`)
      if (!baseCard) { return }
      const controlPoint = this.$store.state.currentUser.defaultConnectionControlPoint
      let connection = {
        startCardId: baseCardId,
        endCardId: currentCardId,
        path: this.$store.getters['currentConnections/connectionPathBetweenCards'](baseCardId, currentCardId, controlPoint),
        controlPoint
      }
      this.addConnectionType()
      const type = this.$store.getters['currentConnections/typeForNewConnections']
      this.$store.dispatch('currentConnections/add', { connection, type })
    },

    selectedCardIds () {
      return this.$store.state.multipleCardsSelectedIds || []
    },

    // Remove

    removeCardById (cardId) {
      const card = this.$store.getters['currentCards/byId'](cardId)
      this.$store.dispatch('currentCards/remove', card)
    },

    clearAllSelectedCards () {
      this.$store.dispatch('clearMultipleSelected')
      this.$store.commit('cardDetailsIsVisibleForCardId', '')
      this.$store.commit('triggerUpdateHeaderAndFooterPosition')
    },

    canEditCardById (cardId) {
      const isSpaceMember = this.$store.getters['currentUser/isSpaceMember']()
      const card = this.$store.getters['currentCards/byId'](cardId)
      const cardIsCreatedByCurrentUser = this.$store.getters['currentUser/cardIsCreatedByCurrentUser'](card)
      const canEditSpace = this.$store.getters['currentUser/canEditSpace']()
      if (isSpaceMember) { return true }
      if (canEditSpace && cardIsCreatedByCurrentUser) { return true }
      return false
    },

    canEditConnectionById (connectionId) {
      const isSpaceMember = this.$store.getters['currentUser/isSpaceMember']()
      const connection = this.$store.getters['currentConnections/byId'](connectionId)
      const connectionIsCreatedByCurrentUser = this.$store.getters['currentUser/connectionIsCreatedByCurrentUser'](connection)
      const canEditSpace = this.$store.getters['currentUser/canEditSpace']()
      if (isSpaceMember) { return true }
      if (canEditSpace && connectionIsCreatedByCurrentUser) { return true }
      return false
    },

    remove () {
      this.$store.dispatch('history/resume')
      const selectedConnectionIds = this.$store.state.multipleConnectionsSelectedIds
      const cardIds = this.selectedCardIds()
      const boxes = this.$store.getters['currentBoxes/isSelected']
      selectedConnectionIds.forEach(connectionId => {
        if (this.canEditConnectionById(connectionId)) {
          const connection = this.$store.getters['currentConnections/byId'](connectionId)
          this.$store.dispatch('currentConnections/remove', connection)
        }
      })
      cardIds.forEach(cardId => {
        if (this.canEditCardById(cardId)) {
          this.removeCardById(cardId)
        }
      })
      boxes.forEach(box => {
        const canEditBox = this.$store.getters['currentUser/canEditBox'](box)
        if (canEditBox) {
          this.$store.dispatch('currentBoxes/remove', box)
        }
      })
      this.$store.dispatch('currentConnections/removeUnusedTypes')
      this.clearAllSelectedCards()
      this.$store.dispatch('closeAllDialogs')
    },

    // Copy, Cut

    async handleCopyCutEvent (event) {
      const isSpaceScope = checkIsSpaceScope(event)
      if (!isSpaceScope) { return }
      this.$store.commit('clearNotificationsWithPosition')
      const position = currentCursorPosition || prevCursorPosition
      event.preventDefault()
      try {
        await this.writeSelectedToClipboard()
        if (event.type === 'cut') { this.remove() }
        this.$store.commit('addNotificationWithPosition', { message: utils.pastTense(event.type), position, type: 'success', layer: 'app', icon: 'cut' })
      } catch (error) {
        console.warn('🚑 handleCopyCutEvent', error)
        const message = error.message || `Could not ${event.type}`
        this.$store.commit('addNotificationWithPosition', { message, position, type: 'danger', layer: 'app', icon: 'cut' })
      }
    },

    // Paste

    notifyPasted (position) {
      this.$store.commit('addNotificationWithPosition', { message: 'Pasted', position, type: 'success', layer: 'app', icon: 'cut' })
    },

    async getClipboardData () {
      this.$store.commit('clearNotificationsWithPosition')
      let position = currentCursorPosition || prevCursorPosition
      try {
        this.notifyPasted(position)
        if (!navigator.clipboard.read) {
          return utils.clone(this.$store.state.clipboardDataPolyfill)
        }
        const text = await navigator.clipboard.readText()
        return { text }
      } catch (error) {
        console.error('🚑 getClipboardData', error)
        this.$store.commit('addNotificationWithPosition', { message: `Could not paste`, position, type: 'danger', layer: 'app', icon: 'cut' })
      }
    },

    normalizePasteData (data) {
      data.cards = data.cards.map(card => {
        card.name = utils.decodeEntitiesFromHTML(card.name)
        return card
      })
      data.boxes = data.boxes.map(box => {
        box.name = utils.decodeEntitiesFromHTML(box.name)
        return box
      })
      return data
    },

    handlePasteKinopioData (data, position) {
      if (!data.cards) { return }
      this.$store.dispatch('history/pause')
      this.normalizePasteData(data)
      data = this.$store.getters['currentSpace/newItems']({ items: data })
      let { cards, connectionTypes, connections, boxes } = data
      // update positions
      cards = utils.itemsPositionsShifted(cards, position)
      boxes = utils.itemsPositionsShifted(boxes, position)
      // add items
      this.$store.dispatch('currentCards/addMultiple', { cards })
      connectionTypes.forEach(connectionType => this.$store.dispatch('currentConnections/addType', connectionType))
      connections.forEach(connection => this.$store.dispatch('currentConnections/add', { connection, type: { id: connection.connectionTypeId } }))
      boxes.forEach(box => this.$store.dispatch('currentBoxes/add', { box }))
      this.$store.dispatch('currentConnections/updatePaths', { connections: connections, shouldUpdateApi: true })
      // select new items
      const cardIds = cards.map(card => card.id)
      const connectionIds = connections.map(connection => connection.id)
      const boxIds = boxes.map(box => box.id)
      this.$store.commit('multipleCardsSelectedIds', cardIds)
      this.$store.commit('multipleConnectionsSelectedIds', connectionIds)
      this.$store.commit('multipleBoxesSelectedIds', boxIds)
      // ⏺ history
      this.$store.dispatch('history/resume')
      this.$store.dispatch('history/add', { cards, connectionTypes, connections, boxes, useSnapshot: true })
      this.afterPaste({ cards, boxes })
    },

    handlePastePlainText (data, position) {
      this.$store.dispatch('history/pause')
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
      this.$store.dispatch('currentCards/addMultiple', { cards })
      this.$store.dispatch('currentCards/distributeVertically', cards)
      this.$nextTick(() => {
        // select
        const cardIds = cards.map(card => card.id)
        this.$store.commit('multipleCardsSelectedIds', cardIds)
        // ⏺ history
        cards = cardIds.map(cardId => this.$store.getters['currentCards/byId'](cardId))
        this.$store.dispatch('history/resume')
        this.$store.dispatch('history/add', { cards, useSnapshot: true })
        // update page size
        this.$nextTick(() => {
          this.afterPaste({ cards, boxes: [] })
        })
      })
    },

    afterPaste ({ cards, boxes }) {
      cards.forEach(card => {
        this.$store.dispatch('checkIfItemShouldIncreasePageSize', card)
        this.$store.dispatch('currentCards/updateURLQueryStrings', { cardId: card.id })
      })
      boxes.forEach(box => {
        this.$store.dispatch('checkIfItemShouldIncreasePageSize', box)
      })
    },

    async handlePasteEvent (event) {
      const isSpaceScope = checkIsSpaceScope(event)
      if (!isSpaceScope) { return }
      event.preventDefault()
      let position = currentCursorPosition || prevCursorPosition
      position = this.updateWithZoom(position)
      // check card limits
      if (this.$store.getters['currentSpace/shouldPreventAddCard']) {
        this.$store.commit('notifyCardsCreatedIsOverLimit', true)
        return
      }
      // check read only
      this.$store.dispatch('currentUser/notifyReadOnly', position)
      // get clipboard data
      let data = await this.getClipboardData()
      console.log('🎊 pasteData', data, position)
      if (!data) { return }
      this.$store.commit('closeAllDialogs')
      this.$store.commit('clearMultipleSelected')
      // add data items
      if (data.isKinopioData) {
        this.handlePasteKinopioData(data, position)
      // add plain text cards
      } else {
        data.text = utils.decodeEntitiesFromHTML(data.text)
        this.handlePastePlainText(data, position)
      }
    },

    async writeSelectedToClipboard () {
      const selectedItems = this.$store.getters['currentSpace/selectedItems']
      const { cards, connectionTypes, connections, boxes } = selectedItems
      let data = { isKinopioData: true, cards, connections, connectionTypes, boxes }
      const text = utils.textFromCardNames(cards)
      console.log('🎊 copyData', data, text)
      try {
        this.$store.commit('clipboardDataPolyfill', data)
        await navigator.clipboard.writeText(text)
      } catch (error) {
        console.warn('🚑 writeSelectedToClipboard', error)
        throw { error }
      }
    },

    // Select All Cards Below Cursor

    selectAllItemsBelowCursor (position) {
      const preventMultipleSelectedActionsIsVisible = this.$store.state.preventMultipleSelectedActionsIsVisible
      let zoom
      if (position) {
        zoom = 1
      } else {
        // is from keyboard shortcut
        position = currentCursorPosition
        zoom = this.$store.getters.spaceZoomDecimal
      }
      // cards
      const cards = this.$store.getters['currentCards/isBelowY'](position.y, zoom)
      const cardIds = cards.map(card => card.id)
      // boxes
      let boxes = utils.clone(this.$store.getters['currentBoxes/all'])
      boxes = boxes.filter(boxes => (boxes.y * zoom) > position.y)
      const boxIds = boxes.map(boxes => boxes.id)
      // select
      if (cardIds.length && preventMultipleSelectedActionsIsVisible) {
        this.$store.commit('multipleCardsSelectedIds', cardIds)
        this.$store.commit('multipleBoxesSelectedIds', boxIds)
      } else if (cardIds.length) {
        this.$store.commit('multipleSelectedActionsPosition', position)
        this.$store.commit('multipleSelectedActionsIsVisible', true)
        this.$store.commit('multipleCardsSelectedIds', cardIds)
        this.$store.commit('multipleBoxesSelectedIds', boxIds)
      } else {
        this.$store.commit('multipleSelectedActionsIsVisible', false)
        this.$store.commit('multipleCardsSelectedIds', [])
        this.$store.commit('multipleBoxesSelectedIds', [])
      }
    },

    // Select All Cards, Connections, and Boxes

    selectAllItems () {
      const cardIds = utils.clone(this.$store.state.currentCards.ids)
      const connectionIds = utils.clone(this.$store.state.currentConnections.ids)
      const boxIds = utils.clone(this.$store.state.currentBoxes.ids)
      const dialogOffset = {
        width: 200 / 2,
        height: 150 / 2
      }
      const viewportCenter = {
        x: (this.$store.state.viewportWidth / 2) + window.scrollX - dialogOffset.width,
        y: (this.$store.state.viewportHeight / 2) + window.scrollY - dialogOffset.height
      }
      this.$store.commit('multipleSelectedActionsPosition', viewportCenter)
      this.$store.commit('multipleSelectedActionsIsVisible', true)
      this.$store.commit('multipleConnectionsSelectedIds', connectionIds)
      this.$store.commit('multipleCardsSelectedIds', cardIds)
      this.$store.commit('multipleBoxesSelectedIds', boxIds)
    },

    // Search/Jump-to

    focusOnSpaceDetailsFilter () {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerSpaceDetailsVisible')
      this.$nextTick(() => {
        this.$nextTick(() => {
          this.$nextTick(() => {
            this.$store.commit('triggerFocusResultsFilter')
          })
        })
      })
    },
    focusOnSearchCardFilter (event) {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('searchIsVisible', true)
      console.log('🍇🍇🍇', event.shiftKey, event)
      if (event.shiftKey) {
        this.$store.commit('triggerSearchScopeIsRemote')
      } else {
        this.$store.commit('triggerSearchScopeIsLocal')
      }
      this.$nextTick(() => {
        this.$nextTick(() => {
          this.$nextTick(() => {
            this.$store.commit('triggerFocusResultsFilter')
          })
        })
      })
    },

    // Lock Cards

    toggleLockCards () {
      const multipleCardIds = this.$store.state.multipleCardsSelectedIds
      const cardId = this.$store.state.cardDetailsIsVisibleForCardId
      let cards
      if (multipleCardIds.length) {
        cards = multipleCardIds.map(id => this.$store.getters['currentCards/byId'](id))
      } else if (cardId) {
        cards = [this.$store.getters['currentCards/byId'](cardId)]
      } else {
        cards = this.$store.getters['currentCards/all']
        cards = cards.filter(card => utils.isPointInsideCard(currentCursorPosition, card))
      }
      cards = cards.filter(card => Boolean(card))
      if (!cards) { return }
      // update
      const lockedCards = cards.filter(card => card.isLocked)
      const shouldLock = cards.length !== lockedCards.length
      cards.forEach(card => {
        this.$store.dispatch('currentCards/update', { id: card.id, isLocked: shouldLock })
      })
    }

  }
}
</script>
