<template lang="pug">
dialog.narrow.embed(v-if="visible" :open="visible" @click.left.stop)
  section
    p Embed
  section
    .row
      .segmented-buttons
        button(@click="toggleIframeIsVisible" :class="{ active: iframeIsVisible }")
          span iFrame
        button(@click="toggleUrlIsVisible" :class="{ active: !iframeIsVisible }")
          span Url

    template(v-if="iframeIsVisible")
      textarea(ref="iframe") {{iframe}}
      button(@click="copy") Copy Code
      .row(v-if="isCopied")
        .badge.success.success-message Code Copied

    template(v-if="!iframeIsVisible")
      input.url-textarea(ref="url" v-model="url")
      button(@click="copy") Copy Url
      .row(v-if="isCopied")
        .badge.success.success-message Url Copied
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'Embed',
  props: {
    visible: Boolean
  },
  data () {
    return {
      iframeIsVisible: true,
      isCopied: false
    }
  },
  computed: {
    url () {
      const spaceId = this.$store.state.currentSpace.id
      return `${utils.kinopioDomain()}/embed/?spaceId=${spaceId}&zoom=100`
    },
    iframe () {
      return `<div class="kinopio-embed" style="height: 420px; width: 100%;">
  <iframe src="${this.url}" style="height: 100%; width: 100%; border: 0; border-radius: 5px;">
  </iframe>
</div>`
    }
  },
  methods: {
    toggleIframeIsVisible () {
      this.iframeIsVisible = true
      this.isCopied = false
    },
    toggleUrlIsVisible () {
      this.iframeIsVisible = false
      this.isCopied = false
    },
    async copy () {
      let value
      if (this.iframeIsVisible) {
        value = this.iframe
      } else {
        value = this.url
      }
      await navigator.clipboard.writeText(value)
      this.isCopied = true
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.toggleIframeIsVisible()
      }
    }
  }
}
</script>

<style lang="stylus">
.embed
  textarea
    background-color var(--secondary-background)
    border 0
    border-radius 3px
    padding 4px
    margin-bottom 10px
    height 100px
  .success-message
    margin-top 10px
</style>
