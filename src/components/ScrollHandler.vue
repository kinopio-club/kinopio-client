<template lang="pug">
</template>

<script>
// import utils from '@/utils.js'

import { mapState, mapGetters } from 'vuex'

export default {
  name: 'ScrollHandler',
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'isLoadingSpace') {
        this.updateCardRectsInViewport()
      } else if (mutation.type === 'spaceZoomPercent') {
        this.updateCardRectsInViewport()
      }
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
      if (shouldZoomIn) {
        this.$store.commit('triggerSpaceZoomIn', { speed })
      } else if (shouldZoomOut) {
        this.$store.commit('triggerSpaceZoomOut', { speed })
      }
    },
    handleScrollEvents (event) {
      this.$store.dispatch('updateWindowScroll')
      this.updateCardRectsInViewport()
    },
    updateCardRectsInViewport () {
      this.$nextTick(() => {
        let cards = []
        const elements = document.querySelectorAll('article#card')
        elements.forEach(element => {
          if (element.dataset.isLocked === 'true') { return }
          const card = this.$store.getters['currentCards/byId'](element.dataset.cardId)
          cards.push(card)
        })
        this.$store.commit('currentCards/inViewport', cards)
      })
    }
  }
}
</script>

<style lang="stylus">
</style>
