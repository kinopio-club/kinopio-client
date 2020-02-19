<template lang='pug'>
</template>

<script>
export default {
  mounted () {
    window.addEventListener('keyup', this.handleKeyboardShortcuts)
  },
  methods: {
    handleKeyboardShortcuts (event) {
      const isFromBody = event.target.tagName === 'BODY'
      const key = event.key
      const isShiftKey = event.shiftKey
      if (!isFromBody) { return }
      console.log('🌹', event, event.target.tagName, event.target)
      if (isShiftKey && key === 'Enter') {
        console.log('add child card')
      } else if (key === 'Enter') {
        console.log('add card')
      } else if (key === 'Escape') {
        // console.log('close dialogs, reset parent card')
        this.$store.commit('closeAllDialogs')
      } else if (key === '?') {
        this.$store.commit('triggerKeyboardShortcutsIsVisible')
      } else if (key === 'Backspace') {
        console.log('remove card(s) or connection(s) that mouse is hovered over')
      }
    },

    addCard () {
      console.log('🏡 add card')
    }

  }
}
</script>
