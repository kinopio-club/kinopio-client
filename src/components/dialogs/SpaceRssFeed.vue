<template lang="pug">
dialog.narrow.space-rss-feed(v-if="visible" :open="visible" @click.left.stop)
  section
    p Space RSS Feed

  section
    p Subscribe to cards recently created or updated
    p(v-if="spaceIsPrivate")
      img.icon(src="@/assets/view.svg")
      span Space RSS Feeds are only available on public spaces

    template(v-if="!spaceIsPrivate")
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
  name: 'RssFeed',
  props: {
    visible: Boolean
  },
  data () {
    return {
      urlIsCopied: false,
      url: ''
    }
  },
  computed: {
    spaceIsPrivate () {
      return this.$store.state.currentSpace.privacy === 'private'
    }
  },
  methods: {
    async copyUrl () {
      await navigator.clipboard.writeText(this.url)
      this.urlIsCopied = true
    },
    updateUrl () {
      const spaceId = this.$store.state.currentSpace.id
      this.urlIsCopied = false
      this.url = `${utils.host(true)}/space/${spaceId}/feed.json`
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

<style lang="stylus">
.space-rss-feed
  left -20px
</style>
