<template lang='pug'>
#app.app(
  :style="elementSize"
  @mousemove="updateViewportScrolling"
  @touchmove="updateViewportScrolling"
  @mouseup="endViewportScrolling"
  @touchend="endViewportScrolling"
  @mouseleave="endViewportScrolling"
)
  Header
  MagicInk
  router-view
</template>

<script>
import utils from '@/utils.js'
import Header from '@/components/Header.vue'
import MagicInk from '@/components/MagicInk.vue'

let _event, clientWidth, clientHeight, scrollAtEdgesTimer

export default {
  components: {
    Header,
    MagicInk
  },
  data () {
    return {
      width: 0,
      height: 0,
      overflow: 'visible'
    }
  },
  mounted () {
    this.updateAppElementSize()
    window.addEventListener('resize', this.updateAppElementSize)
    window.addEventListener('scroll', this.updateAppElementSize)
  },
  computed: {
    elementSize () {
      return {
        width: `${this.width}px`,
        height: `${this.height}px`,
        overflow: `${this.overflow}`
      }
    }
  },
  methods: {
    updateAppElementSize () {
      console.log('updateAppElementSize')
      const body = document.body
      const html = document.documentElement
      clientWidth = document.body.clientWidth
      clientHeight = window.innerHeight
      this.width = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth)
      this.height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
    },

    shouldOnlyScrollAtEdges () {
      if (
        this.$store.state.currentUserIsDrawingConnection ||
        this.$store.state.currentUserIsInkingLocked ||
        this.$store.state.currentUserIsDraggingBlock
      ) { return true }
    },

    updateViewportScrolling (event) {
      if (this.shouldOnlyScrollAtEdges()) {
        _event = event
        event.preventDefault()
        if (!scrollAtEdgesTimer) {
          scrollAtEdgesTimer = window.requestAnimationFrame(this.scrollAtEdges)
          console.log(scrollAtEdgesTimer)
        }
      }
    },

    pxToScroll (position, axis) {
      const xScrollDistancesFromEdge = utils.distancesFromEdge(clientWidth)
      const yScrollDistancesFromEdge = utils.distancesFromEdge(clientHeight)
      const xDistancesToScroll = utils.distancesToScroll(clientWidth)
      const yDistancesToScroll = utils.distancesToScroll(clientHeight)

      let distancesFromEdge, scrollByDistance, viewportSize
      if (axis === 'x') {
        distancesFromEdge = xScrollDistancesFromEdge
        scrollByDistance = xDistancesToScroll
        viewportSize = clientWidth
      } else if (axis === 'y') {
        distancesFromEdge = yScrollDistancesFromEdge
        scrollByDistance = yDistancesToScroll
        viewportSize = clientHeight
      }
      const shouldScrollStart = position < distancesFromEdge.far
      const shouldScrollEnd = position > (viewportSize - distancesFromEdge.far)
      const proximityTypeStart = utils.proximityTypeFromEdge(position, distancesFromEdge)
      const proximityTypeEnd = utils.proximityTypeFromEdge(position, distancesFromEdge, viewportSize)

      if (shouldScrollStart) {
        return -scrollByDistance[proximityTypeStart]
      } else if (shouldScrollEnd) {
        return scrollByDistance[proximityTypeEnd]
      }
    },

    scrollAtEdges (event) {
      if (!this.shouldOnlyScrollAtEdges() || !_event) { return }
      const position = utils.cursorPositionInViewport(_event)
      const delta = {
        x: this.pxToScroll(position.x, 'x'),
        y: this.pxToScroll(position.y, 'y')
      }
      window.scrollBy(delta.x, delta.y)

      if (this.$store.state.currentUserIsDraggingBlock) {
        this.$store.dispatch('currentSpace/dragBlocks', { delta })
      }
      window.requestAnimationFrame(this.scrollAtEdges)
    },

    endViewportScrolling () {
      window.cancelAnimationFrame(scrollAtEdgesTimer)
      scrollAtEdgesTimer = undefined
    }
  }
}
</script>

<style lang="stylus">
// global styles

:root
  // theme vars
  --primary-background white
  --primary black
  --block-background #e3e3e3
  --hover-background #d8d8d8
  // non-theme vars
  --max-z 2147483647

*
  -webkit-overflow-scrolling touch
  -webkit-tap-highlight-color transparent
  box-sizing border-box

body
  margin 0
  color var(--primary)
  background-color var(--primary-background)
  background-image url('assets/background.svg')
  -webkit-user-select none
  overflow auto // enables window.scrollBy support

.app
  position relative

dialog
  width: 300px
  left: 8px
  top: 8px
  position: absolute
  margin 0
  padding 0
  user-select auto
  pointer-events all
  z-index var(--max-z)
  section
    padding 8px
  section + section
    border-top: 1px solid var(--primary)

//
.meta
  max-width 600px
  width 95%
  margin 8px
  margin-top 60px
  position absolute
  pointer-events none
  img
    max-width 100%
    border-radius: 3px
</style>
