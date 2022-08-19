<template lang="pug">
.row.url-preview(v-if="visible && (previewHasInfo || previewHasImage)")
  Loader(:visible="loading")
  template(v-if="loading")
    .card-details-buttons(v-if="parentIsCardDetails")
      .button-wrap
        button(@click="hidePreview")
          img.icon(src="@/assets/remove.svg")

  template(v-if="!loading")
    .preview-content(:style="{background: selectedColor}" :class="{'image-card': isImageCard, 'is-card-details': parentIsCardDetails, 'no-padding': card.shouldHideUrlPreviewInfo && !card.shouldHideUrlPreviewImage}")
      //- buttons
      .card-details-buttons(v-if="parentIsCardDetails")
        .row.reverse-row
          // remove
          .button-wrap
            button(@click="hidePreview" :disabled="!canEditCard")
              img.icon(src="@/assets/remove.svg")
          // link
          .button-wrap
            a(:href="card.urlPreviewUrl")
              button.visit-button
                img.icon.visit(src="@/assets/visit.svg")
        //- hide url
        .row.reverse-row
          button(@click="toggleUrlsIsVisible" :class="{active: urlsIsVisibleInName}" :disabled="!canEditCard")
            img.icon(v-if="urlsIsVisibleInName" src="@/assets/view-hidden.svg")
            img.icon(v-else src="@/assets/view.svg")
            span URL
        //- hide image or image
        .row.reverse-row
          .segmented-buttons
            button(v-if="previewHasImage" @click="toggleHideUrlPreviewImage" :class="{active : card.shouldHideUrlPreviewImage}" :disabled="!canEditCard")
              img.icon(v-if="!card.shouldHideUrlPreviewImage" src="@/assets/view.svg")
              img.icon(v-if="card.shouldHideUrlPreviewImage" src="@/assets/view-hidden.svg")
              span Image
            button(v-if="previewHasInfo" @click="toggleHideUrlPreviewInfo" :class="{active : card.shouldHideUrlPreviewInfo}" :disabled="!canEditCard")
              img.icon(v-if="!card.shouldHideUrlPreviewInfo" src="@/assets/view.svg")
              img.icon(v-if="card.shouldHideUrlPreviewInfo" src="@/assets/view-hidden.svg")
              span Info

      //- url preview image
      img.hidden(v-if="card.urlPreviewImage" :src="card.urlPreviewImage" @load="updateImageCanLoad")
      template(v-if="shouldLoadUrlPreviewImage")
      //- on card
      img.preview-image(v-if="!parentIsCardDetails" :src="card.urlPreviewImage" :class="{selected: isSelected, hidden: card.shouldHideUrlPreviewImage, 'side-image': isImageCard}" @load="updateDimensionsAndMap")
      //- in carddetails
      a.preview-image-wrap(v-if="parentIsCardDetails && !card.shouldHideUrlPreviewImage" :href="card.urlPreviewUrl" :class="{'side-image': isImageCard || (parentIsCardDetails && !card.shouldHideUrlPreviewInfo)}")
        img.preview-image( :src="card.urlPreviewImage" @load="updateDimensionsAndMap")

      //- info
      .text.badge(:class="{'side-text': parentIsCardDetails && shouldLoadUrlPreviewImage, hidden: card.shouldHideUrlPreviewInfo}" :style="{background: selectedColor}")
        img.favicon(v-if="card.urlPreviewFavicon" :src="card.urlPreviewFavicon")
        img.icon.favicon.open(v-else src="@/assets/open.svg")
        .title {{filteredTitle}}
        .description(v-if="description") {{description}}
</template>

<script>
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

export default {
  name: 'UrlPreview',
  components: {
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
      return this.card.urlPreviewUrl.includes('https://twitter.com')
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
      const image = this.card.urlPreviewImage
      const cardIsShort = this.card.height < 200
      const isCardView = !this.parentIsCardDetails
      if (this.twitterDescription) { return this.twitterDescription }
      if (isCardView) {
        description = utils.truncated(description)
      }
      if (isCardView && image && cardIsShort) {
        description = ''
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
    }
  },
  methods: {
    toggleUrlsIsVisible () {
      this.$emit('toggleUrlsIsVisible')
    },
    updateImageCanLoad () {
      this.imageCanLoad = true
    },
    hidePreview () {
      const update = {
        id: this.card.id,
        urlPreviewIsVisible: false
      }
      this.$store.dispatch('currentCards/update', update)
      this.$store.commit('removeUrlPreviewLoadingForCardIds', this.card.id)
      this.$nextTick(() => {
        this.$store.dispatch('currentConnections/updatePaths', { cardId: this.card.id, shouldUpdateApi: true })
      })
    },
    updateDimensionsAndMap () {
      this.$store.dispatch('currentCards/updateDimensionsAndMap', this.card.id)
    },
    toggleHideUrlPreviewInfo () {
      const value = !this.card.shouldHideUrlPreviewInfo
      const card = {
        id: this.card.id,
        shouldHideUrlPreviewInfo: value
      }
      this.$store.dispatch('currentCards/update', card)
    },
    toggleHideUrlPreviewImage () {
      const value = !this.card.shouldHideUrlPreviewImage
      const card = {
        id: this.card.id,
        shouldHideUrlPreviewImage: value
      }
      this.$store.dispatch('currentCards/update', card)
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
      min-height 100px
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

  .card-details-buttons
    z-index 1
    position absolute
    right 0
    top 0
    padding 4px
    pointer-events none
    .button-wrap,
    button
      pointer-events all
    .reverse-row
      flex-direction row-reverse
    .visit-button
      margin-right 6px
  button
    &:disabled
      opacity 1
      background-color var(--secondary-background)
      border-color var(--primary-transparent)
      img,
      span
        opacity 0.5
</style>
