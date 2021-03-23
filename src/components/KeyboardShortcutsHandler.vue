<template lang='pug'>
</template>

<script>
import scrollIntoView from '@/scroll-into-view.js'
import last from 'lodash-es/last'

import utils from '@/utils.js'

const incrementPosition = 12
let useSiblingConnectionType

export default {
  mounted () {
    window.addEventListener('keyup', this.handleShortcuts)
    // event.metaKey only works on keydown
    window.addEventListener('keydown', this.handleMetaKeyShortcuts)
    window.addEventListener('wheel', this.handleMouseWheelEvents)
  },
  computed: {
  },
  methods: {
    handleShortcuts (event) {
      const key = event.key
      // console.warn('🎹', key)
      const isFromCardName = event.target.closest('dialog.card-details')
      const isFromCard = event.target.classList[0] === 'card'
      const isSpaceScope = event.target.tagName === 'BODY'
      const isCardScope = isFromCard || isFromCardName
      // Shift-Enter
      if (event.shiftKey && key === 'Enter' && (isSpaceScope || isCardScope)) {
        this.addChildCard()
      // Enter
      } else if (key === 'Enter' && (isSpaceScope || isCardScope)) {
        this.addCard()
      // ?
      } else if (key === '?' && isSpaceScope) {
        this.$store.commit('triggerKeyboardShortcutsIsVisible')
      // Backspace
      } else if (key === 'Backspace' && isSpaceScope) {
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
      }
    },
    handleMetaKeyShortcuts (event) {
      const key = event.key
      const isMeta = event.metaKey || event.ctrlKey
      const isSpaceScope = event.target.tagName === 'BODY'
      const isFromCard = event.target.classList[0] === 'card'
      // Undo
      if (isMeta && key === 'z' && isSpaceScope) {
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
      // Jump to Space
      } else if (isMeta && key === 'k' && isSpaceScope) {
        event.preventDefault()
        this.focusOnSpaceDetailsFilter()
      // Zoom Reset
      } else if (isMeta && key === '0') {
        this.$store.commit('triggerSpaceZoomReset')
      // Zoom Out
      } else if (isMeta && key === '-') {
        event.preventDefault()
        this.$store.commit('triggerSpaceZoomOut')
      // Zoom In
      } else if (isMeta && key === '=') {
        event.preventDefault()
        this.$store.commit('triggerSpaceZoomIn')
      }
    },
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
      if (shouldZoomIn) {
        this.$store.commit('triggerSpaceZoomIn', 5)
      } else if (shouldZoomOut) {
        this.$store.commit('triggerSpaceZoomOut', 5)
      }
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

    addCard () {
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
      this.$store.commit('updateCardMap')
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
      const rect = baseCard.getBoundingClientRect()
      const initialPosition = {
        x: window.pageXOffset + rect.x + rect.width + incrementPosition,
        y: window.pageYOffset + rect.y + rect.height + incrementPosition
      }
      this.$store.commit('updateCardMap')
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
      const typePref = this.$store.state.currentUser.defaultConnectionTypeId
      const defaultType = this.$store.getters['currentSpace/connectionTypeById'](typePref)
      if (defaultType || useSiblingConnectionType) { return }
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
      this.$store.commit('updateCardMap')
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
      if (!cards.length) { return }
      cards.forEach(card => {
        this.$store.dispatch('currentSpace/pasteCard', card)
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
      const cursor = this.$store.state.prevCursorPosition
      let cards = utils.clone(this.$store.state.currentSpace.cards)
      cards = cards.filter(card => card.y > cursor.y)
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

    // Jump to Space (temporary?)

    focusOnSpaceDetailsFilter () {
      this.$store.commit('triggerSpaceDetailsVisible')
      this.$nextTick(() => {
        this.$nextTick(() => {
          this.$nextTick(() => {
            this.$store.commit('triggerFocusSpaceDetailsFilter')
          })
        })
      })
    }

  }
}
</script>
