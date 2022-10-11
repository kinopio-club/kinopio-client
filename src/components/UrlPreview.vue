<template lang="pug">
.row.url-preview(v-if="visible && (previewHasInfo || previewHasImage)")
  Loader(:visible="loading")
  template(v-if="!loading")
    .preview-content(:style="{background: selectedColor}" :class="{'image-card': isImageCard, 'is-card-details': parentIsCardDetails, 'no-padding': shouldHideInfo && !shouldHideImage}")
      //- youtube
      .content-buttons.card-inline-buttons(v-if="!parentIsCardDetails && isYoutubeUrl")
        .button-wrap.inline-button-wrap(@mousedown.stop @touchstart.stop @click.stop="toggleShouldDisplayEmbed" @touchend.stop="toggleShouldDisplayEmbed")
          button.inline-button
            img.icon.stop(v-if="shouldDisplayEmbed" src="@/assets/box-filled.svg")
            img.icon.play(v-else src="@/assets/play.svg")
      //- card details buttons
      .content-buttons(v-if="parentIsCardDetails")
        .row
          //- hide url
          .button-wrap
            button(@click="toggleUrlsIsVisible" :class="{active: urlsIsVisibleInName}" :disabled="!canEditCard")
              img.icon(v-if="urlsIsVisibleInName" src="@/assets/view-hidden.svg")
              img.icon(v-else src="@/assets/view.svg")
              span URL
          .button-wrap
            a(:href="card.urlPreviewUrl")
              button
                span →
        //- all, image, text, none
        .row
          .segmented-buttons
            button(v-if="previewHasImage && previewHasInfo" @click="showAll" :class="{active : isShowAll}" :disabled="!canEditCard")
              span All
            button(v-if="previewHasImage" @click="showImage" :class="{active : isShowImage}" :disabled="!canEditCard")
              span Image
            button(v-if="previewHasInfo" @click="showInfo" :class="{active : isShowInfo}" :disabled="!canEditCard")
              span Text
            button(@click="showNone" :class="{active : isShowNone}" :disabled="!canEditCard")
              span None
        // twitter thread
        .row(v-if="tweetIdFromTwitterUrl")
          button(@click="addTwitterThreadCards" :class="{active: isLoadingTwitterThread}")
            img.icon.add-icon(src="@/assets/add.svg")
            img.icon.twitter(src="@/assets/twitter.svg")
            span Thread
            Loader(:visible="isLoadingTwitterThread")

      // preview
      template(v-if="!shouldDisplayEmbed")
        //- url preview image
        img.hidden(v-if="card.urlPreviewImage" :src="card.urlPreviewImage" @load="updateImageCanLoad")
        template(v-if="shouldLoadUrlPreviewImage")
        //- on card
        img.preview-image(v-if="!parentIsCardDetails && card.urlPreviewImage" :src="card.urlPreviewImage" :class="{selected: isSelected, hidden: shouldHideImage, 'side-image': isImageCard}" @load="updateDimensions")
        //- in carddetails
        a.preview-image-wrap(v-if="parentIsCardDetails && !shouldHideImage && card.urlPreviewImage" :href="card.urlPreviewUrl" :class="{'side-image': isImageCard || (parentIsCardDetails && !shouldHideInfo), transparent: isShowNone}")
          img.preview-image(:src="card.urlPreviewImage" @load="updateDimensions")
        //- info
        .text.badge(:class="{'side-text': parentIsCardDetails && shouldLoadUrlPreviewImage, 'text-with-image': card.urlPreviewImage && !shouldHideImage, hidden: shouldHideInfo, transparent: isShowNone, 'text-only': isTextOnly }" :style="{background: selectedColor}")
          img.favicon(v-if="card.urlPreviewFavicon" :src="card.urlPreviewFavicon")
          img.icon.favicon.open(v-else src="@/assets/open.svg")
          .title {{filteredTitle}}
          .description(v-if="description && shouldShowDescription") {{description}}
      //- embed playback
      CardEmbed(:visible="shouldDisplayEmbed" :url="embedUrl")
</template>

<script>
import CardEmbed from '@/components/CardEmbed.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

import { nanoid } from 'nanoid'

let newCards, position

export default {
  name: 'UrlPreview',
  components: {
    CardEmbed,
    Loader
  },
  props: {
    visible: Boolean,
    loading: Boolean,
    card: Object,
    parentIsCardDetails: Boolean,
    isSelected: Boolean,
    user: Object,
    isImageCard: Boolean,
    urlsIsVisibleInName: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerUpdateUrlPreviewComplete') {
        if (!newCards) { return }
        const cards = newCards
        newCards = null
        setTimeout(() => {
          console.log('🕊 addTweetCardsComplete')
          this.addTweetCardsComplete(cards)
        }, 250)
      }
    })
  },
  data () {
    return {
      imageCanLoad: false,
      shouldDisplayEmbed: false,
      embedUrl: '',
      isLoadingTwitterThread: false
    }
  },
  computed: {
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    cardIsCreatedByCurrentUser () { return this.$store.getters['currentUser/cardIsCreatedByCurrentUser'](this.card) },
    canEditCard () {
      if (this.isSpaceMember) { return true }
      if (this.canEditSpace && this.cardIsCreatedByCurrentUser) { return true }
      return false
    },
    shouldHideInfo () {
      return this.card.shouldHideUrlPreviewInfo
    },
    shouldHideImage () {
      return this.card.shouldHideUrlPreviewImage
    },
    isTextOnly () {
      return this.shouldHideImage || !this.card.urlPreviewImage
    },
    shouldShowDescription () {
      if (this.isTextOnly) { return true }
      return this.isTwitterUrl || this.parentIsCardDetails
    },
    selectedColor () {
      if (!this.isSelected) { return }
      return this.user.color
    },
    filteredTitle () {
      let title = this.card.urlPreviewTitle
      title = title.replace('on Twitter', '')
      return title
    },
    isTwitterUrl () {
      const url = this.card.urlPreviewUrl
      return url.includes('https://twitter.com') || url.includes('https://mobile.twitter.com/')
    },
    tweetIdFromTwitterUrl () {
      if (!this.isTwitterUrl) { return }
      const url = this.card.urlPreviewUrl
      return utils.tweetIdFromTwitterUrl(url)
    },
    isYoutubeShortenedUrl () {
      const url = this.card.urlPreviewUrl
      return url.includes('https://youtu.be')
    },
    isYoutubeUrl () {
      const url = this.card.urlPreviewUrl
      if (url.includes('/channel/')) { return }
      const domains = ['https://youtube.com', 'https://www.youtube.com', 'https://m.youtube.com', 'https://youtu.be']
      let isRoot, isVideo
      domains.forEach(domain => {
        if (url === domain) { isRoot = true }
        if (url === domain + '/') { isRoot = true }
      })
      if (isRoot) { return }
      domains.forEach(domain => {
        if (url.includes(domain)) { isVideo = true }
      })
      return isVideo
    },
    youtubeUrlVideoId () {
      if (!this.isYoutubeUrl) { return }
      const url = this.card.urlPreviewUrl
      let id
      if (this.isYoutubeShortenedUrl) {
        const idPattern = new RegExp(/([-a-zA-Z0-9])+$/g)
        // matches end from last '/'
        // https://youtu.be/-abABC123 → -abABC123
        id = url.match(idPattern)[0]
      } else {
        // matches 'v=' until next qs '&'
        // www.youtube.com/watch?v=PYeY8fWUyO8 → "v=PYeY8fWUyO8"
        const idPattern = new RegExp(/v=([^&]+)/g)
        id = url.match(idPattern)[0]
        id = id.slice(2, id.length)
      }
      return id
    },
    youtubeEmbedUrl () {
      if (!this.youtubeUrlVideoId) { return }
      const url = `https://www.youtube-nocookie.com/embed/${this.youtubeUrlVideoId}?autoplay=1`
      return url
    },
    twitterDescription () {
      if (!this.isTwitterUrl) { return }
      const image = this.card.urlPreviewImage
      let description = this.card.urlPreviewDescription
      if (image || this.isImageCard) {
        return utils.truncated(description)
      } else {
        return description
      }
    },
    description () {
      let description = this.card.urlPreviewDescription
      const isCardView = !this.parentIsCardDetails
      if (this.twitterDescription) { return this.twitterDescription }
      if (this.isYoutubeUrl) { return }
      if (isCardView) {
        description = utils.truncated(description, 200)
      }
      return description
    },
    shouldLoadUrlPreviewImage () {
      return this.card.urlPreviewImage && this.imageCanLoad
    },
    previewHasInfo () {
      return Boolean(this.card.urlPreviewTitle || this.card.urlPreviewDescription)
    },
    previewHasImage () {
      return Boolean(this.card.urlPreviewImage)
    },
    isShowAll () {
      if (this.isShowNone) { return }
      return !this.shouldHideImage && !this.shouldHideInfo
    },
    isShowImage () {
      if (this.isShowNone) { return }
      return this.shouldHideInfo && !this.shouldHideImage
    },
    isShowInfo () {
      if (this.isShowNone) { return }
      return this.shouldHideImage && !this.shouldHideInfo
    },
    isShowNone () {
      return !this.card.urlPreviewIsVisible
    }
  },
  methods: {
    async addTwitterThreadCards (event) {
      if (this.isLoadingTwitterThread) { return }
      position = utils.cursorPositionInPage(event)
      const spaceBetweenCards = 12
      const origin = {
        x: this.card.x,
        y: this.card.y + this.card.height + spaceBetweenCards
      }
      this.isLoadingTwitterThread = true
      const tweetId = this.tweetIdFromTwitterUrl

      try {
        const result = await this.$store.dispatch('api/twitterThread', tweetId)
        const tweets = result.data
        console.log('🕊', tweetId, tweets)
        if (tweets.length) {
          this.addTweetCards(tweets, origin)
        } else {
          this.$store.commit('addNotificationWithPosition', { message: 'Tweet Not Found', position, type: 'danger', layer: 'app', icon: 'cancel' })
          this.isLoadingTwitterThread = false
        }
      } catch (error) {
        console.error('🚒 addTwitterThreadCards', error)
        this.$store.commit('addNotificationWithPosition', { message: 'Tweet Not Found', position, type: 'danger', layer: 'app', icon: 'cancel' })
        this.isLoadingTwitterThread = false
      }
    },
    addTweetCards (tweets, origin) {
      this.$store.dispatch('history/pause')
      // add
      let cards = tweets.map(tweet => {
        return {
          id: nanoid(),
          name: tweet.text,
          x: origin.x,
          y: origin.y
        }
      })
      this.$store.dispatch('currentCards/addMultiple', cards)
      // wait for triggerUpdateUrlPreviewComplete to position cards
      newCards = cards
    },
    addTweetCardsComplete (cards) {
      // position
      this.$store.dispatch('currentCards/distributeVertically', cards)
      this.$nextTick(() => {
        // select
        this.$store.dispatch('closeAllDialogs', 'UrlPreview')
        const cardIds = cards.map(card => card.id)
        this.$store.commit('multipleCardsSelectedIds', cardIds)
        // ⏺ history
        cards = cardIds.map(cardId => this.$store.getters['currentCards/byId'](cardId))
        this.$store.dispatch('history/resume')
        this.$store.dispatch('history/add', { cards, useSnapshot: true })
        this.$store.commit('addNotificationWithPosition', { message: 'Thread Created', position, type: 'success', layer: 'app', icon: 'add' })
      })
      this.isLoadingTwitterThread = false
    },
    toggleShouldDisplayEmbed () {
      this.$store.dispatch('closeAllDialogs', 'UrlPreview')
      if (this.shouldDisplayEmbed) {
        this.embedUrl = ''
        this.shouldDisplayEmbed = false
      } else {
        this.embedUrl = this.youtubeEmbedUrl
        if (!this.embedUrl) {
          this.$store.commit('addNotification', { message: 'Could not get embed URL', type: 'danger' })
          return
        }
        this.shouldDisplayEmbed = true
      }
    },
    toggleUrlsIsVisible () {
      this.$emit('toggleUrlsIsVisible')
    },
    updateImageCanLoad () {
      this.imageCanLoad = true
    },
    updateDimensions () {
      this.$store.dispatch('currentCards/updateDimensions', { cards: [this.card] })
    },
    showAll () {
      const card = {
        id: this.card.id,
        urlPreviewIsVisible: true,
        shouldHideUrlPreviewInfo: false,
        shouldHideUrlPreviewImage: false
      }
      this.$store.dispatch('currentCards/update', card)
    },
    showImage () {
      const card = {
        id: this.card.id,
        urlPreviewIsVisible: true,
        shouldHideUrlPreviewInfo: true,
        shouldHideUrlPreviewImage: false
      }
      this.$store.dispatch('currentCards/update', card)
    },
    showInfo () {
      const card = {
        id: this.card.id,
        urlPreviewIsVisible: true,
        shouldHideUrlPreviewInfo: false,
        shouldHideUrlPreviewImage: true
      }
      this.$store.dispatch('currentCards/update', card)
    },
    showNone () {
      const card = {
        id: this.card.id,
        urlPreviewIsVisible: false,
        shouldHideUrlPreviewInfo: false,
        shouldHideUrlPreviewImage: false
      }
      this.$store.dispatch('currentCards/update', card)
      this.$store.commit('removeUrlPreviewLoadingForCardIds', this.card.id)
      this.$nextTick(() => {
        this.$store.dispatch('currentConnections/updatePaths', { cardId: this.card.id, shouldUpdateApi: true })
      })
    }

  }
}
</script>

<style lang="stylus">
.url-preview
  &.row
    display flex
  .preview-content
    width 100%
    position relative
    display flex
    align-items flex-start !important
    color var(--primary)
    text-decoration none
    word-break break-word
    background var(--secondary-hover-background)
    border-radius 3px
    &.image-card
      padding 4px
      border-top-left-radius 0
      border-top-right-radius 0
    &.is-card-details
      padding 4px
      min-height 60px
    &.no-padding
      padding 0
  .preview-image
    width 100%
    border-radius 3px
    background var(--primary-background)
    pointer-events none
    -webkit-touch-callout none // prevents safari mobile press-and-hold from interrupting
    &.selected
      mix-blend-mode color-burn

  a.preview-image-wrap
    &:hover
      .preview-image
        box-shadow var(--button-hover-shadow)
    &:active
      .preview-image
        box-shadow var(--hover-shadow)

  .side-image
    max-width 40%
    margin-right 6px

  .text
    position absolute
    margin 8px
    background var(--secondary-hover-background)
    user-select text
    &.text-with-image
      border-radius 3px
    &.text-only
      position relative
      margin 0
      border-radius 3px

  .side-text
    max-width calc(100% - 24px)
    position static
    margin 0
    padding 4px

  .favicon
    border-radius 3px
    width 14px
    vertical-align -3px
    display inline
    margin-right 5px
    &.open
      width 12px
      vertical-align -2px
  .title
    display inline
  .description
    margin-top 10px

  .content-buttons
    z-index 1
    position absolute
    right 0
    top 0
    padding 4px
    pointer-events none
    .button-wrap,
    button
      pointer-events all
    .row
      justify-content flex-end

  .no-padding
    .card-inline-buttons
      padding 0

  .inline-button-wrap
    cursor pointer
    button
      cursor pointer
    .icon
      &.play,
      &.stop
        position absolute
        left 6px
        top 3px
      &.stop
        left 4px
        top 2px

  button
    &:disabled
      opacity 1
      background-color var(--secondary-background)
      border-color var(--primary-transparent)
      img,
      span
        opacity 0.5

  .transparent
    opacity 0.5

  .add-icon
    margin-right 4px
    vertical-align 0px

</style>
