<template lang="pug">
main
  dialog.card-details(data-name="quick-capture")
    section
      .textarea-wrap
        textarea.name(
          ref="name"
          rows="1"
          placeholder="Type text here, or paste a URL"
        )
      .row
        button
          span last space
          img.down-arrow(src="@/assets/down-arrow.svg")
          //- Loader(:visible=loading.spaces), disable
      .row
        button
          img.icon(src="@/assets/add.svg")
          span Add Card
          //- Loader(:visible=loading.addingCard), , disable
      .row
        .badge.success Card Added
        //- .badge.danger Something Went Wrong (use generic, connection error)

//- TODO use background/tint from current selected space (or blank)

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

    // TODO split out cardDetailsName textarea component
    // handle autofocus on input field

    // to initSpaces method =>
    // loading.spaces = true
    // get user spaces?
    // figure out current space
    // loading.spaces false
    // handles anon and remote (w currentUserIsSignedIn)

    // update this.selectedSpace = last space?
    // update background

    // get/support tags? /
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
      spaces: [],
      selectedSpace: {}
    }
  },
  computed: {
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
  },
  methods: {
    // focusName (position) {
    //   const element = this.$refs.name
    //   const length = this.name.length
    //   if (!element) { return }
    //   element.focus()
    //   if (position) {
    //     element.setSelectionRange(position, position)
    //   }
    //   if (length) {
    //     element.setSelectionRange(length, length)
    //   }
    //   this.triggerUpdatePositionInVisualViewport()
    // },

    stopInteractions (event) {
      let shouldIgnore
      const dialog = event.target.closest('dialog')
      if (!dialog) {
        shouldIgnore = false
      } else if (dialog && dialog.dataset.name === 'quick-capture') {
        shouldIgnore = false
      } else {
        shouldIgnore = true
      }
      if (shouldIgnore) { return }
      console.log('💣 stopInteractions')
      this.$store.dispatch('closeAllDialogs', 'Space.stopInteractions')
    }
  }
}
</script>

<style lang="stylus">
main
  dialog
    top 60px
    left 25px
</style>
