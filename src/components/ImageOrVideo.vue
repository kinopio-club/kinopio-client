<template lang="pug">
//- Video
video(v-if="Boolean(video)" autoplay loop muted playsinline :key="video" :class="{selected: isSelectedOrDragging}" @canplay="handleSuccess" ref="video")
  source(:src="video")
//- Image
img.image(v-if="pendingUploadDataUrl" :src="pendingUploadDataUrl" :class="{selected: isSelectedOrDragging}" @load="handleSuccess")
img.image(v-else-if="Boolean(image)" :src="image" :class="{selected: isSelectedOrDragging}" @load="handleSuccess" @error="handleError")
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
