<template lang="pug">
.row.url-preview(v-if="visible")
  Loader(:visible="loading")
  template(v-if="loading")
    .card-details-buttons(v-if="parentIsCardDetails")
      .button-wrap
        button(@click="hidePreview")
          img.icon.cancel(src="@/assets/add.svg")

  template(v-if="!loading")
    .preview-content(:style="{background: selectedColor}" :class="{'image-card': isImageCard}")
      .card-details-buttons(v-if="parentIsCardDetails" :class="{'has-padding': card.urlPreviewImage}")
        .button-wrap
          button(@click="hidePreview")
            img.icon.cancel(src="@/assets/add.svg")
        .button-wrap
          a(:href="card.urlPreviewUrl")
            button.visit-button
              img.icon.visit(src="@/assets/visit.svg")

      img.url-image(v-if="card.urlPreviewImage" :src="card.urlPreviewImage" :class="{selected: isSelected}")
      div
        img.favicon(v-if="card.urlPreviewFavicon" :src="card.urlPreviewFavicon")
        img.icon.favicon.open(v-else src="@/assets/open.svg")
        .title {{card.urlPreviewTitle}}
        .description(v-if="shouldShowDescription") {{card.urlPreviewDescription}}

</template>

<script>
import Loader from '@/components/Loader.vue'

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
    updatedByUser: Object,
    isImageCard: Boolean
  },
  computed: {
    selectedColor () {
      if (!this.isSelected) { return }
      return this.updatedByUser.color
    },
    shouldShowDescription () {
      if (!this.card.urlPreviewDescription) { return }
      const noPreviewImage = !this.card.urlPreviewImage
      const url = this.card.urlPreviewUrl
      const isFutureland = url.includes('futureland.tv')
      const isSpotify = url.includes('spotify.com')
      const isTwitter = url.includes('twitter.com')
      const isWikipedia = url.includes('wikipedia.org')
      const isTumblr = url.includes('tumblr.com')
      return noPreviewImage || isSpotify || isTwitter || isFutureland || isWikipedia || isTumblr
    }
  },
  methods: {
    hidePreview () {
      const update = {
        id: this.card.id,
        urlPreviewIsVisible: false
      }
      this.$store.dispatch('currentSpace/updateCard', update)
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
    align-items start !important
    color var(--primary)
    text-decoration none
    word-break break-word
    background var(--secondary-hover-background)
    border-radius 3px
    padding 4px

  .image-card
    border-top-left-radius 0
    border-top-right-radius 0

  .url-image
    max-width 40%
    max-height 110px
    margin-right 6px
    border-radius 3px
    background var(--primary-background)
    &.selected
      mix-blend-mode color-burn

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
    display flex
    flex-direction row-reverse
    &.has-padding
      padding 4px
    .visit-button
      margin-right 5px
    .visit
      vertical-align middle
</style>
