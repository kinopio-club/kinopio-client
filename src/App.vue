<template lang='pug'>
#app.app(
  :style="elementSize"
  @mousemove="lockViewport"
  @touchmove="lockViewport"
)
  MagicInk
  router-view
  Header
</template>

<script>
import utils from '@/utils.js'
import Header from '@/components/Header.vue'
import MagicInk from '@/components/MagicInk.vue'

let _event

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
    setInterval(this.scrollAtEdges, 16) // 16ms ~= 60fps
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
      this.width = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth)
      this.height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
    },

    shouldOnlyScrollAtEdges () {
      if (
        this.$store.state.currentUserIsDrawingConnection ||
        this.$store.state.currentUserIsInkingLocked ||
        this.$store.state.currentUserIsDraggingBlock
      ) {
        return true
      } else { return false }
    },

    lockViewport (event) {
      if (this.shouldOnlyScrollAtEdges()) {
        _event = event
        event.preventDefault()
      }
    },

    pxToScroll (value, axis) {
      let viewSize
      const distance = {
        closest: 25,
        closer: 50,
        close: 100
      }
      const scrollBy = {
        closest: 30,
        closer: 20,
        close: 10
      }
      if (axis === 'x') {
        viewSize = document.body.clientWidth
      } else if (axis === 'y') {
        viewSize = document.body.clientHeight
      }
      if (utils.between({
        value: value,
        min: distance.close,
        max: (viewSize - distance.close)
      })) { return }

      if (value < distance.closest) {
        return -scrollBy['closest']
      } else if (value < distance.closer) {
        return -scrollBy['closer']
      } else if (value < distance.close) {
        return -scrollBy['close']
      } else if (value > (viewSize - distance.closest)) {
        return scrollBy['closest']
      } else if (value > (viewSize - distance.closer)) {
        return scrollBy['closer']
      } else if (value > (viewSize - distance.close)) {
        return scrollBy['close']
      }
    },

    scrollAtEdges (event) {
      if (!this.shouldOnlyScrollAtEdges() || !_event) { return }
      const position = utils.cursorPosition(_event)
      const xToScroll = this.pxToScroll(position.x, 'x')
      const yToScroll = this.pxToScroll(position.y, 'y')
      console.log('cardid', this.$store.state.currentDraggingBlockId, 'scrollBy', xToScroll, yToScroll)
      window.scrollBy(xToScroll, yToScroll)
    }
  }
}
</script>

<style lang="stylus">
:root
  --primary-background white
  --primary black
  --secondary-background #e3e3e3

*
  -webkit-overflow-scrolling touch
  -webkit-tap-highlight-color transparent
  box-sizing border-box

body
  margin 0
  color var(--primary)
  background-color var(--primary-background)
  background-image url('assets/background.svg')
  overflow auto // enables window.scrollBy support

.app
  position relative

//
.meta-page
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
