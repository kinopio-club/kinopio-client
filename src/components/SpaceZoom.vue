<template lang="pug">
.space-zoom
  Slider(
    @updatePlayhead="updateSpaceZoom"
    @resetPlayhead="resetZoomOrigin"
    :minValue="min"
    :value="spaceZoomPercent"
    :maxValue="max"
    :animateJiggleRight="animateJiggleRight"
    :animateJiggleLeft="animateJiggleLeft"
    @removeAnimations="removeAnimations"
    @pointerdown="closeAllDialogs"
    :minKeyboardShortcut="minKeyboardShortcut"
  )
</template>

<script>
import Slider from '@/components/Slider.vue'
import consts from '@/consts.js'

const increment = 10

export default {
  name: 'SpaceZoom',
  components: {
    Slider
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerSpaceZoomReset') {
        this.updateSpaceZoomFromTrigger(this.max)
        window.scrollTo(0, 0)
      } else if (mutation.type === 'triggerSpaceZoomOut') {
        let percent = this.spaceZoomPercent
        let speed
        if (mutation.payload) {
          speed = mutation.payload.speed
        }
        percent -= speed || increment
        this.updateSpaceZoomFromTrigger(percent)
      } else if (mutation.type === 'triggerSpaceZoomIn') {
        let percent = this.spaceZoomPercent
        let speed
        if (mutation.payload) {
          speed = mutation.payload.speed
        }
        percent += speed || increment
        this.updateSpaceZoomFromTrigger(percent)
      } else if (mutation.type === 'triggerCenterZoomOrigin') {
        this.centerZoomOrigin()
      } else if (mutation.type === 'triggerSpaceZoomOutMax') {
        this.zoomOutMax()
      }
    })
  },
  data () {
    return {
      animateJiggleRight: false,
      animateJiggleLeft: false
    }
  },
  computed: {
    max () { return consts.spaceZoom.max }, // 100
    min () { return consts.spaceZoom.min }, // 20
    spaceZoomPercent () { return this.$store.state.spaceZoomPercent },
    minKeyboardShortcut () { return 'Z' }
  },
  methods: {
    updateSpaceZoomFromTrigger (percent) {
      if (percent > this.max) {
        this.animateJiggleRight = true
      } else if (percent < this.min) {
        this.animateJiggleLeft = true
      }
      percent = Math.max(percent, this.min)
      percent = Math.min(percent, this.max)
      this.$store.commit('spaceZoomPercent', percent)
    },
    updateSpaceZoom (percent) {
      this.centerZoomOrigin()
      this.updateSpaceZoomPercent(percent)
    },
    updateSpaceZoomPercent (percent) {
      percent = percent / 100
      percent = Math.round(this.min + (this.max - this.min) * percent)
      this.$store.commit('spaceZoomPercent', percent)
    },
    removeAnimations () {
      this.animateJiggleRight = false
      this.animateJiggleLeft = false
    },
    closeAllDialogs () {
      this.$store.dispatch('clearMultipleSelected')
      this.$store.dispatch('closeAllDialogs')
    },
    resetZoomOrigin () {
      this.$store.commit('zoomOrigin', { x: 0, y: 0 })
    },
    centerZoomOrigin () {
      const scroll = this.$store.state.windowScroll
      const origin = {
        x: scroll.x + (this.$store.state.viewportWidth / 6),
        y: scroll.y + (this.$store.state.viewportHeight / 6)
      }
      this.$store.dispatch('zoomOrigin', origin)
    },
    zoomOutMax () {
      this.centerZoomOrigin()
      if (this.$store.state.spaceZoomPercent === this.min) {
        this.$store.commit('spaceZoomPercent', this.max)
      } else {
        this.$store.commit('spaceZoomPercent', this.min)
      }
    }
  }
}
</script>

<style lang="stylus">
.space-zoom
  display block
  width 100px
</style>
