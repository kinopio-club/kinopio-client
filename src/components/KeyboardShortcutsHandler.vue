<template lang='pug'>
</template>

<script>
export default {
  mounted () {
    window.addEventListener('keyup', this.handleShortcuts)
    // event.metaKey only works on keydown
    window.addEventListener('keydown', this.handleMetaKeyShortcuts)
  },
  methods: {
    handleShortcuts (event) {
      const key = event.key
      if (event.target.tagName !== 'BODY') { return }
      if (event.shiftKey && key === 'Enter') {
        this.addChildOrParentCard()
      } else if (key === 'Enter') {
        this.addParentOrSiblingCard()
      } else if (key === 'Escape') {
        this.closeAddDialogsAndClearParentCard()
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
      // position based on ...
      const position = {
        x: 50,
        y: 100
      }

      const parentCardId = this.$store.state.parentCardId
      const isParentCard = !parentCardId
      this.$store.dispatch('currentSpace/addCard', { position, isParentCard })
    },
    addChildOrParentCard () {
      console.log('add child card, or parent if no parent')
    },
    closeAddDialogsAndClearParentCard () {
      this.$store.commit('closeAllDialogs')
      this.$store.commit('parentCardId', '', { root: true })
    },
    removeMultipleSelected () {
      console.log('remove selected , or currentcard/connection w details open')
      this.$store.commit('closeAllDialogs')
    }

  }
}
</script>
