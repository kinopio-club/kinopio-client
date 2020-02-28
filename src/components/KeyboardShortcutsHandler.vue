<template lang='pug'>
</template>

<script>
import utils from '@/utils.js'

const incrementPosition = 20

export default {
  mounted () {
    window.addEventListener('keyup', this.handleShortcuts)
    // event.metaKey only works on keydown
    window.addEventListener('keydown', this.handleMetaKeyShortcuts)
  },
  methods: {
    handleShortcuts (event) {
      const key = event.key
      // console.warn('🎹', key, event)
      const isFromCardName = event.target.closest('dialog.card-details')
      const isFromCard = event.target.className === 'card'
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
        this.removeFocused()
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
      // - TODO get selected card ids from this.$store.state.multipleCardsSelectedIds
      // - TODO save copied/cut card info (utils.clone, change id first) to a new store.js [{}] value (copiedCards: [])
      // - TODO to paste, add copiedCards to the currentSpace, then clearCopiedCards
      const key = event.key
      const isMeta = event.metaKey || event.ctrlKey
      const isSpaceScope = event.target.tagName === 'BODY'
      if (!isSpaceScope) { return }
      // Undo
      if (isMeta && key === 'z') {
        event.preventDefault()
        this.restoreLastRemovedCard()
      // Copy
      } else if (isMeta && key === 'c') {
        event.preventDefault()
        console.log('copy selected cards', this.$store.state.multipleCardsSelectedIds)
      // Cut
      } else if (isMeta && key === 'x') {
        event.preventDefault()
        console.log('cut selected cards', this.$store.state.multipleCardsSelectedIds)
      // Paste
      } else if (isMeta && key === 'v') {
        event.preventDefault()
        console.log('paste selected cards')
      }
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
      const viewportWidth = this.$store.state.viewportWidth
      const viewportHeight = this.$store.state.viewportHeight
      let closestDistanceFromCenter = Math.max(viewportWidth, viewportHeight)
      let closestCard
      cards.forEach(card => {
        let toPosition
        // To Right
        if (direction === 'left') {
          toPosition = {
            x: card.x + card.width,
            y: card.y - (card.height / 2)
          }
        // To Left
        } else if (direction === 'right') {
          toPosition = {
            x: card.x,
            y: card.y - (card.height / 2)
          }
        // To Top
        } else if (direction === 'down') {
          toPosition = {
            x: card.x + (card.width / 2),
            y: card.y
          }
        // To Bottom
        } else if (direction === 'up') {
          toPosition = {
            x: card.x + (card.width / 2),
            y: card.y + card.height
          }
        }
        const distance = utils.distanceBetweenTwoPoints(originCard, toPosition)
        if (distance < closestDistanceFromCenter) {
          closestDistanceFromCenter = distance
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
      const yThreshold = originCard.height + 60
      const xThreshold = originCard.width + 60
      let focusableCards
      if (direction === 'left') {
        focusableCards = cardMap.filter(card => {
          const yOrigin = originCard.y - (originCard.height / 2)
          const isOnLeftSide = card.x < originCard.x
          // todo replace within box calc, w cone calc
          const isWithinY = utils.isBetween({
            value: card.y,
            min: yOrigin - yThreshold,
            max: yOrigin + yThreshold
          })
          return isOnLeftSide && isWithinY
        })
      } else if (direction === 'right') {
        focusableCards = cardMap.filter(card => {
          const yOrigin = originCard.y - (originCard.height / 2)
          const isOnRightSide = card.x > originCard.x + originCard.width
          const isWithinY = utils.isBetween({
            value: card.y,
            min: yOrigin - yThreshold,
            max: yOrigin + yThreshold
          })
          return isOnRightSide && isWithinY
        })
      } else if (direction === 'down') {
        focusableCards = cardMap.filter(card => {
          const xOrigin = originCard.x - (originCard.width / 2)
          const isOnDownSide = card.y > originCard.y + originCard.height
          const isWithinX = utils.isBetween({
            value: card.x,
            min: xOrigin - xThreshold,
            max: xOrigin + xThreshold
          })
          return isOnDownSide && isWithinX
        })
      } else if (direction === 'up') {
        focusableCards = cardMap.filter(card => {
          const xOrigin = originCard.x - (originCard.width / 2)
          const isOnTopSide = card.y < originCard.y
          const isWithinX = utils.isBetween({
            value: card.x,
            min: xOrigin - xThreshold,
            max: xOrigin + xThreshold
          })
          return isOnTopSide && isWithinX
        })
      }
      focusableCards = focusableCards.filter(card => card.cardId !== this.$store.state.parentCardId)
      const closestCard = this.closestCardToOriginCard(originCard, direction, focusableCards)
      document.querySelector(`.card[data-card-id="${closestCard.cardId}"]`).focus()
    },

    // Remove

    removeCardById (cardId) {
      console.log('removeCardById', cardId)
      const card = this.$store.getters['currentSpace/cardById'](cardId)
      this.$store.dispatch('currentSpace/removeCard', card)
    },

    removeFocused () {
      const multipleCardsSelectedIds = this.$store.state.multipleCardsSelectedIds
      const cardId = this.$store.state.cardDetailsIsVisibleForCardId
      if (multipleCardsSelectedIds.length) {
        multipleCardsSelectedIds.forEach(cardId => {
          this.removeCardById(cardId)
        })
        this.$store.commit('clearMultipleSelected')
      } else if (cardId) {
        this.removeCardById(cardId)
        this.$store.commit('cardDetailsIsVisibleForCardId', '')
      }
      this.$store.commit('closeAllDialogs')
    },

    // Undo

    restoreLastRemovedCard () {
      const removedCards = this.$store.state.currentSpace.removedCards
      if (removedCards.length) {
        const card = removedCards[0]
        this.$store.dispatch('currentSpace/restoreRemovedCard', card)
      }
    }

  }
}
</script>
