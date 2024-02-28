<template lang="pug">
//- Video
video(v-if="Boolean(video)" autoplay loop muted playsinline :key="video" :class="{selected: isSelectedOrDragging}" @canplay="handleSuccess" ref="video")
  source(:src="video")
//- Image
img.image(v-if="imageUrl" :src="imageUrl" :class="{selected: isSelectedOrDragging}" @load="handleSuccess" @error="handleError")
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'ImageOrVideo',
  components: {
  },
  props: {
    isSelectedOrDragging: Boolean,
    pendingUploadDataUrl: String,
    image: String,
    video: String
  },
  emits: ['updateCardDimensions', 'imageLoadSuccess', 'imageLoadError'],
  data () {
    return {
      imageUrl: null
    }
  },
  created () {
    this.imageUrl = this.image || this.pendingUploadDataUrl
  },
  computed: {
    isInteractingWithItem () { return this.$store.getters.isInteractingWithItem }
  },
  methods: {
    updateDimensions () {
      this.$emit('updateCardDimensions')
    },
    pause () {
      if (!this.video) { return }
      const element = this.$refs.video
      element.pause()
    },
    play () {
      if (!this.video) { return }
      const element = this.$refs.video
      element.play()
    },
    handleSuccess (event) {
      this.$emit('imageLoadSuccess')
      this.updateDimensions()
    },
    handleError (event) {
      this.$emit('imageLoadError')
      this.updateDimensions()
    }
  },
  watch: {
    image (url) {
      if (!url && !this.pendingUploadDataUrl) {
        this.imageUrl = null
      }

      const onLoaded = () => {
        this.imageUrl = url
      }

      const image = new Image()
      image.addEventListener('load', onLoaded)
      image.addEventListener('error', this.handleError)
      image.src = url

      if (image.complete) {
        onLoaded()
      }
    },
    pendingUploadDataUrl (url) {
      if (url) {
        this.imageUrl = url
      }
    },
    isInteractingWithItem (value) {
      if (utils.isSafari()) { return } // fixes: safari hides video when pausing
      if (value) {
        this.pause()
      } else {
        this.play()
      }
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
