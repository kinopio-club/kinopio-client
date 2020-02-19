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
        console.log('add child card')
      } else if (key === 'Enter') {
        console.log('add parent or sibling card')
      } else if (key === 'Escape') {
        console.log('reset parent card')
        this.$store.commit('closeAllDialogs')
      } else if (key === '?') {
        this.$store.commit('triggerKeyboardShortcutsIsVisible')
      } else if (key === 'Backspace') {
        console.log('remove selected , or currentcard/connection w details open')
        this.$store.commit('closeAllDialogs')
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
    }

    // addCard () {
    //   console.log('🏡 add card')
    // }

  }
}
</script>
