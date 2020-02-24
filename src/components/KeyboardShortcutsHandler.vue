<template lang='pug'>
</template>

<script>
import utils from '@/utils.js'

export default {
  mounted () {
    window.addEventListener('keyup', this.handleShortcuts)
    // event.metaKey only works on keydown
    window.addEventListener('keydown', this.handleMetaKeyShortcuts)
    // console.log('🇨🇦', this.$store.state.currentSpace.connectionTypes)
  },
  methods: {
    handleShortcuts (event) {
      const key = event.key
      if (key === 'Escape') {
        this.closeAddDialogs()
      }
      if (event.target.tagName !== 'BODY') { return }
      if (event.shiftKey && key === 'Enter') {
        this.addChildCard()
      } else if (key === 'Enter') {
        this.addParentOrSiblingCard()
      } else if (key === '?') {
        this.$store.commit('triggerKeyboardShortcutsIsVisible')
      } else if (key === 'Backspace') {
        this.removeMultipleSelected()
      }
    },
    handleMetaKeyShortcuts (event) {
      // get selected card ids from this.$store.state.multipleCardsSelectedIds
      // save copied/cut card info (utils.clone, change id first) to a new store.js [{}] value (copiedCards: [])
      // to paste, add copiedCards to the currentSpace, then clearCopiedCards
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

    addParentOrSiblingCard () {
      console.log('add parent or sibling card')
      this.$store.commit('generateCardMap')
      const position = this.cardPosition({
        x: window.pageXOffset + 40,
        y: window.pageYOffset + 80
      })

      const isParentCard = true // temp, cuz sibling
      // const parentCardId = this.$store.state.parentCardId
      // const isParentCard = !parentCardId
      // is sibling if childCardId
      this.$store.dispatch('currentSpace/addCard', { position, isParentCard })
    },
    cardPosition (position) {
      const incrementY = 20
      const cardMap = this.$store.state.cardMap
      let existingCard = cardMap.find(card => card.x === position.x && card.y === position.y)
      // console.log('🍄',existingCard, cardMap)
      if (existingCard) {
        position.y = position.y + existingCard.height + incrementY
        return this.cardPosition(position)
      }
      return position
    },

    addConnection () {
      const parentCardId = this.$store.state.parentCardId
      const currentCardId = this.$store.state.cardDetailsIsVisibleForCardId
      let connection = {
        startCardId: parentCardId,
        endCardId: currentCardId,
        path: utils.connectionBetweenCards(parentCardId, currentCardId)
      }
      const connectionType = this.$store.getters['currentSpace/connectionTypeForNewConnections']
      // console.log(connectionType.color)
      this.$store.dispatch('currentSpace/addConnection', { connection, connectionType })
    },

    addChildCard () {
      const parentCardId = this.$store.state.parentCardId
      const parentCard = document.querySelector(`.card[data-card-id="${parentCardId}"]`)
      if (parentCard) {
        const rect = parentCard.getBoundingClientRect()
        const position = this.cardPosition({
          x: window.pageXOffset + rect.x + rect.width + 20,
          y: window.pageYOffset + rect.y + rect.height + 20
        })
        this.$store.dispatch('currentSpace/addCard', { position })
        this.$nextTick(() => {
          this.addConnection()
        })
      } else {
        this.addParentOrSiblingCard()
      }
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
