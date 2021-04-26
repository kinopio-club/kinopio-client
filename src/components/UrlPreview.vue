<template lang="pug">
.row.url-preview(v-if="visible")
  Loader(:visible="loading")
  template(v-if="!loading")
    a(:href="card.urlPreviewUrl")
      img.url-image(v-if="card.urlPreviewImage" :src="card.urlPreviewImage")
      //- if no image, then use generic globe url icon , or
      div
        //- special case favicons: twitter, youtube/video
        //- img.favicon(src="https://are.na/favicon.ico")

        //- img.favicon(v-if="favicon" :src="favicon")
        //- template(v-if="favicon")
        //-   {{favicon}}
        img.icon.favicon(v-if="domainType === 'arena'" src="@/assets/arena.svg" :class="domainType")
        img.icon.favicon(v-else src="@/assets/open.svg")

        //- template(v-if="faviconExists")
        //- p {{domain}}

        .title {{card.urlPreviewTitle}}
        //- template(v-if="showDescription")
        //-   br
        .description(v-if="card.urlPreviewDescription && !hideDescription") {{card.urlPreviewDescription}}
        //- template(v-else)
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
    card: Object
  },
  // data () {
  //   return {
  //     type: ''
  //     // domain: ''
  //     // favicon: ''
  //   }
  // },
  // mounted () {
  //   console.log('🚙')
  //   this.getFavicon()
  // },
  computed: {
    hideDescription () {
      const isYoutube = this.card.urlPreviewUrl.includes('youtube.com')
      const isArena = this.card.urlPreviewUrl.includes('are.na')
      return isYoutube || isArena
    },
    domainType () {
      // video
      const isYoutube = this.card.urlPreviewUrl.includes('youtube.com')
      const isVimeo = this.card.urlPreviewUrl.includes('vimeo.com')
      // arena
      const isArena = this.card.urlPreviewUrl.includes('are.na')
      if (isYoutube || isVimeo) {
        return 'video'
      } else if (isArena) {
        return 'arena'
      } else {
        return ''
      }
    }
    // async isFavicon () {
    //   return this.favicon()
    // }

  },
  methods: {
    // async getFavicon () {
    //   const url = this.card.urlPreviewUrl
    //   if (!url) { return }
    //   console.log(url, typeof url)
    //   let domain = new URL(url)
    //   domain = domain.origin
    //   let image = new Image()
    //   image.src = domain + '/favicon.ico'
    //   console.log('🍅',domain, image)
    //   await image.decode()
    //   console.log('🍅🍅🍅',domain, image)
    //   // return image.src
    //   this.favicon = image.src
    // }

    //   truncated (string) {
    //     return utils.truncated(string, 60)
    //   }

  }
  // watch: {
  //   visible (visible) {
  //       console.log('🚙🚙🚙')

  //     if (visible) {
  //       this.getFavicon()
  //     }
  //   }
  // }

}
</script>

<style lang="stylus">
.url-preview
  border-radius 3px
  padding 4px
  background var(--secondary-hover-background)
  &:hover
    background var(--secondary-active-background)
    box-shadow var(--hover-shadow)
  &:active
    box-shadow var(--active-inset-shadow)

  a
    display flex
    align-items start !important
    color var(--primary)
    text-decoration none
    word-break break-word

  .url-image
    max-width 30%
    max-height 80px
    border-radius 3px
    margin-right 6px

  .favicon
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
</style>
