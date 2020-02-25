<template lang='pug'>
</template>

<script>
import last from 'lodash-es/last'
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
      if (key === 'Escape') {
        this.closeAddDialogs()
      }
      const shouldHandleShortcut = event.target.tagName === 'BODY' || event.target.closest('dialog.card-details')
      if (!shouldHandleShortcut) { return }
      if (event.shiftKey && key === 'Enter') {
        this.addChildCard()
      } else if (key === 'Enter') {
        this.addCard()
      } else if (key === '?') {
        this.$store.commit('triggerKeyboardShortcutsIsVisible')
      } else if (key === 'Backspace') {
        this.removeMultipleSelected()
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
      const parentCard = document.querySelector(`.card[data-card-id="${parentCardId}"]`)
      const childCardId = this.$store.state.childCardId
      const childCard = document.querySelector(`.card[data-card-id="${childCardId}"]`)
      const baseCard = childCard || parentCard
      const rect = baseCard.getBoundingClientRect()
      const initialPosition = {
        x: window.pageXOffset + rect.x + rect.width + incrementPosition,
        y: window.pageYOffset + rect.y + rect.height + incrementPosition
      }
      const position = this.nonOverlappingCardPosition(initialPosition)
      this.$store.dispatch('currentSpace/addCard', { position })
      this.$store.commit('childCardId', this.$store.state.cardDetailsIsVisibleForCardId)
      this.$nextTick(() => {
        this.addConnection()
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

    addConnection () {
      const parentCardId = this.$store.state.parentCardId
      const currentCardId = this.$store.state.cardDetailsIsVisibleForCardId
      const parentCard = document.querySelector(`.card[data-card-id="${parentCardId}"]`)
      if (!parentCard) { return }

      let connection = {
        startCardId: parentCardId,
        endCardId: currentCardId,
        path: utils.connectionBetweenCards(parentCardId, currentCardId)
      }
      let connectionType = this.$store.getters['currentSpace/connectionTypeForNewConnections']
      if (!connectionType) {
        this.$store.dispatch('currentSpace/addConnectionType')
        connectionType = last(this.$store.state.currentSpace.connectionTypes)
      }
      // console.log(connectionType.color)
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
