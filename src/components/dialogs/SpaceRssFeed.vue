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
        .url-textarea.single-line
          span {{url}}
        .input-button-wrap(@click.left="copyUrl")
          button.small-button
            img.icon.copy(src="@/assets/copy.svg")
      .row
        button(@click.left="copyUrl")
          img.icon.copy(src="@/assets/copy.svg")
          span Copy Feed URL

</template>

<script>
import utils from '@/utils.js'
import consts from '@/consts.js'

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
      const spaceId = this.$store.state.currentSpace.id
      this.url = `${consts.apiHost()}/space/${spaceId}/feed.json`
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

<style lang="stylus">
dialog.space-rss-feed
  left initial
  right 4px
</style>
