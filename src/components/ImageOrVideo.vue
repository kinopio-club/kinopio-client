<template lang="pug">
//- Video
video(v-if="Boolean(video)" autoplay loop muted playsinline :key="video" :class="{selected: isSelectedOrDragging}" @canplay="updateDimensions" ref="video")
  source(:src="video")
//- Image
img.image(v-if="pendingUploadDataUrl" :src="pendingUploadDataUrl" :class="{selected: isSelectedOrDragging}" @load="updateDimensions")
img.image(v-else-if="imageIsVisible" :src="image" :class="{selected: isSelectedOrDragging}" @load="updateDimensions" ref="image")
canvas.image(v-else-if="pausedGifIsVisible" ref="pausedGif" :style="pausedGifStyles")
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'ImageOrVideo',
  components: {
  },
  props: {
    isVisibleInViewport: Boolean,
    isSelectedOrDragging: Boolean,
    pendingUploadDataUrl: String,
    image: String,
    video: String
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerOptimizePerformanceDuringScrollOrZoom') {
        this.pause()
      }
    })
  },
  data () {
    return {
      imageRect: {}
    }
  },
  computed: {
    ...mapState([
    ]),
    ...mapGetters([
      'isInteractingScrollOrZoom',
      'spaceCounterZoomDecimal'
    ]),
    imageIsGif () {
      if (!this.image) { return }
      return this.image.includes('.gif')
    },
    imageIsVisible () {
      if (this.imageIsGif) {
        return !this.isInteractingScrollOrZoom
      } else {
        return this.image
      }
    },
    pausedGifIsVisible () {
      return this.isInteractingScrollOrZoom && this.imageIsGif
    },
    pausedGifStyles () {
      return {
        width: this.imageRect.width + 'px',
        height: this.imageRect.height + 'px'
      }
    }
  },
  methods: {
    updateDimensions () {
      this.$store.dispatch('currentCards/updateDimensions', { cards: [this.card] })
    },
    pause () {
      this.pauseGif()
      this.pauseVideo()
    },
    pauseGif () {
      if (!this.isInteractingScrollOrZoom) { return }
      if (!this.imageIsGif) { return }
      const element = this.$refs.image
      if (!element) { return }
      const rect = element.getBoundingClientRect()
      this.imageRect = {
        width: rect.width * this.spaceCounterZoomDecimal,
        height: rect.height * this.spaceCounterZoomDecimal
      }
      this.$nextTick(() => {
        let canvas = this.$refs.pausedGif
        canvas.width = this.imageRect.width * window.devicePixelRatio
        canvas.height = this.imageRect.height * window.devicePixelRatio
        const context = canvas.getContext('2d')
        let image = new Image()
        image.src = this.image
        context.drawImage(image, 0, 0)
      })
    },
    pauseVideo () {
      if (!this.video) { return }
      const element = this.$refs.video
      if (!element) { return }
      if (this.isInteractingScrollOrZoom) {
        element.pause()
      } else {
        element.play()
      }
    }
  },
  watch: {
    isVisibleInViewport (value) {
      this.pause()
    }
  }
}
</script>

<style lang="stylus">
.media-card
  .image,
  video
    border-radius var(--entity-radius)
    display block
    -webkit-touch-callout none // prevents safari mobile press-and-hold from interrupting
    &.selected
      mix-blend-mode color-burn
</style>
