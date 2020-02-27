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
      console.warn('🎹', key)
      const isFromBody = event.target.tagName === 'BODY'
      const isFromCardName = event.target.closest('dialog.card-details')
      const isSpaceScope = isFromBody || isFromCardName
      const isCardScope = event.target.className === 'card'
      if (event.shiftKey && key === 'Enter' && isSpaceScope) {
        // Shift-Enter
        this.addChildCard()
      } else if (key === 'Enter' && isSpaceScope) {
        // Enter
        this.addCard()
      } else if (key === '?' && isFromBody) {
        // ?
        this.$store.commit('triggerKeyboardShortcutsIsVisible')
      } else if (key === 'Backspace' && isSpaceScope) {
        // Backspace
        this.removeMultipleSelected()
      } else if (key === 'Escape') {
        // Escape
        this.closeAddDialogs()
      } else if (key === 'ArrowLeft' && (isFromBody || isCardScope)) {
        // → Left
        this.focusNearestCardLeft()
      } else if (key === 'ArrowRight' && (isFromBody || isCardScope)) {
        // ← Right
        this.focusNearestCardRight()
      } else if (key === 'ArrowDown' && (isFromBody || isCardScope)) {
        // ↓ Down
        this.focusNearestCardDown()
      } else if (key === 'ArrowUp' && (isFromBody || isCardScope)) {
        // ↑ Up
        this.focusNearestCardUp()
      }
    },
    handleMetaKeyShortcuts (event) {
      // - TODO get selected card ids from this.$store.state.multipleCardsSelectedIds
      // - TODO save copied/cut card info (utils.clone, change id first) to a new store.js [{}] value (copiedCards: [])
      // - TODO to paste, add copiedCards to the currentSpace, then clearCopiedCards
      const key = event.key
      const isMeta = event.metaKey || event.ctrlKey
      if (event.target.tagName !== 'BODY') { return }
      if (isMeta && key === 'c') {
        event.preventDefault()
        console.log('copy selected cards', this.$store.state.multipleCardsSelectedIds)
      } else if (isMeta && key === 'x') {
        event.preventDefault()
        console.log('cut selected cards', this.$store.state.multipleCardsSelectedIds)
      } else if (isMeta && key === 'v') {
        event.preventDefault()
        console.log('paste selected cards')
      }
    },

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
      } else {
        baseCard = parentCard
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

    closeAddDialogs () {
      this.$store.commit('closeAllDialogs')
    },

    removeMultipleSelected () {
      console.log('remove selected , or currentcard/connection w details open')
      this.$store.commit('closeAllDialogs')
    },

    closestCardToOrigin (origin, direction, cards) {
      cards = cards || this.$store.state.cardMap
      console.log('🍄', cards)
      let closestDistanceFromCenter = Math.max(this.$store.state.pageWidth, this.$store.state.pageHeight)
      let closestCard
      cards.forEach(card => {
        let cardPoint
        if (direction === 'center') {
          cardPoint = utils.centerPositionFromRect(card)
        } else if (direction === 'left') {
          // point on right side
          cardPoint = {
            x: card.x + card.width,
            y: card.y - (card.height / 2)
          }
        } else if (direction === 'right') {
          // point on left side
          cardPoint = {
            x: card.x,
            y: card.y - (card.height / 2)
          }
        } else if (direction === 'down') {
          // point on top side
          cardPoint = {
            x: card.x + (card.width / 2),
            y: card.y
          }
        } else if (direction === 'up') {
          // point on bottom side
          cardPoint = {
            x: card.x + (card.width / 2),
            y: card.y + card.height
          }
        }
        const distance = utils.distanceBetweenTwoPoints(origin, cardPoint)

        console.log('🍆', document.querySelector(`.card[data-card-id="${card.cardId}"]`))
        console.log(distance)

        if (distance < closestDistanceFromCenter) {
          closestDistanceFromCenter = distance
          closestCard = card
          // console.log('🍆',closestCard.cardId)
        }
      })
      // if (closestCard) {
      console.log(document.querySelector(`.card[data-card-id="${closestCard.cardId}"]`))

      this.$store.commit('parentCardId', closestCard.cardId)

      return closestCard
      // } else {
      //   return this.currentFocusedCard()
      // }
    },

    currentFocusedCard () {
      const viewportWidth = this.$store.state.viewportWidth
      const viewportHeight = this.$store.state.viewportHeight
      let cardId = this.$store.state.parentCardId || this.$store.state.childCardId
      let element = document.querySelector(`.card[data-card-id="${cardId}"]`)
      if (element) {
        let closestCard = element.getBoundingClientRect()
        closestCard.cardId = cardId
        return closestCard
      } else {
        const origin = {
          x: (viewportWidth / 2) + window.scrollX,
          y: (viewportHeight / 2) + window.scrollY
        }
        const closestCard = this.closestCardToOrigin(origin, 'center')
        return closestCard
      }
    },

    focusCard (direction) {
      this.$store.commit('generateCardMap')
      const cardMap = this.$store.state.cardMap
      const originCard = this.currentFocusedCard()
      // const origin = {
      //   x: originCard.x + (originCard.width / 2),
      //   y: originCard.y - (originCard.height / 2)
      // }
      let focusableCards
      if (direction === 'left') {
        focusableCards = cardMap.filter(card => {
          return card.x < originCard.x
        })
      } else if (direction === 'right') {
        focusableCards = cardMap.filter(card => {
          return card.x + card.width > originCard.x
        })
      } else if (direction === 'down') {
        focusableCards = cardMap.filter(card => {
          return card.y + card.height < originCard.y
        })
      } else if (direction === 'up') {
        focusableCards = cardMap.filter(card => {
          return card.y > originCard.y
        })
      }
      console.log(focusableCards.length)
      focusableCards = focusableCards.filter(card => card.cardId !== this.$store.state.parentCardId)
      console.log(focusableCards.length)
      // console.log('focusable ',focusableCards)
      // focusableCards.forEach(card => {
      //   console.log('🍆',document.querySelector(`.card[data-card-id="${card.cardId}"]`))
      // })
      const closestCard = this.closestCardToOrigin(originCard, direction, focusableCards)
      document.querySelector(`.card[data-card-id="${closestCard.cardId}"]`).focus()
    },

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
    }
  }
}
</script>
