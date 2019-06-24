<template lang='pug'>
#app.app(
  :style="elementSize"
)
  Header
  MagicInk
  router-view
</template>

<script>
import utils from '@/utils.js'
import Header from '@/components/Header.vue'
import MagicInk from '@/components/MagicInk.vue'

const defaultScrollZone = 200
const scrollSpeeds = {
  fast: 40,
  medium: 20,
  slow: 5
}
let _event, viewportWidth, viewportHeight, scrollAtEdgesTimer
let scrollZone = {}

export default {
  components: {
    Header,
    MagicInk
  },
  data () {
    return {
      width: 0,
      height: 0
    }
  },
  computed: {
    elementSize () {
      return {
        width: `${this.width}px`,
        height: `${this.height}px`
      }
    }
  },
  mounted () {
    this.updateAppElementSize()
    window.addEventListener('resize', this.updateAppElementSize)
    window.addEventListener('mousemove', this.updateViewportScrolling)
    window.addEventListener('touchmove', this.updateViewportScrolling)
    window.addEventListener('mouseup', this.endViewportScrolling)
    window.addEventListener('touchend', this.endViewportScrolling)
  },
  methods: {
    updateAppElementSize () {
      console.log('updateAppElementSize')
      const body = document.body
      const html = document.documentElement
      viewportWidth = document.body.clientWidth
      viewportHeight = window.innerHeight
      this.width = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth)
      this.height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
      if (viewportWidth < defaultScrollZone * 2) {
        scrollZone.x = viewportWidth / 2
      } else {
        scrollZone.x = defaultScrollZone
      }
      if (viewportHeight < defaultScrollZone * 2) {
        scrollZone.y = viewportHeight / 2
      } else {
        scrollZone.y = defaultScrollZone
      }
    },

    shouldScrollAtEdges () {
      if (
        this.$store.state.currentUserIsDrawingConnection ||
        this.$store.state.currentUserIsInkingLocked ||
        this.$store.state.currentUserIsDraggingBlock
      ) { return true }
    },

    updateViewportScrolling (event) {
      if (this.shouldScrollAtEdges()) {
        _event = event
        console.log(event)
        this.updateAppElementSize()
        event.preventDefault()
        if (!scrollAtEdgesTimer) {
          scrollAtEdgesTimer = window.requestAnimationFrame(this.scrollAtEdgesFrame)
        }
      }
    },

    distance (value, scrollZoneXY) {
      if (value < 0) {
        return scrollSpeeds['fast']
      } else if (value < scrollZoneXY / 2) {
        return scrollSpeeds['medium']
      } else if (value < scrollZoneXY) {
        return scrollSpeeds['slow']
      }
    },

    scrollAtEdgesFrame () {
      if (!this.shouldScrollAtEdges()) { return }
      const cursorViewport = utils.cursorPositionInViewport(_event)
      const cursorPage = utils.cursorPositionInPage(_event)
      const positionInViewport = {
        left: cursorViewport.x,
        top: cursorViewport.y,
        right: viewportWidth - cursorViewport.x,
        bottom: viewportHeight - cursorViewport.y
      }
      const positionInPage = {
        left: cursorPage.x,
        top: cursorPage.y,
        right: this.width - cursorPage.x,
        bottom: this.height - cursorPage.y
      }

      const distances = {
        // left: -this.scrollSpeed(positionInViewport.left, scrollZone.x),
        // top: -this.scrollSpeed(positionInViewport.top, scrollZone.y),
        // right: this.scrollSpeed((viewportWidth - positionInViewport.left), scrollZone.x),
        bottom: this.distance(positionInViewport.bottom, scrollZone.y)
      }

      const delta = {
        // x: distances.left || distances.right,
        y: distances.top || distances.bottom
      }

      console.log('💦', positionInPage.bottom, this.height, cursorPage.y, delta.y)
      this.height += delta.y
      // this.width

      window.scrollBy({
        left: delta.x,
        top: delta.y,
        behaviour: 'smooth'
      })
      if (this.$store.state.currentUserIsDraggingBlock) {
        this.$store.dispatch('currentSpace/dragBlocks', { delta })
      }
      window.requestAnimationFrame(this.scrollAtEdgesFrame)
    },

    endViewportScrolling () {
      console.log('endViewportScrolling')
      window.cancelAnimationFrame(scrollAtEdgesTimer)
      scrollAtEdgesTimer = undefined
      // this.updateAppElementSize()
      this.$store.commit('currentUserIsDrawingConnection', false)
      this.$store.commit('currentUserIsInkingLocked', false)
      this.$store.commit('currentUserIsDraggingBlock', false)
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
  scroll-behavior smooth

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
