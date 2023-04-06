<template lang="pug">
.row.url-preview(v-if="visible")
  Loader(:visible="loading")
  template(v-if="!loading")
    .preview-content(:style="{background: selectedColor}" :class="{'no-padding': shouldHideInfo && !shouldHideImage, 'is-no-info': !previewHasInfo}")
      //- card details buttons
      .content-buttons
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
        .row(v-if="previewHasInfo")
          .segmented-buttons
            button(v-if="previewHasImage && previewHasInfo" @click="showAll" :class="{active : isShowAll}" :disabled="!canEditCard")
              span All
            button(v-if="previewHasImage" @click="showImage" :class="{active : isShowImage}" :disabled="!canEditCard")
              span Image
            button(v-if="previewHasInfo" @click="showInfo" :class="{active : isShowInfo}" :disabled="!canEditCard")
              span Text
            button(@click="showNone" :class="{active : isShowNone}" :disabled="!canEditCard")
              span None

      //- image
      img.hidden(v-if="card.urlPreviewImage" :src="card.urlPreviewImage" @load="updateImageCanLoad")
      a.preview-image-wrap(v-if="!shouldHideImage && card.urlPreviewImage" :href="card.urlPreviewUrl" :class="{'side-image': !shouldHideInfo, transparent: isShowNone}")
        img.preview-image(:src="card.urlPreviewImage" @load="updateDimensions")
      .text.badge(v-if="!shouldHideInfo" :class="{'side-text': shouldLoadUrlPreviewImage, 'text-with-image': card.urlPreviewImage && !shouldHideImage, transparent: isShowNone, 'text-only': isTextOnly }" :style="{background: selectedColor}")
        //- text
        div
          .row.info-row
            img.favicon(v-if="card.urlPreviewFavicon" :src="card.urlPreviewFavicon")
            img.icon.favicon.open(v-else src="@/assets/open.svg")
            .title {{filteredTitle}}
          .description(v-if="description") {{description}}

</template>

<script>
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

import { nanoid } from 'nanoid'

let position

export default {
  name: 'UrlPreview',
  components: {
    Loader
  },
  props: {
    visible: Boolean,
    loading: Boolean,
    card: Object,
    isSelected: Boolean,
    user: Object,
    urlsIsVisibleInName: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerUpdateUrlPreviewComplete') {
        const cards = this.$store.state.prevNewTweetCards
        this.$store.commit('addNotificationWithPosition', { message: `Thread Created (${cards.length})`, position, type: 'success', layer: 'app', icon: 'add' })
      } else if (mutation.type === 'triggerCardIdUpdatePastedName') {
        // handle pasted urls
        const { cardId, name } = mutation.payload
        if (cardId !== this.card.id) { return }
        const urls = utils.urlsFromString(name)
        if (!urls.length) { return }
        if (!this.card.resizeWidth) {
          this.$store.dispatch('currentCards/update', { id: this.card.id, resizeWidth: 190 })
        }
      }
    })
  },
  data () {
    return {
      imageCanLoad: false
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
    selectedColor () {
      if (!this.isSelected) { return }
      return this.user.color
    },
    filteredTitle () {
      let title = this.card.urlPreviewTitle
      if (!title) { return }
      title = title.replace('on Twitter', '')
      return title
    },
    description () {
      let description = this.card.urlPreviewDescription
      return utils.truncated(description, 100)
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
  flex-wrap wrap
  &.row
    display flex
  .info-row
    align-items flex-start
  .preview-content
    width 100%
    position relative
    display flex
    align-items flex-start !important
    color var(--primary)
    text-decoration none
    word-break break-word
    background var(--secondary-hover-background)
    border-radius var(--entity-radius)
    padding var(--subsection-padding)
    min-height 80px
    &.no-padding
      padding 0
    &.is-no-info
      min-height initial !important
  .preview-image
    display block
    width 100%
    border-radius var(--entity-radius)
    background var(--primary-background)
    pointer-events none
    -webkit-touch-callout none // prevents safari mobile press-and-hold from interrupting

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
    display block

  .text
    position absolute
    margin 8px
    background var(--secondary-hover-background)
    user-select text
    display flex
    top 0
    overflow hidden
    &.text-with-image
      border-radius var(--entity-radius)
      bottom 0
    &.text-only
      position relative
      margin 0
      border-radius var(--entity-radius)

  .side-text
    max-width calc(100% - 24px)
    position static
    margin 0
    padding 4px
    display block

  .favicon
    border-radius var(--entity-radius)
    width 14px
    vertical-align -3px
    display inline
    margin-right 5px
    margin-top 3px
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

  .inline-button-wrap
    cursor pointer
    button
      cursor pointer

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

</style>
