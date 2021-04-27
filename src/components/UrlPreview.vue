<template lang="pug">
.row.url-preview(v-if="visible")
  Loader(:visible="loading")

  template(v-if="!loading")
    .preview-content
      .button-wrap.hide-preview-wrap(v-if="parentIsCardDetails" :class="{'has-padding': card.urlPreviewImage}")
        button(@click="hidePreview")
          img.icon.cancel(src="@/assets/add.svg")

      img.url-image(v-if="card.urlPreviewImage" :src="card.urlPreviewImage")
      div
        img.favicon(v-if="card.urlPreviewFavicon" :src="card.urlPreviewFavicon")
        img.icon.favicon.open(v-else src="@/assets/open.svg")

        .title {{card.urlPreviewTitle}}
        .description(v-if="card.urlPreviewDescription && shouldShowDescription") {{card.urlPreviewDescription}}
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
    parentIsCardDetails: Boolean
  },
  computed: {
    shouldShowDescription () {
      const url = this.card.urlPreviewUrl
      const isSpotify = url.includes('spotify.com')
      return isSpotify
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
  .preview-content
    position relative
    display flex
    align-items start !important
    color var(--primary)
    text-decoration none
    word-break break-word
    background var(--secondary-hover-background)
    border-radius 3px
    padding 4px

  .url-image
    max-width 45%
    max-height 70px
    border-radius 3px
    margin-right 6px

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
    position absolute
    right 0
    top 0
    &.has-padding
      padding 4px
</style>
