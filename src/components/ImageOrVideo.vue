<template lang="pug">
//- Video
video(v-if="Boolean(video)" autoplay loop muted playsinline :key="video" :class="{selected: isSelectedOrDragging}" @canplay="updateDimensions" ref="video")
  source(:src="video")
//- Image
img.image(v-if="pendingUploadDataUrl" :src="pendingUploadDataUrl" :class="{selected: isSelectedOrDragging}" @load="updateDimensions")
img.image(v-else-if="Boolean(image)" :src="image" :class="{selected: isSelectedOrDragging}" @load="updateDimensions")
</template>

<script>
// import utils from '@/utils.js'

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
        this.checkIfShouldPauseVideo()
      }
    })
  },
  mounted () {
  },
  beforeUnmount () {
  },
  data () {
    return {
    }
  },
  computed: {
    ...mapState([
    ]),
    ...mapGetters([
      'isInteractingScrollOrZoom'
    ])
  },
  methods: {
    updateDimensions () {
      this.$store.dispatch('currentCards/updateDimensions', { cards: [this.card] })
    },
    checkIfShouldPauseVideo () {
      if (!this.video) { return }
      const element = this.$refs.video
      if (this.isInteractingScrollOrZoom) {
        element.pause()
      } else {
        element.play()
      }
    }
  },
  watch: {
    isVisibleInViewport (value) {
      this.checkIfShouldPauseVideo()
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
