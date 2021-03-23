<template lang="pug">
.space-zoom
  Slider(@updatePlayhead="updateSpaceZoom" :minValue=40 :value="spaceZoomPercent" :maxValue=100)
</template>

<script>
import Slider from '@/components/Slider.vue'

export default {
  name: 'SpaceZoom',
  components: {
    Slider
  },
  computed: {
    spaceZoomPercent () { return this.$store.state.spaceZoomPercent }
  },
  methods: {
    updateSpaceZoom (percent) {
      this.updateSpaceZoomPercent(percent)
      this.updateBackgroundZoom(percent)
    },
    updateSpaceZoomPercent (percent) {
      const min = 40
      const max = 100
      let spaceZoomPercent = percent
      spaceZoomPercent = spaceZoomPercent / 100
      spaceZoomPercent = Math.round(min + (max - min) * spaceZoomPercent)
      this.$store.commit('spaceZoomPercent', spaceZoomPercent)
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
