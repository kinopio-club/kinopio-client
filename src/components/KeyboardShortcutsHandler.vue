<template lang='pug'>
</template>

<script>
import utils from '@/utils.js'
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
        this.addCard()
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
      const key = event.key
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
        this.$store.commit('addNotification', { message: 'New space created', icon: 'add', type: 'success', label: 'n' })
        this.$store.commit('triggerSpaceDetailsInfoIsVisible')
      // i
      } else if (key === 'i' && isSpaceScope) {
        if (this.$store.state.isAddPage) { return }
        this.$store.dispatch('closeAllDialogs', 'KeyboardShortcutsHandler')
        this.$store.commit('triggerAddToInboxIsVisible')
      // Backspace, Clear, Delete
      } else if ((key === 'Backspace' || key === 'Clear' || key === 'Delete') && isSpaceScope) {
        this.remove()
      // Escape
      } else if (key === 'Escape') {
        this.$store.dispatch('closeAllDialogs', 'KeyboardShortcutsHandler.escape')
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
      const key = event.key
      const isMeta = event.metaKey || event.ctrlKey
      const isCardScope = checkIsCardScope(event)
      const isSpaceScope = checkIsSpaceScope(event)
      const isFromInput = event.target.closest('input') || event.target.closest('textarea')
      // Add Child Card
      if (event.shiftKey && key === 'Enter' && (isSpaceScope || isCardScope)) {
        this.addChildCard()
      // Add Card
      } else if (key === 'Enter' && isSpaceScope) {
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
        event.preventDefault()
        this.focusOnSearchCardFilter()
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
        this.$store.commit('triggerSpaceZoomOut')
      // Zoom In
      } else if (isMeta && key === '=') {
        const zoom = this.$store.state.spaceZoomPercent
        if (zoom === 100) {
          browserZoomLevel += 1
          return
        }
        event.preventDefault()
        this.$store.commit('triggerCenterZoomOrigin')
        this.$store.commit('triggerSpaceZoomIn')
        // Toggle Zoom Out
      } else if (key === 'z' && isSpaceScope) {
        event.preventDefault()
        // this.$store.commit('minimapIsVisible', value)
        this.$store.commit('currentUserIsPanningReady', false)
        this.$store.commit('currentUserIsPanning', false)
      } else if (key === 'p' && isSpaceScope) {
        const value = !this.$store.state.isPresentationMode
        this.$store.commit('isPresentationMode', value)
      // Pan
      } else if (key === ' ' && isSpaceScope) {
        event.preventDefault()
        if (spaceKeyIsDown) { return }
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
      const isRightClick = rightMouseButton === event.button
      const isPanScope = checkIsPanScope(event)
      const toolbarIsBox = this.$store.state.currentUserToolbar === 'box'
      const shouldBoxSelect = event.shiftKey && isPanScope && !toolbarIsBox
      const userDisablePan = this.$store.state.currentUser.shouldDisableRightClickToPan
      const shouldPan = isRightClick && isPanScope && !userDisablePan
      const position = utils.cursorPositionInPage(event)
      if (shouldBoxSelect) {
        event.preventDefault()
        this.$store.commit('currentUserIsBoxSelecting', true)
        this.$store.commit('currentUserBoxSelectEnd', position)
        this.$store.commit('currentUserBoxSelectStart', position)
      } else if (shouldPan) {
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
      const speed = 2
      const position = utils.cursorPositionInPage(event)
      currentCursorPosition = position
      if (this.$store.state.currentUserIsBoxSelecting) {
        this.$store.commit('currentUserBoxSelectEnd', position)
      } else if (this.$store.state.currentUserIsPanning) {
        event.preventDefault()
        if (!prevCursorPosition) {
          prevCursorPosition = position
        }
        const delta = {
          x: Math.ceil((prevCursorPosition.x - position.x) * speed),
          y: Math.ceil((prevCursorPosition.y - position.y) * speed)
        }
        window.scrollBy(delta.x, delta.y)
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
      if (isRightClick) {
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
      utils.scrollIntoView(element)
    },

    // Add Parent and Child Cards

    updateWithZoom (object) {
      const zoom = this.$store.getters.spaceCounterZoomDecimal
      object.x = Math.round(object.x * zoom)
      object.y = Math.round(object.y * zoom)
      return object
    },

    addCard () {
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
      const scroll = this.$store.getters.windowScrollWithSpaceOffset
      const spaceBetweenCards = utils.spaceBetweenCards()
      let position = {}
      let isParentCard = true
      console.log(scroll.x, parentCard, parentCard.getBoundingClientRect().x)
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
          x: scroll.x + 40,
          y: scroll.y + 80
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
      this.$store.dispatch('currentCards/add', { position, isParentCard, backgroundColor })
      if (childCard) {
        this.$store.commit('childCardId', this.$store.state.cardDetailsIsVisibleForCardId)
        this.$nextTick(() => {
          this.addConnection()
        })
      }
    },

    addChildCard () {
      useSiblingConnectionType = false
      const spaceBetweenCards = utils.spaceBetweenCards()
      const scroll = this.$store.getters.windowScrollWithSpaceOffset
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
        this.addCard()
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
      this.$store.dispatch('currentCards/add', { position, backgroundColor: parentCard.backgroundColor })
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
      this.$store.commit('triggerUpdatePositionInVisualViewport')
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
      this.$store.dispatch('closeAllDialogs', 'KeyboardShortcutsHandler.remove')
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

    async getClipboardData () {
      this.$store.commit('clearNotificationsWithPosition')
      const position = currentCursorPosition || prevCursorPosition
      try {
        let clipboardItems
        // TODO add fallback for firefox
        if (!navigator.clipboard.read) {
          const message = 'Pasting cards is not supported by this browser'
          this.$store.commit('addNotification', { message, icon: 'cut', type: 'danger' })
          return
        }
        clipboardItems = await navigator.clipboard.read()
        for (const item of clipboardItems) {
          const hasImage = item.types.includes('image/png')
          const hasHTML = item.types.includes('text/html')
          const hasText = item.types.includes('text/plain')
          if (hasImage) {
          // TODO return { blob }
          // https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/read
          // kinopio data, or html text
          } else if (hasHTML) {
            const index = item.types.indexOf('text/html')
            const type = item.types[index]
            const blob = await item.getType(type)
            let text = await blob.text()
            text = utils.innerHTMLText(text)
            const isJSON = utils.isStringJSON(text)
            if (!isJSON) {
              this.$store.commit('addNotificationWithPosition', { message: 'Pasted', position, type: 'success', layer: 'app', icon: 'cut' })
              return { text }
            }
            const data = JSON.parse(text)
            if (data.isKinopioData) {
              this.$store.commit('addNotificationWithPosition', { message: 'Pasted', position, type: 'success', layer: 'app', icon: 'cut' })
              return data
            }
          // plain text
          } else if (hasText) {
            const index = item.types.indexOf('text/plain')
            const type = item.types[index]
            const blob = await item.getType(type)
            let text = await blob.text()
            text = utils.trim(text)
            this.$store.commit('addNotificationWithPosition', { message: 'Pasted', position, type: 'success', layer: 'app', icon: 'cut' })
            return { text }
          }
        }
      } catch (error) {
        console.error('🚑 getClipboardData', error)
        this.$store.commit('addNotificationWithPosition', { message: `Could not paste`, position, type: 'danger', layer: 'app', icon: 'cut' })
      }
    },

    shouldAddConnection (connection) {
      const startCard = this.$store.getters['currentCards/byId'](connection.startCardId)
      const endCard = this.$store.getters['currentCards/byId'](connection.endCardId)
      return Boolean(startCard && endCard)
    },

    handlePasteKinopioData (data, position) {
      data = utils.uniqueSpaceItems(data)
      let { cards, connectionTypes, connections, boxes } = data
      // relative card and box positions
      cards = cards.map(card => {
        card.isCard = true
        return card
      })
      boxes = boxes.map(box => {
        box.isBox = true
        return box
      })
      let items = cards.concat(boxes)
      items = utils.itemsPositionsShifted(items, position)
      cards = items.filter(item => item.isCard)
      boxes = items.filter(item => item.isBox)
      // add cards
      this.$store.dispatch('currentCards/addMultiple', cards)
      // add new types
      connectionTypes = connectionTypes.map(type => {
        const existingType = this.$store.getters['currentConnections/existingTypeByData'](type)
        if (existingType) {
          connections = utils.updateConnectionsType({ connections, prevTypeId: type.id, newTypeId: existingType.id })
          return existingType
        } else {
          return type
        }
      })
      connectionTypes.forEach(type => {
        this.$store.dispatch('currentConnections/addType', type)
      })
      // add connections
      setTimeout(() => {
        connections = connections.filter(connection => this.shouldAddConnection(connection))
        connections.forEach(connection => {
          const type = { id: connection.connectionTypeId }
          this.$store.dispatch('currentConnections/add', { connection, type, shouldNotRecordHistory: true })
        })
        connections.forEach(connection => {
          this.$store.dispatch('currentConnections/updatePaths', { connections, cards })
        })
      }, 20)
      // add boxes
      boxes.forEach(box => {
        this.$store.dispatch('currentBoxes/add', { box })
      })
      // select
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
      this.$store.dispatch('currentCards/addMultiple', cards)
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
        this.$store.dispatch('currentCards/removeTrackingQueryStrings', { cardId: card.id })
      })
      boxes.forEach(box => {
        this.$store.dispatch('checkIfItemShouldIncreasePageSize', box)
      })
    },

    async handlePasteEvent (event) {
      const isSpaceScope = checkIsSpaceScope(event)
      if (!isSpaceScope) { return }
      event.preventDefault()
      // check card limits
      if (this.$store.getters['currentSpace/shouldPreventAddCard']) {
        this.$store.commit('notifyCardsCreatedIsOverLimit', true)
        return
      }
      // get clipboard data
      let data = await this.getClipboardData()
      let position = currentCursorPosition || prevCursorPosition
      position = this.updateWithZoom(position)
      console.log('🎊 pasteData', data, position)
      if (!data) { return }
      this.$store.commit('closeAllDialogs')
      this.$store.commit('clearMultipleSelected')
      // add items
      this.$store.dispatch('history/pause')
      if (data.isKinopioData) {
        data.cards = data.cards.map(card => {
          card.name = utils.decodeEntitiesFromHTML(card.name)
          return card
        })
        data.boxes = data.boxes.map(box => {
          box.name = utils.decodeEntitiesFromHTML(box.name)
          return box
        })
        this.handlePasteKinopioData(data, position)
      } else {
        data.text = utils.decodeEntitiesFromHTML(data.text)
        this.handlePastePlainText(data, position)
      }
    },

    async writeSelectedToClipboard () {
      const cardIds = this.selectedCardIds()
      const cards = cardIds.map(cardId => {
        return this.$store.getters['currentCards/byId'](cardId)
      })
      const connectionIds = this.$store.state.multipleConnectionsSelectedIds
      const connections = connectionIds.map(connectionId => {
        return this.$store.getters['currentConnections/byId'](connectionId)
      })
      const connectionTypes = connections.map(connection => {
        return this.$store.getters['currentConnections/typeByConnection'](connection)
      })
      const boxes = this.$store.getters['currentBoxes/isSelected']
      if (!cards.length && !connections.length && !boxes.length) {
        throw { message: 'No content selected' }
      }
      let data = { isKinopioData: true, cards, connections, connectionTypes, boxes }
      data = JSON.stringify(data)
      data = `<kinopio>${data}</kinopio>`
      const text = utils.textFromCardNames(cards)
      console.log('🎊 copyData', { cards, connections, connectionTypes, boxes }, text)
      try {
        if (navigator.clipboard.write) {
          await navigator.clipboard.write([
            new ClipboardItem({ // eslint-disable-line no-undef
              'text/plain': new Blob([text], { type: 'text/plain' }),
              'text/html': new Blob([data], { type: 'text/html' })
            })
          ])
        } else {
          await navigator.clipboard.writeText(utils.textFromCardNames(cards))
        }
      } catch (error) {
        console.warn('🚑 writeSelectedToClipboard', error)
        throw { error }
      }
    },

    // Select All Cards Below Cursor

    selectAllItemsBelowCursor (position) {
      const preventMultipleSelectedActionsIsVisible = this.$store.state.preventMultipleSelectedActionsIsVisible
      position = position || currentCursorPosition
      const zoom = this.$store.getters.spaceZoomDecimal
      // cards
      let cards = utils.clone(this.$store.getters['currentCards/all'])
      cards = cards.filter(card => (card.y * zoom) > position.y)
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
      this.$store.dispatch('closeAllDialogs', 'KeyboardShortcutsHandler.focusOnSpaceDetailsFilter')
      this.$store.commit('triggerSpaceDetailsVisible')
      this.$nextTick(() => {
        this.$nextTick(() => {
          this.$nextTick(() => {
            this.$store.commit('triggerFocusResultsFilter')
          })
        })
      })
    },
    focusOnSearchCardFilter () {
      this.$store.dispatch('closeAllDialogs', 'KeyboardShortcutsHandler.focusOnSearchCardFilter')
      this.$store.commit('searchIsVisible', true)
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
