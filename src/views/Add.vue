<template lang="pug">
main.add-page
  //- sign in
  section(v-if="!currentUserIsSignedIn")
    .info
      .badge.info Sign in to use
      .badge.danger(v-if="error.unknownServerError") (シ_ _)シ Server error
      .badge.danger(v-if="error.signInCredentials") Incorrect email or password
      .badge.danger(v-if="error.tooManyAttempts") Too many attempts, try again in 10 minutes
    form(@submit.prevent="signIn")
      input(type="email" placeholder="Email" required v-model="email" @input="clearErrorsAndSuccess")
      input(type="password" placeholder="Password" required v-model="password" @input="clearErrorsAndSuccess")
      .row
        button(type="submit" :class="{active : loading.signIn}")
          span Sign In
          Loader(:visible="loading.signIn")

  //- add
  section(v-if="currentUserIsSignedIn" data-name="add-card")
    .info
      .badge.info
        img.icon.inbox-icon(src="@/assets/inbox.svg")
        span Add to Inbox
      //- error: card limit
      a(:href="kinopioDomain" v-if="cardsCreatedIsOverLimit")
        .badge.danger.button-badge
          span Upgrade for more →
      //- error: connection
      .badge.danger(v-if="error.unknownServerError || error.maxLength") (シ_ _)シ Server error
    //- textarea
    .row
      User(:user="currentUser" :isClickable="false" :hideYouLabel="true")
      .textarea-wrap
        textarea.name(
          ref="name"
          rows="1"
          placeholder="Type text here, or paste a URL"
          v-model="name"
          :maxlength="maxCardLength"
          @keydown.enter.exact.prevent="createCard"
          @focusin="updateKeyboardShortcutTipIsVisible(true)"
          @focusout="updateKeyboardShortcutTipIsVisible(false)"

          @keyup.alt.enter.exact.stop
          @keyup.ctrl.enter.exact.stop
          @keydown.alt.enter.exact.stop="insertLineBreak"
          @keydown.ctrl.enter.exact.stop="insertLineBreak"
        )
    //- button
    .row
      .button-wrap
        a(:href="spaceUrlPath")
          button
            img.icon.inbox-icon(src="@/assets/inbox.svg")
            span Inbox
      .button-wrap
        button(@click.stop="createCard" :class="{active: loading.createCard, disabled: error.maxLength}")
          img.icon.add-icon(src="@/assets/add.svg")
          span Add
          Loader(:visible="loading.createCard")
        .badge.label-badge.info-badge(v-if="keyboardShortcutTipIsVisible")
          span Enter
    .row(v-if="success")
      .badge.success
        span Success, add another one?

</template>

<script>
import inboxSpace from '@/data/inbox.json'

import Loader from '@/components/Loader.vue'
import User from '@/components/User.vue'
import utils from '@/utils.js'

import { nanoid } from 'nanoid'

let processQueueIntervalTimer

export default {
  name: 'AddPage',
  components: {
    Loader,
    User
  },
  created () {
    window.document.title = 'Add Card'
  },
  mounted () {
    window.addEventListener('message', this.insertUrl)
    // retry failed sync operations every 5 seconds
    processQueueIntervalTimer = setInterval(() => {
      this.$store.dispatch('api/processQueueOperations')
    }, 5000)
    this.focusAndSelectName()
    this.init()
  },
  beforeUnmount () {
    window.removeEventListener('message', this.insertUrl)
    clearInterval(processQueueIntervalTimer)
  },
  data () {
    return {
      email: '',
      password: '',
      loading: {
        createCard: false,
        signIn: false
      },
      error: {
        maxLength: false,
        unknownServerError: false,
        // sign in
        tooManyAttempts: false,
        signInCredentials: false
      },
      success: false,
      newName: '',
      keyboardShortcutTipIsVisible: false,
      spaceUrlPath: 'inbox'
    }
  },
  computed: {
    kinopioDomain () { return utils.kinopioDomain() },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    cardsCreatedIsOverLimit () { return this.$store.getters['currentUser/cardsCreatedIsOverLimit'] },
    maxCardLength () { return utils.maxCardLength() },
    currentUser () { return this.$store.state.currentUser },
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
    async init () {
      this.$store.dispatch('currentUser/init')
      this.$nextTick(() => {
        this.focusName()
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

    // sign in

    isSuccess (response) {
      const success = [200, 201, 202, 204]
      return Boolean(success.includes(response.status))
    },
    handleErrors (response) {
      this.loading.signIn = false
      this.error.signInCredentials = false
      this.error.tooManyAttempts = false
      this.error.unknownServerError = false
      if (!response) {
        this.error.unknownServerError = true
        return
      }
      if (response.status === 401) {
        this.error.signInCredentials = true
      } else if (response.status === 429) {
        this.error.tooManyAttempts = true
      } else {
        this.error.unknownServerError = true
      }
    },
    async signIn (event) {
      if (this.loading.signIn) { return }
      const email = event.target[0].value.toLowerCase()
      const password = event.target[1].value
      this.loading.signIn = true
      const response = await this.$store.dispatch('api/signIn', { email, password })
      const result = await response.json()
      this.loading.signIn = false
      if (this.isSuccess(response)) {
        this.$store.commit('currentUser/updateUser', result)
        this.init()
      } else {
        this.handleErrors(result)
      }
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
    async createCard () {
      this.clearErrorsAndSuccess()
      if (this.cardsCreatedIsOverLimit) { return }
      if (this.error.maxLength) { return }
      if (this.loading.createCard) { return }
      if (!this.newName) { return }
      this.loading.createCard = true
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
        this.spaceUrlPath = space.id
        console.log('🛫 create card', card)
        this.$store.dispatch('api/addToQueue', { name: 'createCard', body: card, spaceId: space.id })
        this.success = true
        this.newName = ''
      } catch (error) {
        console.error('🚑 createCard', error)
        this.error.unknownServerError = true
      }
      this.loading.createCard = false
      this.focusAndSelectName()
    },
    clearErrorsAndSuccess () {
      this.error.unknownServerError = false
      this.error.signInCredentials = false
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

    // handlers

    updateKeyboardShortcutTipIsVisible (value) {
      this.keyboardShortcutTipIsVisible = value
    }
  }
}
</script>

<style lang="stylus">
main.add-page
  padding 8px
  margin-top 2px
  section
    position relative
    display block
    width 250px
  .info-badge
    position static
    display inline-block
    min-height 16px
    padding 0px 3px
    vertical-align 0
    margin-left 4px
  .loader
    margin-left 5px
  .badge
    z-index 1
    .loader
      margin-right 0
  .disabled
    opacity 0.5
    pointer-events none
  .success
    .row
      margin-bottom 4px
      &:last-child
        margin-bottom 0

  .info
    margin 0
    margin-bottom 10px
    .badge
      display inline-block
      margin 0
    > .badge
      margin-right 6px

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
    textarea
      margin 0
  .row
    margin-bottom 10px
    display flex
    position relative
    > input
      margin-bottom 0
    &:last-child
      margin-bottom 0

  .button-wrap + .button-wrap
    margin-left 6px

</style>
