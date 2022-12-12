<template lang="pug">
.space-zoom
  Slider(
    @updatePlayhead="updateSpaceZoom"
    :minValue="min"
    :value="spaceZoomPercent"
    :maxValue="max"
    :animateJiggleRight="animateJiggleRight"
    :animateJiggleLeft="animateJiggleLeft"
    @removeAnimations="removeAnimations"
    @pointerdown="closeAllDialogs"
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
        this.$store.commit('resetZoom')
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
      } else if (mutation.type === 'triggerUpdateSpaceZoomSlider') {
        this.checkIfShouldAnimationJiggle(mutation.payload)
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
    min () { return consts.spaceZoom.min }, // 40
    spaceZoomPercent () { return this.$store.state.spaceZoomPercent }
  },
  methods: {
    updateSpaceZoomFromTrigger (percent) {
      this.$store.dispatch('spaceZoomPercent', percent)
    },
    updateSpaceZoom (percent) {
      this.updateSpaceZoomPercent(percent)
    },
    updateSpaceZoomPercent (percent) {
      percent = percent / 100
      percent = Math.round(this.min + (this.max - this.min) * percent)
      this.$store.dispatch('spaceZoomPercent', percent)
    },
    removeAnimations () {
      this.animateJiggleRight = false
      this.animateJiggleLeft = false
    },
    closeAllDialogs () {
      this.$store.dispatch('clearMultipleSelected')
      this.$store.dispatch('closeAllDialogs', 'SpaceZoom')
    },
    checkIfShouldAnimationJiggle (value) {
      if (value >= this.max) {
        this.animateJiggleRight = true
      } else if (value <= this.min) {
        this.animateJiggleLeft = true
      }
    }
  },
  watch: {
    spaceZoomPercent (value) {
      this.checkIfShouldAnimationJiggle(value)
    }
  }
}
</script>

<style lang="stylus">
.space-zoom
  display block
  width 100px
</style>
