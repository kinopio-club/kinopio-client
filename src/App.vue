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
  fast: 30,
  medium: 15,
  slow: 5
}
let _event, viewportWidth, viewportHeight, scrollAtEdgesTimer
let scrollZone = {}
let prevCursorPosition = {}
let moveDirection = {}

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
    shouldScrollAtEdges () {
      if (
        this.$store.state.currentUserIsDrawingConnection ||
        this.$store.state.currentUserIsInkingLocked ||
        this.$store.state.currentUserIsDraggingBlock
      ) { return true }
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

    updateAppElementSize () {
      console.log('🐸 updateAppElementSize')
      const body = document.body
      const html = document.documentElement
      this.width = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth)
      this.height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
      viewportWidth = document.body.clientWidth
      viewportHeight = window.innerHeight
      if (viewportWidth < defaultScrollZone * 4) {
        scrollZone.x = viewportWidth / 4
      } else {
        scrollZone.x = defaultScrollZone
      }
      if (viewportHeight < defaultScrollZone * 4) {
        scrollZone.y = viewportHeight / 4
      } else {
        scrollZone.y = defaultScrollZone
      }
    },

    updateViewportScrolling (event) {
      if (this.shouldScrollAtEdges()) {
        console.log('updateViewportScrolling')
        _event = event
        const currentCursorPosition = utils.cursorPositionInViewport(_event)
        const xDelta = currentCursorPosition.x - prevCursorPosition.x
        const yDelta = currentCursorPosition.y - prevCursorPosition.y
        if (xDelta < 0) {
          moveDirection.left = true
          moveDirection.right = false
        } else if (xDelta > 0) {
          moveDirection.left = false
          moveDirection.right = true
        }
        if (yDelta < 0) {
          moveDirection.up = true
          moveDirection.down = false
        } else if (yDelta > 0) {
          moveDirection.up = false
          moveDirection.down = true
        }
        prevCursorPosition = currentCursorPosition
        this.updateAppElementSize()
        event.preventDefault()
        if (!scrollAtEdgesTimer) {
          scrollAtEdgesTimer = window.requestAnimationFrame(this.scrollAtEdgesFrame)
        }
      }
    },

    scrollAtEdgesFrame () {
      if (!this.shouldScrollAtEdges()) { return }
      console.log('🦑 scrollAtEdgesFrame')

      let toScroll = {}
      const cursorViewport = utils.cursorPositionInViewport(_event)
      const cursorPage = utils.cursorPositionInPage(_event)
      const positionInViewport = {
        left: cursorViewport.x,
        up: cursorViewport.y,
        right: viewportWidth - cursorViewport.x,
        down: viewportHeight - cursorViewport.y
      }
      const positionInPage = {
        left: cursorPage.x,
        up: cursorPage.y,
        right: this.width - cursorPage.x,
        down: this.height - cursorPage.y
      }

      // TODO refactor
      if (moveDirection.left) {
        if (positionInPage.left < scrollZone.x && window.scrollX === 0) {
          toScroll.x = 0
        } else {
          toScroll.x = -this.distance(positionInViewport.left, scrollZone.x)
        }
      } else if (moveDirection.right) {
        toScroll.x = this.distance(positionInViewport.right, scrollZone.x)
      }

      if (moveDirection.up) {
        if (positionInPage.up < scrollZone.y && window.scrollY === 0) {
          toScroll.y = 0
        } else {
          toScroll.y = -this.distance(positionInViewport.up, scrollZone.y)
        }
      } else if (moveDirection.down) {
        toScroll.y = this.distance(positionInViewport.down, scrollZone.y)
      }

      // TODO only expand this if needed
      this.height += toScroll.y
      this.width += toScroll.x

      window.scrollBy(toScroll.x, toScroll.y)
      if (this.$store.state.currentUserIsDraggingBlock) {
        this.$store.dispatch('currentSpace/dragBlocks', { delta: toScroll })
      }
      window.requestAnimationFrame(this.scrollAtEdgesFrame)
    },

    endViewportScrolling () {
      console.log('endViewportScrolling')
      window.cancelAnimationFrame(scrollAtEdgesTimer)
      scrollAtEdgesTimer = undefined
      // this.updateAppElementSize()
      prevCursorPosition = {}
      moveDirection = {}
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
