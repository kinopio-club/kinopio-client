<template lang="pug">
.space-zoom
  Slider(@updatePlayhead="updateSpaceZoom" :minValue="min" :value="spaceZoomPercent" :maxValue="max")
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
      if (mutation.type === 'triggerSpaceZoomReset') {
        this.updateSpaceZoomFromTrigger(this.max)
      }
      if (mutation.type === 'triggerSpaceZoomOut') {
        let percent = this.spaceZoomPercent
        percent -= mutation.payload || increment
        this.updateSpaceZoomFromTrigger(percent)
      }
      if (mutation.type === 'triggerSpaceZoomIn') {
        let percent = this.spaceZoomPercent
        percent += mutation.payload || increment
        this.updateSpaceZoomFromTrigger(percent)
      }
    })
  },
  data () {
    return {
      min: 40,
      max: 100
    }
  },
  computed: {
    spaceZoomPercent () { return this.$store.state.spaceZoomPercent }
  },
  methods: {
    updateSpaceZoomFromTrigger (percent) {
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
    }
  }
}
</script>

<style lang="stylus">
.space-zoom
  display block
  width 100px
</style>
