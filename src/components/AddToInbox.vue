<template lang="pug">
section.add-to-inbox(v-if="visible")
  .row(v-if="isAddPage")
    span Add to Inbox

  .row(v-if="cardsCreatedIsOverLimit || error.unknownServerError || error.maxLength")
    //- error: card limit
    template(v-if="cardsCreatedIsOverLimit")
      a(:href="kinopioDomain" v-if="isAddPage")
        .badge.danger.button-badge
          span Upgrade for more →
      .badge.danger(v-else)
        span Upgrade for more cards

    //- error: connection
    .badge.danger(v-if="error.unknownServerError || error.maxLength") (シ_ _)シ Server error

  //- textarea
  .row
    User(:user="currentUser" :isClickable="false" :hideYouLabel="true")
    .textarea-wrap(@touchend.stop)
      textarea.name(
        ref="name"
        rows="1"
        :placeholder="textareaPlaceholder"
        v-model="name"
        :maxlength="maxCardLength"
        @keydown.enter.exact.prevent="addCard"
        @focusin="updateKeyboardShortcutTipIsVisible(true)"
        @focusout="updateKeyboardShortcutTipIsVisible(false)"

        @keyup.alt.enter.exact.stop
        @keyup.ctrl.enter.exact.stop
        @keydown.alt.enter.exact.stop="insertLineBreak"
        @keydown.ctrl.enter.exact.stop="insertLineBreak"
        @touchend="focusName"
      )
  //- button
  .row
    .button-wrap
      a(:href="inboxUrl")
        button(@pointerup="changeToInboxSpace")
          img.icon.inbox-icon(src="@/assets/inbox.svg")
          span Inbox
    .button-wrap
      button(@pointerup="addCard" :class="{active: loading.addCard, disabled: error.maxLength}")
        img.icon.add-icon(src="@/assets/add.svg")
        span Add
        Loader(:visible="loading.addCard")
      .badge.label-badge.info-badge(v-if="keyboardShortcutTipIsVisible")
        span Enter
  .row(v-if="success")
    .badge.success
      span Added
</template>

<script>
import inboxSpace from '@/data/inbox.json'
import Loader from '@/components/Loader.vue'
import User from '@/components/User.vue'
import utils from '@/utils.js'

import { nanoid } from 'nanoid'

export default {
  name: 'AddToInbox',
  components: {
    Loader,
    User
  },
  props: {
    visible: Boolean
  },
  mounted () {
    window.addEventListener('message', this.insertUrl)
    utils.disablePinchZoom()
    this.$nextTick(() => {
      this.focusAndSelectName()
    })
  },
  beforeUnmount () {
    window.removeEventListener('message', this.insertUrl)
    utils.enablePinchZoom()
  },
  data () {
    return {
      loading: {
        addCard: false
      },
      error: {
        maxLength: false,
        unknownServerError: false
      },
      success: false,
      newName: '',
      keyboardShortcutTipIsVisible: false,
      successSpaceId: ''
    }
  },
  computed: {
    kinopioDomain () { return utils.kinopioDomain() },
    cardsCreatedIsOverLimit () { return this.$store.getters['currentUser/cardsCreatedIsOverLimit'] },
    maxCardLength () { return utils.maxCardLength() },
    currentUser () { return this.$store.state.currentUser },
    isAddPage () { return this.$store.state.isAddPage },
    successSpaceIsCurrentSpace () {
      const currentSpace = this.$store.state.currentSpace
      return this.successSpaceId === currentSpace.id
    },
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
    inboxUrl () { return this.successSpaceId || 'inbox' },
    textareaPlaceholder () {
      if (this.isAddPage) {
        return 'Type text here, or paste a URL'
      } else {
        return 'Type text here'
      }
    }
  },
  methods: {
    insertUrl (event) {
      const url = event.data
      this.newName = url + this.newName
      this.$nextTick(() => {
        this.textareaSizes()
        this.focusAndSelectName()
        this.updateMaxLengthError()
      })
    },
    textareaSizes () {
      const textarea = this.$refs.name
      if (!textarea) { return }
      let modifier = 0
      if (this.canEditCard) {
        modifier = 1
      }
      textarea.style.height = textarea.scrollHeight + modifier + 'px'
    },

    // url preview (from Card.vue)

    async urlPreview (url) {
      try {
        let response = await this.$store.dispatch('api/urlPreview', url)
        if (!response) { return }
        let { data, host } = response
        console.log('🚗 link preview', host, data)
        const { links, meta } = data
        return { links, meta }
      } catch (error) {
        console.warn('🚑 urlPreview', error, url)
      }
    },
    previewImage ({ thumbnail }) {
      const minWidth = 200
      if (!thumbnail) { return '' }
      let image = thumbnail.find(item => {
        let shouldSkipImage = false
        if (item.media) {
          if (item.media.width < minWidth) {
            shouldSkipImage = true
          }
        }
        return item.href && !shouldSkipImage
      })
      if (!image) { return '' }
      return image.href || ''
    },
    previewFavicon ({ icon }) {
      if (!icon) { return '' }
      let image = icon.find(item => item.href)
      return image.href || ''
    },

    // card

    focusName () {
      const element = this.$refs.name
      if (!element) { return }
      element.focus()
    },
    focusAndSelectName () {
      const element = this.$refs.name
      if (!element) { return }
      const length = element.value.length
      this.focusName()
      if (length) {
        element.setSelectionRange(0, length)
      }
    },
    emptyInboxSpace () {
      const user = this.$store.state.currentUser
      let space = utils.clone(inboxSpace)
      space.id = nanoid()
      space.userId = user.id
      space.users = [user]
      space.cards = space.cards.map(card => {
        card.id = nanoid()
        card.spaceId = space.id
        return card
      })
      return space
    },
    async addCard () {
      this.clearErrorsAndSuccess()
      if (this.cardsCreatedIsOverLimit) { return }
      if (this.error.maxLength) { return }
      if (this.loading.addCard) { return }
      if (!this.newName) { return }
      this.loading.addCard = true
      // url preview data
      const url = utils.urlFromString(this.newName)
      let urlPreview = {}
      if (url) {
        let { links, meta } = await this.urlPreview(url)
        urlPreview = {
          title: utils.truncated(meta.title || meta.site),
          description: utils.truncated(meta.description, 280),
          image: this.previewImage(links),
          favicon: this.previewFavicon(links)
        }
      }
      // create card
      let card = {
        id: nanoid(),
        name: this.newName,
        z: 1,
        urlPreviewUrl: url,
        urlPreviewTitle: urlPreview.title,
        urlPreviewDescription: urlPreview.description,
        urlPreviewImage: urlPreview.image,
        urlPreviewFavicon: urlPreview.favicon
      }
      // inbox space
      try {
        let space = await this.$store.dispatch('currentUser/inboxSpace')
        if (!space) {
          space = this.emptyInboxSpace()
          await this.$store.dispatch('api/createSpace', space)
        }
        // save card to inbox
        const user = this.$store.state.currentUser
        card.spaceId = space.id
        card.userId = user.id
        this.successSpaceId = space.id
        console.log('🛫 create card', card)
        card = await this.$store.dispatch('api/createCard', card)
        this.updateCurrentSpace(card)
        this.success = true
        this.newName = ''
      } catch (error) {
        console.error('🚑 addCard', error)
        this.error.unknownServerError = true
      }
      this.loading.addCard = false
      const textarea = this.$refs.name
      textarea.style.height = 'initial'
      this.focusAndSelectName()
    },
    clearErrorsAndSuccess () {
      this.error.unknownServerError = false
      this.success = false
    },
    updateMaxLengthError () {
      if (this.newName.length >= this.maxCardLength - 1) {
        this.error.maxLength = true
      } else {
        this.error.maxLength = false
      }
    },
    insertLineBreak (event) {
      const position = this.$refs.name.selectionEnd
      const name = this.newName
      const newName = name.substring(0, position) + '\n' + name.substring(position)
      setTimeout(() => {
        this.setSelectionRange(position + 1, position + 1)
      })
      this.insertedLineBreak = true
      this.newName = newName
      this.$nextTick(() => {
        this.textareaSizes()
      })
    },
    updateCurrentSpace (card) {
      if (this.isAddPage) { return }
      if (!this.successSpaceIsCurrentSpace) { return }
      this.$store.commit('currentCards/create', card)
      this.$store.dispatch('currentCards/updateDimensionsAndMap', card.id)
    },

    // handlers

    updateKeyboardShortcutTipIsVisible (value) {
      this.keyboardShortcutTipIsVisible = value
    },

    // inbox button

    async changeToInboxSpace (event) {
      if (this.isAddPage) { return }
      this.$store.dispatch('closeAllDialogs', 'AddToInbox')
      event.preventDefault()
      event.stopPropagation()
      let space
      if (this.successSpaceIsCurrentSpace) { return }
      if (this.successSpaceId) {
        space = { id: this.successSpaceId }
      } else {
        space = await this.$store.dispatch('currentUser/inboxSpace')
      }
      this.$store.dispatch('currentSpace/changeSpace', { space })
    }
  }
}
</script>

<style lang="stylus">
section.add-to-inbox
  .info-badge
    position static
    display inline-block
    min-height 16px
    padding 0px 3px
    vertical-align 0
    margin-left 4px
  .success
    .row
      margin-bottom 4px
      &:last-child
        margin-bottom 0

  .sign-in
    background var(--secondary-background)
    form
      margin-top 10px
    input
      margin-bottom 10px
    button
      margin 0

  .inbox-icon,
  .add-icon
    vertical-align 0

  a
    color var(--primary)
    text-decoration none
  .textarea-wrap
    margin-top 3px
    margin-left 6px
    width 100%
    textarea
      margin 0
      min-height 18px

  .button-wrap + .button-wrap
    margin-left 6px

  .badge
    display inline-block

</style>
