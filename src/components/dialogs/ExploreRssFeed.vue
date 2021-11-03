<template lang="pug">
dialog.narrow.explore-rss(v-if="visible" :open="visible" @click.left.stop)
  section
    p Explore RSS Feed

  section
    p Subscribe to new spaces added to Explore
    p
      input.url-textarea(ref="url" v-model="url")
      button(@click.left="copyUrl")
        span Copy RSS Feed Url
    p(v-if="urlIsCopied")
      .badge.success.success-message Url Copied
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
    copyUrl () {
      const element = this.$refs.url
      element.select()
      element.setSelectionRange(0, 99999) // for mobile
      document.execCommand('copy')
      this.urlIsCopied = true
    },
    updateUrl () {
      this.urlIsCopied = false
      this.url = `${utils.host(true)}/space/new-spaces/feed.json`
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
.explore-rss
  bottom initial
  top 8px
  @media(max-width 400px)
    left -40px
  @media(max-width 350px)
    left -90px

  .badge
    display inline
</style>
