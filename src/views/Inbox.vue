<template lang="pug">
main.inbox
  p yoloy
</template>

<script>
let processQueueIntervalTimer

export default {
  name: 'Inbox',
  components: {
    // BoxSelecting
  },
  beforeCreate () {
    this.$store.dispatch('currentUser/init')
    // this.$store.dispatch('currentSpace/init')
    // const currentUserIsSignedIn = this.$store.getters['currentUser/isSignedIn']
    // console.log('currentUserIsSignedIn', currentUserIsSignedIn)
  },
  created () {
    console.log('currentUserIsSignedIn', this.currentUserIsSignedIn)
    // to initSpaces method =>
    // loading.spaces = true
    // get user spaces?
    // figure out current space
    // loading.spaces false
    // handles anon and remote (w currentUserIsSignedIn)
  },
  mounted () {
    window.addEventListener('mouseup', this.stopInteractions)
    window.addEventListener('touchend', this.stopInteractions)
    // retry failed sync operations every 5 seconds
    processQueueIntervalTimer = setInterval(() => {
      this.$store.dispatch('api/processQueueOperations')
    }, 5000)
  },
  beforeUnmount () {
    window.removeEventListener('mouseup', this.stopInteractions)
    window.removeEventListener('touchend', this.stopInteractions)
    clearInterval(processQueueIntervalTimer)
  },
  data () {
    return {
      loading: {
        spaces: false,
        addingCard: false
      },
      spaces: []
    }
  },
  computed: {
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
  },
  methods: {
    stopInteractions (event) {
      if (event.target.closest('dialog')) { return }
      console.log('💣 stopInteractions')
      this.$store.dispatch('closeAllDialogs', 'Space.stopInteractions')
    }
  }
}
</script>

<style lang="stylus">
// .inbox
//   width 100%
//   height 100vh
//   pointer-events none // so that painting can receive events
//   position relative // used by svg connections
//   transform-origin top left
//   .card-overlap-indicator
//     position absolute
//     z-index calc(var(--max-z) - 70)
//     pointer-events all
//     cursor pointer
//     span
//       line-height 1.5

// .is-interacting
//   pointer-events all
// .is-not-interacting
//   *
//     pointer-events none !important
//     cursor default

</style>
