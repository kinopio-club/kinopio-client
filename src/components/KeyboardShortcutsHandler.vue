<template lang='pug'>
</template>

<script>
import utils from '@/utils.js'

import scrollIntoView from '@/scroll-into-view.js'
import last from 'lodash-es/last'
import nanoid from 'nanoid'

const incrementPosition = 12
let useSiblingConnectionType
let browserZoomLevel = 0

let prevCursorPosition

export default {
  name: 'KeyboardShortcutsHandler',
  mounted () {
    window.addEventListener('keyup', this.handleShortcuts)
    // event.metaKey only works on keydown
    window.addEventListener('keydown', this.handleMetaKeyShortcuts)
    window.addEventListener('wheel', this.handleMouseWheelEvents, { passive: false })
    window.addEventListener('mousedown', this.handleMouseDownEvents)
    window.addEventListener('mousemove', this.handleMouseMoveEvents)
    window.addEventListener('mouseup', this.handleMouseUpEvents)
    window.addEventListener('scroll', this.handleScrollEvents)
  },
  beforeUnmount () {
    window.removeEventListener('keyup', this.handleShortcuts)
    window.removeEventListener('keydown', this.handleMetaKeyShortcuts)
    window.removeEventListener('wheel', this.handleMouseWheelEvents, { passive: false })
    window.removeEventListener('mousedown', this.handleMouseDownEvents)
    window.removeEventListener('mousemove', this.handleMouseMoveEvents)
    window.removeEventListener('mouseup', this.handleMouseUpEvents)
    window.removeEventListener('scroll', this.handleScrollEvents)
  },
  computed: {
  },
  methods: {
    // on key up
    handleShortcuts (event) {
      const key = event.key
      // console.warn('🎹', key)
      const isFromCardName = event.target.closest('dialog.card-details')
      const isFromCard = event.target.classList[0] === 'card'
      const isSpaceScope = event.target.tagName === 'BODY'
      const isCardScope = isFromCard || isFromCardName
      // Enter
      if (key === 'Enter' && (isSpaceScope || isCardScope)) {
        this.addCard()
      // ?
      } else if (key === '?' && isSpaceScope) {
        this.$store.commit('triggerKeyboardShortcutsIsVisible')
      } else if (key === 'n' && isSpaceScope) {
        this.$store.dispatch('currentSpace/addSpace')
        this.$store.commit('addNotification', { message: 'New space created', icon: 'add', type: 'success', label: 'N' })
      // Backspace, Clear, Delete
      } else if ((key === 'Backspace' || key === 'Clear' || key === 'Delete') && isSpaceScope) {
        this.remove()
      // Escape
      } else if (key === 'Escape') {
        this.$store.dispatch('closeAllDialogs', 'KeyboardShortcutsHandler.escape')
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
      } else if (key === ' ' && isSpaceScope) {
        this.$store.commit('currentUserIsPanningReady', false)
      }
    },
    // on key down
    handleMetaKeyShortcuts (event) {
      const key = event.key
      const isMeta = event.metaKey || event.ctrlKey
      const isFromCardName = event.target.closest('dialog.card-details')
      const isFromCard = event.target.classList[0] === 'card'
      const isCardScope = isFromCard || isFromCardName
      const isSpaceScope = event.target.tagName === 'BODY'
      // Shift-Enter
      if (event.shiftKey && key === 'Enter' && (isSpaceScope || isCardScope)) {
        this.addChildCard()
      // Undo
      } else if (isMeta && key === 'z' && isSpaceScope) {
        event.preventDefault()
        this.restoreLastRemovedCard()
      // Copy
      } else if (isMeta && key === 'c' && (isSpaceScope || isFromCard)) {
        if (this.focusedCardIds().length) {
          event.preventDefault()
          this.copyCards()
          this.notifyCopyCut('copied')
        }
      // Cut
      } else if (isMeta && key === 'x' && isSpaceScope) {
        if (this.focusedCardIds().length) {
          event.preventDefault()
          this.cutCards()
          this.notifyCopyCut('cut')
        }
      // Paste
      } else if (isMeta && key === 'v' && isSpaceScope) {
        event.preventDefault()
        this.pasteCards()
      // Select All Cards Below Cursor
      } else if (isMeta && event.shiftKey && key === 'a' && isSpaceScope) {
        event.preventDefault()
        this.selectAllCardsBelowCursor(event)
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
      } else if (key === ' ' && isSpaceScope) {
        event.preventDefault()
        if (!this.$store.state.currentUserIsPanningReady) {
          this.$store.commit('currentUserIsPanningReady', true)
        }
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
      if (this.$store.state.currentUserIsPanningReady) {
        event.preventDefault()
        this.$store.commit('currentUserIsPanning', true)
      }
    },
    // on mouse move
    handleMouseMoveEvents (event) {
      const speed = 2
      if (this.$store.state.currentUserIsPanning) {
        event.preventDefault()
        if (!prevCursorPosition) {
          prevCursorPosition = utils.cursorPositionInPage(event)
        }
        const position = utils.cursorPositionInPage(event)
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
    },
    // on scroll
    handleScrollEvents (event) {
      prevCursorPosition = undefined
    },

    scrollIntoView (card) {
      const element = document.querySelector(`article [data-card-id="${card.id}"]`)
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
    },

    notifyCopyCut (word) {
      const cardIds = this.focusedCardIds()
      const pluralizedCard = utils.pluralize('Card', cardIds.length > 1)
      this.$store.commit('addNotification', { message: `${pluralizedCard} ${word}`, type: 'success', icon: 'cut' })
    },

    // Add Parent and Child Cards

    updateWithZoom (object) {
      const zoom = this.$store.getters.spaceCounterZoomDecimal
      object.x = object.x * zoom
      object.y = object.y * zoom
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
      const parentCard = document.querySelector(`.card[data-card-id="${parentCardId}"]`)
      const childCardId = this.$store.state.childCardId
      const childCard = document.querySelector(`.card[data-card-id="${childCardId}"]`)
      let initialPosition = {}
      let isParentCard = true
      if (childCard) {
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
      this.$store.dispatch('currentSpace/addCard', { position, isParentCard })
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
      const parentCard = document.querySelector(`.card[data-card-id="${parentCardId}"]`)
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
      this.$store.commit('shouldPreventNextEnterKey', true)
      const rect = baseCard.getBoundingClientRect()
      let initialPosition = {
        x: window.pageXOffset + rect.x + rect.width + incrementPosition,
        y: window.pageYOffset + rect.y + rect.height + incrementPosition
      }
      initialPosition = this.updateWithZoom(initialPosition)
      const position = this.nonOverlappingCardPosition(initialPosition)
      this.$store.dispatch('currentSpace/addCard', { position })
      this.$store.commit('childCardId', this.$store.state.cardDetailsIsVisibleForCardId)
      this.$nextTick(() => {
        this.addConnection(baseCardId)
      })
    },

    // recursive
    nonOverlappingCardPosition (position) {
      const cardMap = this.$store.state.cardMap
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
      const hasConnectionType = Boolean(this.$store.getters['currentSpace/connectionTypeForNewConnections'])
      const shouldUseLastConnectionType = this.$store.state.currentUser.shouldUseLastConnectionType
      if ((shouldUseLastConnectionType || useSiblingConnectionType) && hasConnectionType) { return }
      this.$store.dispatch('currentSpace/addConnectionType')
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
      const connectionType = this.$store.getters['currentSpace/connectionTypeForNewConnections']
      this.$store.dispatch('currentSpace/addConnection', { connection, connectionType })
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
        this.$store.commit('parentCardId', closestCard.cardId)
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
      const cardMap = this.$store.state.cardMap
      cardMap.forEach(card => {
        const toPosition = utils.rectCenter(card)
        const distance = utils.distanceBetweenTwoPoints(viewportCenter, toPosition)
        if (distance < closestDistanceFromCenter) {
          closestDistanceFromCenter = distance
          closestCard = card
        }
      })
      this.$store.commit('parentCardId', closestCard.cardId)
      return closestCard
    },

    currentFocusedCard () {
      const cardMap = this.$store.state.cardMap
      let lastCardId = this.$store.state.parentCardId || this.$store.state.childCardId
      let lastCard = cardMap.filter(card => card.cardId === lastCardId)
      if (lastCard.length) {
        return lastCard[0]
      } else {
        return this.closestCardToViewportCenter()
      }
    },

    focusCard (direction) {
      const cardMap = this.$store.state.cardMap
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
      focusableCards = focusableCards.filter(card => card.cardId !== this.$store.state.parentCardId)
      const closestCard = this.closestCardToOriginCard(originCard, direction, focusableCards)
      document.querySelector(`.card[data-card-id="${closestCard.cardId}"]`).focus()
    },

    focusedCardIds () {
      return this.$store.state.multipleCardsSelectedIds || []
    },

    // Remove

    removeCardById (cardId) {
      const card = this.$store.getters['currentSpace/cardById'](cardId)
      this.$store.dispatch('currentSpace/removeCard', card)
    },

    clearAllSelectedCards () {
      this.$store.dispatch('clearMultipleSelected')
      this.$store.commit('cardDetailsIsVisibleForCardId', '')
      this.$store.commit('triggerUpdatePositionInVisualViewport')
    },

    canEditCardById (cardId) {
      const isSpaceMember = this.$store.getters['currentUser/isSpaceMember']()
      const card = this.$store.getters['currentSpace/cardById'](cardId)
      const cardIsCreatedByCurrentUser = this.$store.getters['currentUser/cardIsCreatedByCurrentUser'](card)
      const canEditSpace = this.$store.getters['currentUser/canEditSpace']()
      if (isSpaceMember) { return true }
      if (canEditSpace && cardIsCreatedByCurrentUser) { return true }
      return false
    },

    canEditConnectionById (connectionId) {
      const isSpaceMember = this.$store.getters['currentUser/isSpaceMember']()
      const connection = this.$store.getters['currentSpace/connectionById'](connectionId)
      const connectionIsCreatedByCurrentUser = this.$store.getters['currentUser/connectionIsCreatedByCurrentUser'](connection)
      const canEditSpace = this.$store.getters['currentUser/canEditSpace']()
      if (isSpaceMember) { return true }
      if (canEditSpace && connectionIsCreatedByCurrentUser) { return true }
      return false
    },

    remove () {
      const selectedConnectionIds = this.$store.state.multipleConnectionsSelectedIds
      const cardIds = this.focusedCardIds()
      selectedConnectionIds.forEach(connectionId => {
        if (this.canEditConnectionById(connectionId)) {
          const connection = this.$store.getters['currentSpace/connectionById'](connectionId)
          this.$store.dispatch('currentSpace/removeConnection', connection)
        }
      })
      cardIds.forEach(cardId => {
        if (this.canEditCardById(cardId)) {
          this.removeCardById(cardId)
        }
      })
      this.$store.dispatch('currentSpace/removeUnusedConnectionTypes')
      this.clearAllSelectedCards()
      this.$store.dispatch('closeAllDialogs', 'KeyboardShortcutsHandler.remove')
    },

    // Undo

    restoreLastRemovedCard () {
      const removedCards = this.$store.state.currentSpace.removedCards
      if (removedCards.length) {
        const card = removedCards[0]
        this.$store.dispatch('currentSpace/restoreRemovedCard', card)
      }
    },

    // Copy

    copyCards () {
      const cardIds = this.focusedCardIds()
      const cards = cardIds.map(cardId => {
        let card = this.$store.getters['currentSpace/cardById'](cardId)
        return card
      })
      this.$store.commit('addToCopiedCards', cards)
    },

    // Cut

    cutCards () {
      this.copyCards()
      this.remove()
    },

    // Paste

    pasteCards () {
      const cards = this.$store.state.copiedCards
      const isCardsCreatedIsOverLimit = this.$store.getters['currentUser/cardsCreatedWillBeOverLimit'](cards.length)
      if (isCardsCreatedIsOverLimit) {
        this.$store.commit('notifyCardsCreatedIsOverLimit', true)
        return
      }
      if (!cards.length) { return }
      this.$store.commit('clearMultipleSelected')
      this.$store.commit('multipleSelectedActionsIsVisible', false)
      cards.forEach(card => {
        const cardId = nanoid()
        this.$store.dispatch('currentSpace/pasteCard', { card, cardId })
        this.$store.commit('addToMultipleCardsSelected', cardId)
      })
      this.$nextTick(() => {
        const newCard = last(this.$store.state.currentSpace.cards)
        this.scrollIntoView(newCard)
      })
    },

    // Select All Cards Below Cursor

    selectAllCardsBelowCursor (event) {
      const canEditSpace = this.$store.getters['currentUser/canEditSpace']()
      if (!canEditSpace) { return }
      const zoom = this.$store.getters.spaceZoomDecimal
      const cursor = this.$store.state.prevCursorPosition
      let cards = utils.clone(this.$store.state.currentSpace.cards)
      cards = cards.filter(card => (card.y * zoom) > cursor.y)
      cards = cards.map(card => card.id)
      this.$store.commit('multipleSelectedActionsPosition', cursor)
      this.$store.commit('multipleSelectedActionsIsVisible', true)
      this.$store.commit('multipleCardsSelectedIds', cards)
    },

    // Select All Cards

    selectAllCards () {
      const canEditSpace = this.$store.getters['currentUser/canEditSpace']()
      if (!canEditSpace) { return }
      let cards = utils.clone(this.$store.state.currentSpace.cards)
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
    }

  }
}
</script>
