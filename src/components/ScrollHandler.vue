<template lang="pug">
</template>

<script>
// import utils from '@/utils.js'

import { mapState, mapGetters } from 'vuex'

export default {
  name: 'ScrollHandler',
  mounted () {
    window.addEventListener('wheel', this.handleMouseWheelEvents, { passive: false })
  },
  beforeUnmount () {
    window.removeEventListener('wheel', this.handleMouseWheelEvents, { passive: false })
  },
  data () {
    return {
    }
  },
  computed: {
    ...mapState([
    ]),
    ...mapGetters([
    ])
  },
  methods: {
    handleMouseWheelEvents (event) {
      const isMeta = event.metaKey || event.ctrlKey // event.ctrlKey is true for trackpad pinch
      if (!isMeta) { return }
      event.preventDefault()
      const deltaY = event.deltaY
      let shouldZoomIn = deltaY < 0
      let shouldZoomOut = deltaY > 0
      const invertZoom = event.webkitDirectionInvertedFromDevice
      if (invertZoom) {
        shouldZoomIn = deltaY > 0
        shouldZoomOut = deltaY < 0
      }
      let speed = Math.min(Math.abs(deltaY), 5)
      if (shouldZoomIn) {
        this.$store.commit('triggerSpaceZoomIn', { speed })
      } else if (shouldZoomOut) {
        this.$store.commit('triggerSpaceZoomOut', { speed })
      }
    }
  }
}
</script>

<style lang="stylus">
</style>
