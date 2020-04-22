<template lang='pug'>
</template>

<script>
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfill
import last from 'lodash-es/last'

import utils from '@/utils.js'

const incrementPosition = 20

export default {
  mounted () {
    window.addEventListener('keyup', this.handleShortcuts)
    // event.metaKey only works on keydown
    window.addEventListener('keydown', this.handleMetaKeyShortcuts)
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
        this.$store.commit('closeAllDialogs')
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
      }
    },

    scrollIntoView (card) {
      const element = document.querySelector(`article [data-card-id="${card.id}"]`)
      scrollIntoView(element, {
        behavior: 'smooth',
        scrollMode: 'if-needed'
      })
    },

    notifyCopyCut (word) {
      const cardIds = this.focusedCardIds()
      const pluralizedCard = utils.pluralize('Card', cardIds.length > 1)
      this.$store.commit('addNotification', { message: `${pluralizedCard} ${word}`, type: 'success', icon: 'cut' })
    },

    // Add Parent and Child Cards

    addCard () {
      this.$store.commit('generateCardMap')
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
      if (!defaultType) {
        this.$store.dispatch('currentSpace/addConnectionType')
      }
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
      const cardMap = this.$store.state.cardMap
      let closestDistanceFromCenter = Math.max(viewportWidth, viewportHeight)
      let closestCard
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
      this.$store.commit('generateCardMap')
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
      this.$store.commit('clearMultipleSelected')
      this.$store.commit('cardDetailsIsVisibleForCardId', '')
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
      this.$store.commit('closeAllDialogs')
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
    }

  }
}
</script>
