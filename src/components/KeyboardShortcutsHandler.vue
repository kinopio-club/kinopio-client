<template lang='pug'>
</template>

<script>
export default {
  mounted () {
    window.addEventListener('keyup', this.handleKeyboardShortcuts)
  },
  methods: {
    handleKeyboardShortcuts (event) {
      const key = event.key
      const isMeta = event.metaKey || event.ctrlKey
      console.log('🌹', key, event.target.tagName, event)
      if (event.target.tagName !== 'BODY') { return }
      if (event.shiftKey && key === 'Enter') {
        console.log('add child card')
      } else if (key === 'Enter') {
        console.log('add parent or sibling card')
      } else if (key === 'Escape') {
        // console.log('close dialogs, reset parent card')
        this.$store.commit('closeAllDialogs')
      } else if (key === '?') {
        this.$store.commit('triggerKeyboardShortcutsIsVisible')
      } else if (key === 'Backspace') {
        console.log('remove selected , or currentcard/connection w details open')
        this.$store.commit('closeAllDialogs')
      } else if (isMeta && key === 'c') {
        console.log('copy selected cards')
      }
    },

    addCard () {
      console.log('🏡 add card')
    }

  }
}
</script>
