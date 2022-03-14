<template lang="pug">
main
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
      //- space
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
      //- add card
      .row
        .button-wrap
          button(@click.stop="createCard" :class="{active: loading.createCard, disabled: error.maxLength}")
            img.icon(src="@/assets/add.svg")
            span Add Card
            Loader(:visible="loading.createCard")
          .badge.label-badge.keyboard-shortcut-tip
            span Enter
      .row(v-if="isErrorOrSuccess")
        //- success
        template(v-if="success")
          .badge.success
            span Card Added at Top of Space
            .row
              a(:href="prevSuccessSpace.id")
                button
                  span {{prevSuccessSpace.name}}
        //- error: card limit
        template(v-if="cardsCreatedIsOverLimit")
          .badge.danger
            span To add more cards, you'll need to upgrade for $5/month
            .row
              a(:href="kinopioDomain")
                button Upgrade →
        //- error: connection
        .badge.danger(v-if="error.unknown") (シ_ _)シ Something went wrong, Please try again or contact support
        //- error: max card length
        .badge.danger(v-if="error.maxLength") To fit small screens, cards can't be longer than {{maxCardLength}} characters
        //- error: no spaces
        .badge.danger(v-if="error.noSpaces")
          span You'll need to visit Kinopio once before you can add cards
          .row
            a(:href="kinopioDomain")
              button Kinopio →
        //- error: spaces loading
        .badge.danger(v-if="error.spacesLoading")
          span Spaces loading, try again in a couple seconds

</template>

<script>
import SpacePicker from '@/components/dialogs/SpacePicker.vue'
import Loader from '@/components/Loader.vue'
import cache from '@/cache.js'
import utils from '@/utils.js'

import dayjs from 'dayjs'
import { nanoid } from 'nanoid'

let processQueueIntervalTimer, shouldCancel

export default {
  name: 'Inbox',
  components: {
    SpacePicker,
    Loader
  },
  created () {
    window.document.title = 'Add Card'
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
      error: {
        unknown: false,
        maxLength: false,
        noSpaces: false,
        spacesLoading: false
      },
      success: false,
      newName: ''
    }
  },
  computed: {
    kinopioDomain () { return utils.kinopioDomain() },
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
        this.clearErrorsAndSuccess()
        this.updateMaxLengthError()
      }
    },
    isErrorOrSuccess () {
      return this.error.maxLength || this.error.unknown || this.error.noSpaces || this.error.spacesLoading || this.success
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
    async createCard () {
      this.clearErrorsAndSuccess()
      if (this.cardsCreatedIsOverLimit) { return }
      if (this.error.maxLength) { return }
      if (this.loading.createCard) { return }
      if (this.loading.userSpaces) {
        this.error.spacesLoading = true
        return
      }
      if (!this.currentSpace.id) {
        this.error.noSpaces = true
        return
      }
      if (!this.newName) { return }
      this.loading.createCard = true
      console.log('🛫 create card', this.newName, this.currentSpace.name, this.currentSpace.id)
      const body = [{
        id: nanoid(),
        name: this.newName,
        x: 100,
        y: 100,
        z: 1,
        spaceId: this.currentSpace.id
      }]
      cache.addToSpace({ cards: body, connections: [], connectionTypes: [] }, this.currentSpace.id)
      try {
        await this.$store.dispatch('api/createCards', body)
      } catch (error) {
        console.error('🚑 createCard', error)
        this.error.unknown = true
      }
      this.loading.createCard = false
      this.prevSuccessSpace = utils.clone(this.currentSpace)
      this.success = true
      this.newName = ''
      this.focusName()
    },
    clearErrorsAndSuccess () {
      this.error.unknown = false
      this.success = false
      this.error.noSpaces = false
      this.error.spacesLoading = false
    },
    updateMaxLengthError () {
      if (this.newName.length >= this.maxCardLength - 1) {
        this.error.maxLength = true
      } else {
        this.error.maxLength = false
      }
    },

    // spaces

    async updateUserSpaces () {
      let spaces = cache.getAllSpaces()
      let remoteSpaces
      if (this.currentUserIsSignedIn) {
        try {
          remoteSpaces = await this.$store.dispatch('api/getUserSpaces')
        } catch (error) {
          console.error('🚑 updateUserSpaces', error)
          this.error.unknown = true
        }
      }
      spaces = remoteSpaces || spaces
      spaces = this.sortSpacesByEditedAt(spaces)
      spaces = this.updateFavoriteSpaces(spaces)
      this.spaces = spaces
      this.updateCurrentSpace()
    },
    updateCurrentSpace (space) {
      if (space) {
        this.closeDialogs()
        this.focusName()
      }
      space = space || this.spaces[0]
      console.log('🐙 currentSpace', space)
      if (space) {
        this.currentSpace = space
      } else {
        this.currentSpace = {}
        this.error.noSpaces = true
      }
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
    // based on Space.vue
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
  .keyboard-shortcut-tip
    position static
    display inline-block
    min-height 16px
    padding 0px 3px
    vertical-align 0
    margin-left 4px
  .loader
    margin-left 5px
  .badge
    button
      margin-top 2px
  .disabled
    opacity 0.5
    pointer-events none

</style>
