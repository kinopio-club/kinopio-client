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
      const isFromBody = event.target.tagName === 'BODY'
      const isFromCardName = event.target.closest('dialog.card-details')
      const isSpaceScope = isFromBody || isFromCardName
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
    }

  }
}
</script>
