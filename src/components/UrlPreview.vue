<template lang="pug">
.row.url-preview(v-if="visible")
  Loader(:visible="loading")

  template(v-if="!loading")
    .preview-content
      .button-wrap.hide-preview-wrap(v-if="parentIsCardDetails" :class="{'has-padding': card.urlPreviewImage}")
        button(@click="hidePreview")
          img.icon.cancel(src="@/assets/add.svg")

      //- Preview with Image
      template(v-if="card.urlPreviewImage")
        img.url-image(:src="card.urlPreviewImage" :class="{selected: isSelected}")
        a.badge.button-badge.url-text(:href="card.urlPreviewUrl")
          img.favicon(v-if="card.urlPreviewFavicon" :src="card.urlPreviewFavicon")
          img.icon.favicon.open(v-else src="@/assets/open.svg")
          .title {{card.urlPreviewTitle}}
          .description(v-if="shouldShowDescription") {{card.urlPreviewDescription}}

      //- Preview without Image
      template(v-if="!card.urlPreviewImage")
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
    isSelected: Boolean
  },
  computed: {
    shouldShowDescription () {
      if (!this.card.urlPreviewDescription) { return }
      const noPreviewImage = !this.card.urlPreviewImage
      const url = this.card.urlPreviewUrl
      const isSpotify = url.includes('spotify.com')
      return noPreviewImage || isSpotify
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
    position relative
    display flex
    align-items start !important
    color var(--primary)
    text-decoration none
    word-break break-word

  .url-image
    border-radius 3px
    background var(--primary-background)
    &.selected
      mix-blend-mode color-burn

  .url-text
    position absolute
    margin 8px
    max-width calc(100% - 16px)
    // color var(--text-link)
    color var(--primary)
    text-decoration none
    background var(--secondary-background)
    border-radius 3px
    &:hover
      background var(--secondary-hover-background)
    &:active
      background var(--secondary-active-background)

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

  .hide-preview-wrap
    z-index 1
    position absolute
    right 0
    top 0
    &.has-padding
      padding 4px
</style>
