<template lang="pug">
main.add-page
  .add-form(v-if="currentUserIsSignedIn")
    section
      .row.title-row-flex
        span.title Add Card
        //- inbox
        .button-wrap
          a(:href="inboxUrl")
            button.small-button
              img.icon.inbox-icon(src="@/assets/inbox.svg")
              span Inbox
    section
      .row(v-if="cardsCreatedIsOverLimit || error.unknownServerError || error.maxLength")
        //- error: card limit
        template(v-if="cardsCreatedIsOverLimit")
          a(:href="kinopioDomain" v-if="isAddPage")
            .badge.danger.button-badge
              span Upgrade for more{{' '}}
              img.icon.visit(src="@/assets/visit.svg")
          .badge.danger(v-else)
            span Upgrade for more cards
        //- error: connection
        .badge.danger(v-if="error.unknownServerError || error.maxLength") (シ_ _)シ Server error
      //- textarea
      .row
        User(:user="currentUser" :isClickable="false" :hideYouLabel="true")
        .textarea-wrap
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
      //- space picker
      .row
        select(name="spaces" v-model="selectedSpaceId")
          option(value="inbox" default) Inbox
          template(v-for="space in spaces")
            option(:value="space.id") {{space.name}}
        Loader(:visible="loading.updateSpaces")
      //- submit
      .row
        //- Add
        .button-wrap
          button.success(@pointerup="addCard" :class="{active: loading.addCard, disabled: error.maxLength}")
            img.icon.add-icon(src="@/assets/add.svg")
            span Add
            Loader(:visible="loading.addCard")
          .badge.label-badge.info-badge(v-if="keyboardShortcutTipIsVisible")
            span Enter
      .row(v-if="success")
        a(:href="selectedSpaceUrl")
          .badge.success.button-badge
            span Added to space

  //- sign in
  section(v-if="!currentUserIsSignedIn")
    .row
      p Sign In to Use Kinopio
    //- sign in form
    form(@submit.prevent="signIn")
      input(type="email" placeholder="Email" required v-model="email" @input="clearErrors")
      input(type="password" placeholder="Password" required v-model="password" @input="clearErrors")
      .row
        button(type="submit" :class="{active : loading.signIn}")
          span Sign In
          Loader(:visible="loading.signIn")
      .row
        .badge.danger(v-if="error.unknownServerError") (シ_ _)シ Server error
        .badge.danger(v-if="error.signInCredentials") Incorrect email or password
        .badge.danger(v-if="error.tooManyAttempts") Too many attempts, try again in 10 minutes

</template>

<script>
import inboxSpace from '@/data/inbox.json'
import Loader from '@/components/Loader.vue'
import User from '@/components/User.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'
import postMessage from '@/postMessage.js'

import { nanoid } from 'nanoid'

export default {
  name: 'AddPage',
  components: {
    Loader,
    User
  },
  created () {
    window.document.title = 'Add to Inbox'
  },
  mounted () {
    this.initUser()
    window.addEventListener('message', this.insertUrl)
    utils.disablePinchZoom()
    this.$nextTick(() => {
      this.focusAndSelectName()
      this.updateSpaces()
    })
  },
  beforeUnmount () {
    window.removeEventListener('message', this.insertUrl)
    utils.enablePinchZoom()
  },
  data () {
    return {
      email: '',
      password: '',
      loading: {
        signIn: false,
        addCard: false,
        updateSpaces: false
      },
      error: {
        unknownServerError: false,
        // sign in
        tooManyAttempts: false,
        signInCredentials: false,
        maxLength: false
      },
      success: false,
      newName: '',
      keyboardShortcutTipIsVisible: false,
      selectedSpaceId: 'inbox',
      spaces: []
    }
  },
  computed: {
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    kinopioDomain () { return consts.kinopioDomain() },
    cardsCreatedIsOverLimit () { return this.$store.getters['currentUser/cardsCreatedIsOverLimit'] },
    maxCardLength () { return consts.maxCardLength },
    currentUser () { return this.$store.state.currentUser },
    isAddPage () { return this.$store.state.isAddPage },
    // successSpaceIsCurrentSpace () {
    //   const currentSpace = this.$store.state.currentSpace
    //   return this.successSpaceId === currentSpace.id
    // },
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
    inboxUrl () {
      let url = `${consts.kinopioDomain()}/inbox`
      return url
    },
    selectedSpaceUrl () {
      let url = `${consts.kinopioDomain()}/${this.selectedSpaceId}`
      return url
    },
    textareaPlaceholder () {
      return 'Type text here, or paste a URL'
    }

  },
  methods: {
    async initUser () {
      this.$store.dispatch('currentUser/init')
    },
    clearErrors () {
      this.error.unknownServerError = false
      this.error.signInCredentials = false
      this.tooManyAttempts = false
    },

    // sign in

    isSuccess (response) {
      const success = [200, 201, 202, 204]
      return Boolean(success.includes(response.status))
    },
    handleSignInErrors (response) {
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
        this.initUser()
      } else {
        this.handleSignInErrors(result)
      }
    },

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

    // spaces

    async updateSpaces () {
      try {
        this.loading.updateSpaces = true
        let spaces = await this.$store.dispatch('api/getUserSpaces')
        spaces = spaces.filter(space => space.name !== 'Inbox')
        this.spaces = spaces
      } catch (error) {
        console.error('🚒', error)
      }
      this.loading.updateSpaces = false
    },

    // card

    focusName () {
      const element = this.$refs.name
      if (!element) { return }
      element.focus()
    },
    focusAndSelectName () {
      if (utils.isMobile()) { return }
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
      // save card to inbox
      try {
        const user = this.$store.state.currentUser
        card.userId = user.id
        console.log('🛫 create card in space', card, this.selectedSpaceId)
        if (this.selectedSpaceId === 'inbox') {
          card = await this.$store.dispatch('api/createCardInInbox', card)
        } else {
          card.spaceId = this.selectedSpaceId
          card = await this.$store.dispatch('api/createCard', card)
        }
        // this.successSpaceId = card.spaceId
        this.updateCurrentSpace(card)
        this.success = true
        this.newName = ''
        postMessage.send({ name: 'addCardFromAddPage', value: card })
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
      // if (!this.successSpaceIsCurrentSpace) { return }
      this.$store.commit('currentCards/create', card)
      this.$store.dispatch('currentCards/updateDimensions', { cards: [card] })
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
  min-height 100vh
  height 100%
  margin-bottom 2rem
  section
    position relative
    display block
  .loader
    margin-left 5px
  a
    color var(--primary)
    text-decoration none

  // sign in

  .sign-in
    background var(--secondary-background)
    form
      margin-top 10px
    input
      margin-bottom 10px
    button
      margin 0

  .row
    margin-bottom 10px
    display flex
    > input
      margin-bottom 0

  .button-wrap + .button-wrap
    margin-left 6px

  // add card

  .add-form
    position relative
    display block
    section
      &.row
        justify-content space-between
    .title-row-flex
      .title
        color var(--primary)

    .info-badge
      position static
      display inline-block
      padding 0px 5px
      vertical-align 0
      margin-left 6px

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

    select
      width 100%

  .inbox-icon,
  .add-icon
    vertical-align 1px
    margin 0

.app
  overflow initial
.title-row-flex
  display flex
  justify-content space-between
  align-items center

</style>
