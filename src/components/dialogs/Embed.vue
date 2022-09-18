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
          span URL

    //- iFrame
    template(v-if="iframeIsVisible")
      .row
        .url-textarea {{iframe}}
        .input-button-wrap(@click.left="copy")
          button
            span Copy Code
    //- Url
    template(v-if="!iframeIsVisible")
      .row
        .url-textarea {{url}}
        .input-button-wrap(@click.left="copy")
          button
            span Copy URL

    //- Zoom
    .row
      img.icon.icon-zoom(src="@/assets/search.svg")
      Slider(
        @updatePlayhead="updateZoom"
        :minValue="40"
        :value="spaceZoomPercent"
        :maxValue="100"
        :initialValue="100"
      )

</template>

<script>
import Slider from '@/components/Slider.vue'
import utils from '@/utils.js'

export default {
  name: 'Embed',
  components: {
    Slider
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      iframeIsVisible: true,
      min: 40,
      max: 100
    }
  },
  computed: {
    spaceZoomPercent () { return this.$store.state.spaceZoomPercent },
    url () {
      const spaceId = this.$store.state.currentSpace.id
      const zoom = this.spaceZoomPercent
      return `${utils.kinopioDomain()}/embed/?spaceId=${spaceId}&zoom=${zoom}`
    },
    iframe () {
      return `<div class="kinopio-embed" style="height: 420px; width: 100%;">
  <iframe src="${this.url}" style="height: 100%; width: 100%; border: 0; border-radius: 5px;">
  </iframe>
</div>`
    }
  },
  methods: {
    updateZoom (percent) {
      percent = percent / 100
      percent = Math.round(this.min + (this.max - this.min) * percent)
      this.$store.commit('spaceZoomPercent', percent)
    },
    toggleIframeIsVisible (event) {
      this.iframeIsVisible = true
      this.$store.commit('clearNotificationsWithPosition')
    },
    toggleUrlIsVisible () {
      this.iframeIsVisible = false
      this.$store.commit('clearNotificationsWithPosition')
    },
    async copy (event) {
      this.$store.commit('clearNotificationsWithPosition')
      let value
      if (this.iframeIsVisible) {
        value = this.iframe
      } else {
        value = this.url
      }
      const position = utils.cursorPositionInPage(event)
      try {
        await navigator.clipboard.writeText(value)
        this.$store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
      } catch (error) {
        console.warn('🚑 copy', error)
        this.$store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
      }
    }
  },
  watch: {
    visible (visible) {
      this.$store.commit('clearNotificationsWithPosition')
      if (visible) {
        this.toggleIframeIsVisible()
      }
    }
  }
}
</script>

<style lang="stylus">
.embed
  left initial
  right 8px
  overflow scroll
  @media(max-width 350px)
    right -50px
  textarea
    background-color var(--secondary-background)
    border 0
    border-radius 3px
    padding 4px
    margin-bottom 10px
    height 100px
  .success-message
    margin-top 10px
  .slider
    margin-top -10px
  .icon-zoom
    margin-right 4px
    margin-top -4px
</style>
