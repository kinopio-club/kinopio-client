<template lang='pug'>
</template>

<script>
import utils from '@/utils.js'
import scrollIntoView from '@/scroll-into-view.js'
import { nanoid } from 'nanoid'

const incrementPosition = 12
let useSiblingConnectionType
let browserZoomLevel = 0
let disableContextMenu = false
let spaceKeyIsDown = false

let prevCursorPosition, currentCursorPosition

const checkIsSpaceScope = (event) => {
  const isBody = event.target.tagName === 'BODY'
  const isMain = event.target.tagName === 'MAIN'
  const isFocusedCard = event.target.className === 'card'
  return isBody || isMain || isFocusedCard
}

export default {
  name: 'KeyboardShortcutsHandler',
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerAddCard') {
        this.addCard()
      } else if (mutation.type === 'triggerSelectAllCardsBelowCursor') {
        const position = mutation.payload
        this.selectAllCardsBelowCursor(position)
      }
    })
  },
  mounted () {
    window.addEventListener('keyup', this.handleShortcuts)
    // event.metaKey only works on keydown
    window.addEventListener('keydown', this.handleMetaKeyShortcuts)
    window.addEventListener('wheel', this.handleMouseWheelEvents, { passive: false })
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
    window.removeEventListener('wheel', this.handleMouseWheelEvents, { passive: false })
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
      const isFromCard = event.target.classList[0] === 'card'
      const isSpaceScope = checkIsSpaceScope(event)
      // ?
      if (key === '?' && isSpaceScope) {
        this.$store.commit('triggerKeyboardShortcutsIsVisible')
      } else if (key === 'n' && isSpaceScope) {
        this.$store.dispatch('currentSpace/addSpace')
        this.$store.commit('addNotification', { message: 'New space created', icon: 'add', type: 'success', label: 'n' })
        this.$store.commit('triggerSpaceDetailsInfoIsVisible')
      // Backspace, Clear, Delete
      } else if ((key === 'Backspace' || key === 'Clear' || key === 'Delete') && isSpaceScope) {
        this.remove()
      // Escape
      } else if (key === 'Escape' || (key === 'z' && isSpaceScope)) {
        this.$store.dispatch('closeAllDialogs', 'KeyboardShortcutsHandler.escape')
        this.$store.commit('minimapIsVisible', false)
      // → Left
      } else if (key === 'ArrowLeft' && (isSpaceScope || isFromCard)) {
        this.focusNearestCardLeft()
      // ← Right
      } else if (key === 'ArrowRight' && (isSpaceScope || isFromCard)) {
        this.focusNearestCardRight()
      // ↓ Down
      } else if (key === 'ArrowDown' && (isSpaceScope || isFromCard)) {
        this.focusNearestCardDown()
      // ↑ Up
      } else if (key === 'ArrowUp' && (isSpaceScope || isFromCard)) {
        this.focusNearestCardUp()
      // 1
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
        this.$store.commit('minimapIsVisible', false)
        spaceKeyIsDown = false
      }
    },
    // on key down
    handleMetaKeyShortcuts (event) {
      const key = event.key
      const isMeta = event.metaKey || event.ctrlKey
      const isFromCardName = event.target.closest('dialog.card-details')
      const isFromCard = event.target.classList[0] === 'card'
      const isCardScope = isFromCard || isFromCardName
      const isSpaceScope = checkIsSpaceScope(event)
      const isFromInput = event.target.closest('input') || event.target.closest('textarea')
      const isMinimapShortcut = (key === ' ' && event.shiftKey) || key === 'z'
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
        this.selectAllCardsBelowCursor()
      // Select All Cards
      } else if (isMeta && key === 'a' && isSpaceScope) {
        event.preventDefault()
        this.selectAllCards()
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
        this.$store.commit('triggerSpaceZoomOut')
      // Zoom In
      } else if (isMeta && key === '=') {
        const zoom = this.$store.state.spaceZoomPercent
        if (zoom === 100) {
          browserZoomLevel += 1
          return
        }
        event.preventDefault()
        this.$store.commit('triggerSpaceZoomIn')
        // Minimap
      } else if (isMinimapShortcut && isSpaceScope) {
        event.preventDefault()
        if (this.$store.state.minimapIsVisible) { return }
        this.$store.commit('minimapIsVisible', true)
        this.$store.commit('currentUserIsPanningReady', false)
        this.$store.commit('currentUserIsPanning', false)
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
    // on mouse wheel
    handleMouseWheelEvents (event) {
      const isMeta = event.metaKey || event.ctrlKey
      if (!isMeta) { return }
      event.preventDefault()
      const deltaY = event.deltaY
      let shouldZoomIn = deltaY < 0
      let shouldZoomOut = deltaY > 0
      const invertZoom = this.$store.state.currentUser.shouldInvertZoomDirection
      if (invertZoom) {
        shouldZoomIn = deltaY > 0
        shouldZoomOut = deltaY < 0
      }
      let speed = Math.min(Math.abs(deltaY), 5)
      if (shouldZoomIn) {
        this.$store.commit('triggerSpaceZoomIn', speed)
      } else if (shouldZoomOut) {
        this.$store.commit('triggerSpaceZoomOut', speed)
      }
    },
    // on mouse down
    handleMouseDownEvents (event) {
      const rightMouseButton = 2
      const isRightClick = rightMouseButton === event.button
      const isSpaceScope = event.target.id === 'magic-painting'
      const shouldBoxSelect = event.shiftKey && isSpaceScope
      const shouldPan = isRightClick && isSpaceScope
      const position = utils.cursorPositionInPage(event)
      if (shouldBoxSelect) {
        event.preventDefault()
        this.$store.commit('currentUserIsBoxSelecting', true)
        this.$store.commit('currentUserBoxSelectEnd', position)
        this.$store.commit('currentUserBoxSelectStart', position)
      } else if (shouldPan) {
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
      prevCursorPosition = undefined
      this.$store.commit('currentUserIsPanning', false)
      this.$store.commit('currentUserIsBoxSelecting', false)
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
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
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
      let initialPosition = {}
      let isParentCard = true
      if (shouldOutdentChildToParent) {
        const rect = childCard.getBoundingClientRect()
        const parentRect = parentCard.getBoundingClientRect()
        initialPosition.x = window.pageXOffset + parentRect.x
        initialPosition.y = window.pageYOffset + rect.y
        childCard = false
      } else if (childCard) {
        isParentCard = false
        const rect = childCard.getBoundingClientRect()
        initialPosition.x = window.pageXOffset + rect.x
        initialPosition.y = window.pageYOffset + rect.y + rect.height + incrementPosition
      } else if (parentCard) {
        const rect = parentCard.getBoundingClientRect()
        initialPosition.x = window.pageXOffset + rect.x
        initialPosition.y = window.pageYOffset + rect.y + rect.height + incrementPosition
      } else {
        initialPosition.x = window.pageXOffset + 40
        initialPosition.y = window.pageYOffset + 80
      }
      initialPosition = this.updateWithZoom(initialPosition)
      const position = this.nonOverlappingCardPosition(initialPosition)
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
        x: window.pageXOffset + rect.x + rect.width + incrementPosition,
        y: window.pageYOffset + rect.y + rect.height + incrementPosition
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
      const cardMap = this.$store.state.currentCards.cardMap
      const overlappingCard = cardMap.find(card => {
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
        position.y = position.y + overlappingCard.height + incrementPosition
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
      let connection = {
        startCardId: baseCardId,
        endCardId: currentCardId,
        path: utils.connectionBetweenCards(baseCardId, currentCardId)
      }
      this.addConnectionType()
      const type = this.$store.getters['currentConnections/typeForNewConnections']
      this.$store.dispatch('currentConnections/add', { connection, type })
    },

    // Keyboard Arrows

    focusNearestCardLeft () {
      this.focusCard('left')
    },
    focusNearestCardRight () {
      this.focusCard('right')
    },
    focusNearestCardDown () {
      this.focusCard('down')
    },
    focusNearestCardUp () {
      this.focusCard('up')
    },

    closestCardToOriginCard (originCard, direction, cards) {
      let closest = Number.MAX_VALUE
      let closestCard
      const distanceWeighting = 0.5
      const angleWeighting = 0.5
      cards.forEach(card => {
        const originPosition = utils.rectCenter(originCard)
        const cardPosition = utils.rectCenter(card)
        const distance = utils.distanceBetweenTwoPoints(originPosition, cardPosition)
        const angle = utils.angleBetweenTwoPoints(originPosition, cardPosition)
        const orientation = this.orientation(direction)
        const angleDelta = Math.abs(orientation - angle)
        const cardCloseness = (distanceWeighting * distance) + (angleWeighting * angleDelta)
        if (cardCloseness < closest) {
          closest = cardCloseness
          closestCard = card
        }
      })
      if (closestCard) {
        this.$store.commit('parentCardId', closestCard.id)
        return closestCard
      } else {
        return originCard
      }
    },

    orientation (direction) {
      if (direction === 'up' || direction === 'down') {
        return 90
      } else {
        return 0
      }
    },

    closestCardToViewportCenter () {
      const viewportWidth = this.$store.state.viewportWidth
      const viewportHeight = this.$store.state.viewportHeight
      const viewportCenter = {
        x: (viewportWidth / 2) + window.scrollX,
        y: (viewportHeight / 2) + window.scrollY
      }
      let closestDistanceFromCenter = Math.max(viewportWidth, viewportHeight)
      let closestCard
      const cardMap = this.$store.state.currentCards.cardMap
      if (!cardMap.length) { return }
      cardMap.forEach(card => {
        const toPosition = utils.rectCenter(card)
        const distance = utils.distanceBetweenTwoPoints(viewportCenter, toPosition)
        if (distance < closestDistanceFromCenter) {
          closestDistanceFromCenter = distance
          closestCard = card
        }
      })
      this.$store.commit('parentCardId', closestCard.id)
      return closestCard
    },

    currentFocusedCard () {
      const cardMap = this.$store.state.currentCards.cardMap
      let lastCardId = this.$store.state.parentCardId || this.$store.state.childCardId
      let lastCard = cardMap.find(card => card.id === lastCardId)
      if (lastCard) {
        return lastCard
      } else {
        return this.closestCardToViewportCenter()
      }
    },

    focusCard (direction) {
      const cardMap = this.$store.state.currentCards.cardMap
      if (!cardMap.length) { return }
      const originCard = this.currentFocusedCard()
      let focusableCards
      if (direction === 'left') {
        focusableCards = cardMap.filter(card => {
          const isOnLeftSide = card.x < originCard.x
          return isOnLeftSide
        })
      } else if (direction === 'right') {
        focusableCards = cardMap.filter(card => {
          const isOnRightSide = card.x > originCard.x
          return isOnRightSide
        })
      } else if (direction === 'down') {
        focusableCards = cardMap.filter(card => {
          const isOnDownSide = card.y > originCard.y
          return isOnDownSide
        })
      } else if (direction === 'up') {
        focusableCards = cardMap.filter(card => {
          const isOnTopSide = card.y < originCard.y
          return isOnTopSide
        })
      }
      focusableCards = focusableCards.filter(card => card.id !== this.$store.state.parentCardId)
      const closestCard = this.closestCardToOriginCard(originCard, direction, focusableCards)
      document.querySelector(`.card[data-card-id="${closestCard.id}"]`).focus()
    },

    focusedCardIds () {
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
      const cardIds = this.focusedCardIds()
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
      this.$store.dispatch('currentConnections/removeUnusedTypes')
      this.clearAllSelectedCards()
      this.$store.dispatch('closeAllDialogs', 'KeyboardShortcutsHandler.remove')
    },

    // Copy, Cut

    async handleCopyCutEvent (event) {
      const isFromCard = event.target.classList[0] === 'card'
      const isSpaceScope = checkIsSpaceScope(event)
      const shouldHandle = isFromCard || isSpaceScope
      if (!shouldHandle) { return }
      event.preventDefault()
      await this.writeSelectedToClipboard()
      console.log(event.type)
      if (event.type === 'cut') {
        this.remove()
      }
      this.$store.commit('addNotification', { message: utils.pastTense(event.type), type: 'success', icon: 'cut' })
    },

    // Paste

    async getClipboardData () {
      try {
        const clipboardItems = await navigator.clipboard.read()
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
              return { text }
            }
            const data = JSON.parse(text)
            if (data.isKinopioData) {
              return data
            }
          // plain text
          } else if (hasText) {
            const index = item.types.indexOf('text/plain')
            const type = item.types[index]
            const blob = await item.getType(type)
            let text = await blob.text()
            text = utils.trim(text)
            return { text }
          }
        }
      } catch (error) {
        console.error('🚑 getClipboardData', error)
      }
    },

    handlePasteKinopioData (data, position) {
      data = utils.uniqueSpaceItems(data)
      let { cards, connectionTypes, connections } = data
      // add cards
      cards = utils.cardsPositionsShifted(cards, position)
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
        connections.forEach(connection => {
          const type = { id: connection.connectionTypeId }
          this.$store.dispatch('currentConnections/add', { connection, type, shouldNotRecordHistory: true })
          this.$store.dispatch('currentConnections/updatePaths', { connections, cards })
        })
      }, 20)
      // select
      const cardIds = cards.map(card => card.id)
      const connectionIds = connections.map(connection => connection.id)
      this.$store.commit('multipleCardsSelectedIds', cardIds)
      this.$store.commit('multipleConnectionsSelectedIds', connectionIds)
      // ⏺ history
      this.$store.dispatch('history/resume')
      this.$store.dispatch('history/add', { cards, connectionTypes, connections, useSnapshot: true })
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
      // update y positions
      this.$nextTick(() => {
        const spaceBetweenCards = 12
        const zoom = this.$store.getters.spaceCounterZoomDecimal
        let prevCard
        cards.forEach((card, index) => {
          if (index === 0) {
            prevCard = card
          } else {
            const prevCardElement = document.querySelector(`article [data-card-id="${prevCard.id}"]`)
            const prevCardRect = prevCardElement.getBoundingClientRect()
            card.y = prevCard.y + (prevCardRect.height * zoom) + spaceBetweenCards
            prevCard = card
          }
          card = utils.updateCardDimensions(card)
          this.$store.dispatch('currentCards/update', {
            name: card.name,
            id: card.id,
            y: card.y,
            width: card.width,
            height: card.height
          })
        })
      })
      // select
      const cardIds = cards.map(card => card.id)
      this.$store.commit('multipleCardsSelectedIds', cardIds)
      // ⏺ history
      this.$store.dispatch('history/resume')
      this.$store.dispatch('history/add', { cards, useSnapshot: true })
    },

    async handlePasteEvent (event) {
      const isSpaceScope = checkIsSpaceScope(event)
      if (!isSpaceScope) { return }
      event.preventDefault()
      let data = await this.getClipboardData()
      let position = currentCursorPosition || prevCursorPosition
      position = this.updateWithZoom(position)
      console.log('🎊 pasteData', data, position)
      if (!data) { return }
      this.$store.commit('closeAllDialogs')
      this.$store.commit('clearMultipleSelected')
      this.$store.dispatch('history/pause')
      if (data.isKinopioData) {
        this.handlePasteKinopioData(data, position)
      } else {
        this.handlePastePlainText(data, position)
      }
    },

    async writeSelectedToClipboard () {
      const cardIds = this.focusedCardIds()
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
      let data = { isKinopioData: true, cards, connections, connectionTypes }
      data = JSON.stringify(data)
      data = `<kinopio>${data}</kinopio>`
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ // eslint-disable-line no-undef
            'text/plain': utils.textFromCardNames(cards),
            'text/html': data
          })
        ])
      } catch (error) {
        console.warn('🚑 writeSelectedToClipboard', error)
      }
    },

    // Select All Cards Below Cursor

    selectAllCardsBelowCursor (position) {
      const canEditSpace = this.$store.getters['currentUser/canEditSpace']()
      if (!canEditSpace) { return }
      const preventMultipleSelectedActionsIsVisible = this.$store.state.preventMultipleSelectedActionsIsVisible
      position = position || currentCursorPosition
      const zoom = this.$store.getters.spaceZoomDecimal
      let cards = utils.clone(this.$store.getters['currentCards/all'])
      cards = cards.filter(card => (card.y * zoom) > position.y)
      cards = cards.map(card => card.id)
      if (cards.length && preventMultipleSelectedActionsIsVisible) {
        this.$store.commit('multipleCardsSelectedIds', cards)
      } else if (cards.length) {
        this.$store.commit('multipleSelectedActionsPosition', position)
        this.$store.commit('multipleSelectedActionsIsVisible', true)
        this.$store.commit('multipleCardsSelectedIds', cards)
      } else {
        this.$store.commit('multipleSelectedActionsIsVisible', false)
        this.$store.commit('multipleCardsSelectedIds', [])
      }
    },

    // Select All Cards

    selectAllCards () {
      const canEditSpace = this.$store.getters['currentUser/canEditSpace']()
      if (!canEditSpace) { return }
      let cards = utils.clone(this.$store.getters['currentCards/all'])
      cards = cards.map(card => card.id)
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
      this.$store.commit('multipleCardsSelectedIds', cards)
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
      const lockedCards = cards.filter(card => card.isLocked)
      const shouldLock = cards.length !== lockedCards.length
      cards.forEach(card => {
        this.$store.dispatch('currentCards/update', { id: card.id, isLocked: shouldLock })
      })
      this.$store.dispatch('currentCards/updateCardMap')
    }

  }
}
</script>
