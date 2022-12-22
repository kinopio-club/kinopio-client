<template lang="pug">
</template>

<script>
import utils from '@/utils.js'

import { mapState, mapGetters } from 'vuex'

export default {
  name: 'ScrollHandler',
  created () {
    this.$store.subscribe((mutation, state) => {
    })
  },
  mounted () {
    window.addEventListener('wheel', this.handleMouseWheelEvents, { passive: false })
    window.addEventListener('scroll', this.handleScrollEvents)
    this.$store.dispatch('updateWindowScroll')
  },
  beforeUnmount () {
    window.removeEventListener('wheel', this.handleMouseWheelEvents, { passive: false })
    window.removeEventListener('scroll', this.handleScrollEvents)
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
      speed = speed * 2
      this.updateZoomOrigin(event)
      if (shouldZoomIn) {
        this.$store.commit('triggerSpaceZoomIn', { speed })
      } else if (shouldZoomOut) {
        this.$store.commit('triggerSpaceZoomOut', { speed })
      }
    },
    handleScrollEvents (event) {
      this.$store.dispatch('updateWindowScroll')
    },
    updateZoomOrigin (event) {
      const cursor = utils.cursorPositionInPage(event)
      this.$store.commit('zoomOrigin', cursor)
    }
  }
}
</script>

<style lang="stylus">
</style>
