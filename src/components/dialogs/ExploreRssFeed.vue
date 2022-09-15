<template lang="pug">
dialog.narrow.explore-rss-feed(v-if="visible" :open="visible" @click.left.stop)
  section
    p Explore RSS Feed

  section
    p Subscribe to new spaces added to Explore
    p.row
      .url-textarea {{url}}
      .input-button-wrap
        button(@click.left="copyUrl" :class="{success: urlIsCopied}")
          span(v-if="urlIsCopied") URL Copied
          span(v-else) Copy Feed URL
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'ExploreRssFeed',
  props: {
    visible: Boolean
  },
  data () {
    return {
      urlIsCopied: false,
      url: ''
    }
  },
  methods: {
    async copyUrl () {
      await navigator.clipboard.writeText(this.url)
      this.urlIsCopied = true
    },
    updateUrl () {
      this.urlIsCopied = false
      this.url = `${utils.host(true)}/space/explore-spaces/feed.json`
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateUrl()
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.explore-rss-feed
  top calc(100% - 8px) !important
  bottom initial !important

  @media(max-width 400px)
    left -40px
  @media(max-width 350px)
    left -90px

  .badge
    display inline
</style>
