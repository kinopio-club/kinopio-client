<template lang='pug'>
</template>

<script>
// import utils from '@/utils.js'

export default {
  name: 'TouchScrollHandler',
  // created () {
  //   this.$store.subscribe((mutation, state) => {
  // if (mutation.type === 'triggerAddCard') {
  //   this.addCard()
  // }
  //   })
  // },
  mounted () {
    // window.addEventListener('scroll', this.handleShortcuts)
  },
  beforeUnmount () {
    // window.removeEventListener('scroll', this.handleShortcuts)
  },
  methods: {
    // on key up
    handleShortcuts (event) {
      // const key = event.key
      // console.warn('🎹', key)
      // ?
      // if (key === '?' && isSpaceScope) {
      //   this.$store.commit('triggerKeyboardShortcutsIsVisible')
      // }
    }
  }
}
</script>
