<template lang="pug">
dialog.narrow.explore-rss-feed(v-if="visible" :open="visible" @click.left.stop)
  section
    p Explore RSS Feed

  section
    p Subscribe to new spaces added to Explore
    p.row
      .url-textarea {{url}}
      .input-button-wrap(@click.left="copyUrl")
        button.small-button
          img.icon.copy(src="@/assets/copy.svg")
          span Feed URL
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
      url: ''
    }
  },
  methods: {
    async copyUrl (event) {
      this.$store.commit('clearNotificationsWithPosition')
      const position = utils.cursorPositionInPage(event)
      try {
        await navigator.clipboard.writeText(this.url)
        this.$store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
      } catch (error) {
        console.warn('🚑 copyText', error)
        this.$store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
      }
    },
    updateUrl () {
      this.url = `${utils.host(true)}/space/explore-spaces/feed.json`
    }
  },
  watch: {
    visible (visible) {
      this.$store.commit('clearNotificationsWithPosition')
      if (visible) {
        this.updateUrl()
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.explore-rss-feed
  top calc(100% - 12px) !important
  bottom initial !important

  @media(max-width 400px)
    left -40px
  @media(max-width 350px)
    left -90px

  .badge
    display inline
</style>
