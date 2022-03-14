<template lang="pug">
main
  //- aside.notifications(v-if="cardsCreatedIsOverLimit")
  //-   .persistent-item.danger
  //-     p To add more cards, you'll need to upgrade for $5/month
  //-     .row
  //-       a(href="https://kinopio.club")
  //-         button Upgrade →

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
          button(@click.stop="toggleSpacePickerIsVisible" :class="{active: spacePickerIsVisible}")
            span(v-if="currentSpace.name") {{currentSpace.name}}
            span(v-else) Last Space
            img.down-arrow(src="@/assets/down-arrow.svg")
            Loader(:visible="loading.userSpaces")
          SpacePicker(
            :visible="spacePickerIsVisible"
            :shouldShowNewSpace="true"
            :userSpaces="spaces"
            @selectSpace="updateCurrentSpace"
            :selectedSpace="currentSpace"
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
import cache from '@/cache.js'

import dayjs from 'dayjs'

let processQueueIntervalTimer, shouldCancel

export default {
  name: 'Inbox',
  components: {
    SpacePicker,
    Loader
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
    this.init()
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.closeDialogs()
      }
    })
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
      currentSpace: {},
      prevSuccessSpace: {},
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
    async init () {
      this.loading.userSpaces = true
      this.$store.dispatch('currentUser/init')
      await this.updateUserSpaces()
      this.loading.userSpaces = false
    },
    textareaSizes () {
      const textarea = this.$refs.name
      let modifier = 0
      if (this.canEditCard) {
        modifier = 1
      }
      textarea.style.height = textarea.scrollHeight + modifier + 'px'
    },

    // card

    focusName () {
      const element = this.$refs.name
      const length = element.value.length
      if (!element) { return }
      element.focus()
      if (length) {
        element.setSelectionRange(0, length)
      }
    },
    createCard () {
      this.clear()
      if (this.loading.createCard) { return }
      if (!this.newName) { return }
      console.log('post todo api', this.newName, this.currentSpace)
      // POST card via api
      this.newName = ''
      // this.currentSpace = this.prevSuccessSpace
      // this.clear()
    },
    clear () {
      // clear errors
      // clear loading
    },

    // spaces

    async updateUserSpaces () {
      let spaces = cache.getAllSpaces()
      let remoteSpaces
      if (this.currentUserIsSignedIn) {
        try {
          remoteSpaces = await this.$store.dispatch('api/getUserSpaces')
        } catch (error) {
          console.error('🚑', error)
          this.loading.error = true
        }
      }
      spaces = remoteSpaces || spaces
      spaces = this.sortSpacesByEditedAt(spaces)
      spaces = this.updateFavoriteSpaces(spaces)
      this.spaces = spaces
      this.updateCurrentSpace()
    },
    updateCurrentSpace (space) {
      console.log(space)
      space = space || this.spaces[0]
      console.log('🐙', space)
      this.currentSpace = space
      // set currentSpace , last accessed space (this.spaces[0])
    },
    sortSpacesByEditedAt (spaces) {
      const sortedSpaces = spaces.sort((a, b) => {
        const bEditedAt = dayjs(b.editedAt).unix()
        const aEditedAt = dayjs(a.editedAt).unix()
        return bEditedAt - aEditedAt
      })
      return sortedSpaces
    },
    orderByFavoriteSpaces (spaces) {
      let favoriteSpaces = []
      spaces = spaces.filter(space => {
        if (space.isFavorite) {
          favoriteSpaces.push(space)
        } else {
          return space
        }
      })
      return favoriteSpaces.concat(spaces)
    },
    updateFavoriteSpaces (spaces) {
      const userFavoriteSpaces = this.$store.state.currentUser.favoriteSpaces
      const favoriteSpaceIds = userFavoriteSpaces.map(space => space.id)
      spaces = spaces.map(space => {
        if (favoriteSpaceIds.includes(space.id)) {
          space.isFavorite = true
        }
        return space
      })
      spaces = this.orderByFavoriteSpaces(spaces)
      return spaces
    },

    // handlers

    closeDialogs () {
      this.spacePickerIsVisible = false
    },
    toggleSpacePickerIsVisible () {
      if (this.loading.userSpaces) { return }
      const value = !this.spacePickerIsVisible
      this.closeDialogs()
      this.spacePickerIsVisible = value
    },
    handleShortcuts (event) {
      if (event.key === 'Escape') { this.closeDialogs() }
    },
    shouldCancel (event) {
      if (shouldCancel) {
        shouldCancel = false
        return true
      }
      if (event.target.nodeType === 9) { return true } // type 9 is Document
      let fromDialog = event.target.closest('dialog')
      fromDialog = fromDialog && fromDialog.dataset.name !== 'add-card'
      const fromButton = event.target.closest('button')
      const fromHeader = event.target.closest('header')
      const fromFooter = event.target.closest('footer')
      return Boolean(fromDialog || fromButton || fromHeader || fromFooter)
    },
    stopInteractions (event) {
      console.log('💣 stopInteractions', this.shouldCancel(event))
      if (this.shouldCancel(event)) { return }
      this.$store.dispatch('closeAllDialogs', 'Add')
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
