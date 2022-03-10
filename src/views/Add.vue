<template lang="pug">
main
  aside.notifications(v-if="cardsCreatedIsOverLimit")
    .persistent-item.danger
      p To add more cards, you'll need to upgrade for $5/month
      .row
        a(href="https://kinopio.club")
          button Upgrade →

  dialog.card-details(data-name="add-card")
    section
      .textarea-wrap
        textarea.name(
          ref="name"
          rows="1"
          placeholder="Type text here, or paste a URL"
        )
      .row
        .button-wrap
          button(@click.stop="toggleSpacePickerIsVisible")
            span last space
            img.down-arrow(src="@/assets/down-arrow.svg")
            //- Loader(:visible=loading.spaces), disable
          SpacePicker(
            :visible="spacePickerIsVisible"
            :shouldShowNewSpace="true"
            @closeDialog=""
            @selectSpace=""
          )
      .row
        button
          img.icon(src="@/assets/add.svg")
          span Add Card
          //- Loader(:visible=loading.addingCard), , disable
      .row
        .badge.success Card Added
        //- .badge.danger Something Went Wrong (use generic, connection error)

</template>

<script>
import SpacePicker from '@/components/dialogs/SpacePicker.vue'
import Loader from '@/components/Loader.vue'

let processQueueIntervalTimer

export default {
  name: 'Inbox',
  components: {
    SpacePicker,
    Loader
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
    // max characters
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
      selectedSpace: {},
      spacePickerIsVisible: false
    }
  },
  computed: {
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    cardsCreatedIsOverLimit () { return this.$store.getters['currentUser/cardsCreatedIsOverLimit'] }
  },
  methods: {
    toggleSpacePickerIsVisible () {
      const value = !this.spacePickerIsVisible
      this.closeAllDialogs()
      this.spacePickerIsVisible = value
    },
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
    closeAllDialogs () {
      this.$store.dispatch('closeAllDialogs', 'Space.stopInteractions')
      this.spacePickerIsVisible = false
    },
    stopInteractions (event) {
      console.log('💣 stopInteractions')
      let shouldIgnore
      const dialog = event.target.closest('dialog')
      if (!dialog) {
        shouldIgnore = false
      } else if (dialog && dialog.dataset.name === 'add-card') {
        shouldIgnore = false
      } else {
        shouldIgnore = true
      }
      if (shouldIgnore) { return }
      this.closeAllDialogs()
    }
  }
}
</script>

<style lang="stylus">
main
  position absolute
  top 50px
  padding 8px
  .card-details
    display block
    position static
</style>
