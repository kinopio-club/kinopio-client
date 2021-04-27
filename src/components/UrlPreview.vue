<template lang="pug">
.row.url-preview(v-if="visible")
  Loader(:visible="loading")
  .button-wrap.hide-preview-wrap(v-if="parentIsCardDetails" :class="{'has-padding': card.urlPreviewImage}")
    button(@click="hidePreview")
      img.icon.cancel(src="@/assets/add.svg")

  template(v-if="!loading")
    .preview-content
      img.url-image(v-if="card.urlPreviewImage" :src="card.urlPreviewImage")
      div
        img.icon.url-type(v-if="urlType === 'arena'" src="@/assets/arena.svg" :class="urlType")
        //- TODO video icon
        //- TODO audio icon , spotify, soundcloud, bandcamp
        img.icon.url-type(v-else src="@/assets/open.svg")
        .title {{card.urlPreviewTitle}}
        .description(v-if="card.urlPreviewDescription && !shouldHideDescription") {{card.urlPreviewDescription}}
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
    shouldHideDescription () {
      const url = this.card.urlPreviewUrl
      const isYoutube = url.includes('youtube.com')
      const isArena = url.includes('are.na')
      return isYoutube || isArena
    },
    urlType () {
      const url = this.card.urlPreviewUrl
      // video
      const isYoutube = url.includes('youtube.com')
      const isVimeo = url.includes('vimeo.com')
      // arena
      const isArena = url.includes('are.na')
      if (isYoutube || isVimeo) {
        return 'video'
      } else if (isArena) {
        return 'arena'
      } else {
        return ''
      }
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
    display flex
    align-items start !important
    color var(--primary)
    text-decoration none
    word-break break-word
    background var(--secondary-hover-background)
    border-radius 3px
    padding 4px

  .url-image
    max-width 30%
    max-height 60px
    border-radius 3px
    margin-right 6px

  .url-type
    width 12px
    max-height 14px
    display inline
    margin-right 5px
    vertical-align -2px
    &.arena
      width 14px
      vertical-align 0
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
