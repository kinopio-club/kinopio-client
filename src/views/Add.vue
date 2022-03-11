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
          v-model="name"
          :maxlength="maxCardLength"
          @keydown.enter.exact.prevent="createCard"
        )
      .row
        .button-wrap
          button(@click.stop="toggleSpacePickerIsVisible")
            span Last Space
            img.down-arrow(src="@/assets/down-arrow.svg")
            //- Loader(:visible=loading.userSpaces), disable
          SpacePicker(
            :visible="spacePickerIsVisible"
            :shouldShowNewSpace="true"
            @closeDialog=""
            @selectSpace=""
          )
      .row
        .button-wrap
          button
            img.icon(src="@/assets/add.svg")
            span Add Card
            //- Loader(:visible=loading.createCard), disable
          .badge.label-badge
            span Enter
      //- .row
        //- .badge.success Card Added
        //- .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support

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
    // to initSpaces method =>
    // loading.userSpaces = true
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
    window.addEventListener('keyup', this.handleShortcuts)
    // retry failed sync operations every 5 seconds
    processQueueIntervalTimer = setInterval(() => {
      this.$store.dispatch('api/processQueueOperations')
    }, 5000)
    this.focusName()
  },
  beforeUnmount () {
    window.removeEventListener('mouseup', this.stopInteractions)
    window.removeEventListener('touchend', this.stopInteractions)
    window.removeEventListener('keyup', this.handleShortcuts)
    clearInterval(processQueueIntervalTimer)
  },
  data () {
    return {
      spaces: [],
      selectedSpace: {},
      spacePickerIsVisible: false,
      loading: {
        createCard: false,
        userSpaces: false
      },
      newName: ''
    }
  },
  computed: {
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    cardsCreatedIsOverLimit () { return this.$store.getters['currentUser/cardsCreatedIsOverLimit'] },
    maxCardLength () { return 300 },
    name: {
      get () {
        return this.newName
      },
      set (newName) {
        this.newName = newName
        this.textareaSizes()
      }
    }

  },
  methods: {
    handleShortcuts (event) {
      if (event.key === 'Escape') { this.closeAllDialogs() }
    },
    textareaSizes () {
      const textarea = this.$refs.name
      let modifier = 0
      if (this.canEditCard) {
        modifier = 1
      }
      textarea.style.height = textarea.scrollHeight + modifier + 'px'
    },

    toggleSpacePickerIsVisible () {
      const value = !this.spacePickerIsVisible
      this.closeAllDialogs()
      this.spacePickerIsVisible = value
    },
    focusName () {
      const element = this.$refs.name
      const length = element.value.length
      if (!element) { return }
      element.focus()
      if (length) {
        element.setSelectionRange(0, length)
      }
    },
    closeAllDialogs () {
      this.$store.dispatch('closeAllDialogs', 'Space.stopInteractions')
      this.spacePickerIsVisible = false
    },
    createCard () {
      console.log('post todo api', this.newName)
      this.clear()
      if (!this.newName) { }
    },
    clear () {
      this.newName = ''
      // clear errors
      // clear loading
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
  .label-badge
    position static
    display inline-block
    min-height 16px
    padding 0px 3px
    vertical-align 0
    margin-left 4px
</style>
