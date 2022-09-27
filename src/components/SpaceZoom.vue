<template lang="pug">
.space-zoom
  Slider(
    @updatePlayhead="updateSpaceZoom"
    :minValue="min"
    :value="spaceZoomPercent"
    :maxValue="max"
    :animateJiggleRight="animateJiggleRight"
    :animateJiggleLeft="animateJiggleLeft"
    minLabel="(Z)"
    @removeAnimations="removeAnimations"
    @pointerdown="closeAllDialogs"
  )
</template>

<script>
import Slider from '@/components/Slider.vue'

const increment = 10

export default {
  name: 'SpaceZoom',
  components: {
    Slider
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      const { type, payload } = mutation
      if (type === 'triggerSpaceZoomReset') {
        this.updateSpaceZoomFromTrigger(this.max)
        window.scrollTo(0, 0)
      } else if (type === 'triggerSpaceZoomOut') {
        let percent = this.spaceZoomPercent
        let speed
        if (payload) {
          speed = payload.speed
        }
        percent -= speed || increment
        this.updateSpaceZoomFromTrigger(percent)
      } else if (type === 'triggerSpaceZoomIn') {
        let percent = this.spaceZoomPercent
        let speed
        if (payload) {
          speed = payload.speed
        }
        percent += speed || increment
        this.updateSpaceZoomFromTrigger(percent)
      } else if (type === 'triggerToggleZoomOut') {
        let value = this.max
        if (this.spaceZoomPercent !== this.min) {
          value = this.min
        }
        this.$store.commit('spaceZoomPercent', value)
      }
    })
  },
  data () {
    return {
      min: 40,
      max: 100,
      animateJiggleRight: false,
      animateJiggleLeft: false
    }
  },
  computed: {
    spaceZoomPercent () { return this.$store.state.spaceZoomPercent }
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
      this.updateBackgroundZoom()
    },
    updateSpaceZoom (percent) {
      this.updateSpaceZoomPercent(percent)
      this.updateBackgroundZoom()
    },
    updateSpaceZoomPercent (percent) {
      percent = percent / 100
      percent = Math.round(this.min + (this.max - this.min) * percent)
      this.$store.commit('spaceZoomPercent', percent)
    },
    updateBackgroundZoom () {
      this.$store.dispatch('currentSpace/updateBackgroundZoom')
    },
    removeAnimations () {
      this.animateJiggleRight = false
      this.animateJiggleLeft = false
    },
    closeAllDialogs () {
      this.$store.dispatch('clearMultipleSelected')
      this.$store.dispatch('closeAllDialogs', 'SpaceZoom')
    }
  }
}
</script>

<style lang="stylus">
.space-zoom
  display block
  width 100px
</style>
