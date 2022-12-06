<template lang="pug">
</template>

<script>
import utils from '@/utils.js'

let viewport

const scrollTimerDuration = 150 // ms
let scrollTimer, scrollStartTime, shouldCancelScroll, scrollByTotal, prevScrolledBy

export default {
  name: 'ScrollByHandler',
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerScrollIntoView') {
        this.scrollIntoView(mutation.payload)
      } else if (mutation.type === 'triggerScrollBy') {
        this.scrollBy(mutation.payload)
      } else if (mutation.type === 'triggerScrollTo') {
        this.scrollTo(mutation.payload)
      }
    })
  },
  mounted () {
    this.updateViewport()
    window.addEventListener('resize', this.updateViewport)
  },
  beforeUnmount () {
    window.removeEventListener('resize', this.updateViewport)
  },
  computed: {
    isTouchDevice () { return this.$store.state.isTouchDevice }
  },
  methods: {
    updateViewport () {
      // explicitly update viewport to prevent using short viewport when ios keyboard is open
      viewport = utils.visualViewport()
    },
    scrollTo ({ x, y, behavior }) {
      behavior = behavior || 'auto'
      if (this.isTouchDevice) {
        this.$store.commit('touchScrollOrigin', { x, y })
      } else {
        window.scrollTo(x, y, behavior)
      }
    },
    scrollIntoView ({ element, toCenterTop }) {
      if (!element) { return }
      const padding = 20
      const headerPadding = 100
      // const zoom = this.$store.getters.spaceZoomDecimal
      const touchScrollOrigin = this.$store.state.touchScrollOrigin
      // const zoomOrigin = this.$store.state.zoomOrigin
      const scroll = {
        x: (-touchScrollOrigin.x || window.scrollX),
        y: (-touchScrollOrigin.y || window.scrollY)
      }
      let rect = element.getBoundingClientRect()
      rect = {
        x: rect.x + scroll.x,
        y: rect.y + scroll.y,
        width: rect.width,
        height: rect.height
      }

      //           ┌────────────────────────────┐
      //           │          Viewport          │
      //           │                            │
      //           │                            │
      //        ┌──┼───────────────┐            │
      //        │//│               │░           │
      //        x//│    rect       │░           │
      //        │//│               │░           │
      //        └──┼────width──────┘░           │
      //         ░░░░░░░░░░░░░░░░░░░░           │
      //           │                            │
      //           │            ┌───────────────┼──┐
      //           │            │               │//│░
      //           │            x       rect    │//│░
      //           │            │               │//│░
      //           │            └───────width──────┘░
      //           │             ░░░░░░░░░░░░░░░░░░░░
      //           │                            │
      //           │                            │
      //           │                            │
      //  scrollX  └────────────width───────────┘

      let x = 0
      let y = 0
      // x to scroll by
      const xOverlapLeft = rect.x - scroll.x
      const xOverlapRight = (xOverlapLeft + rect.width) - viewport.width
      // console.log('🍇 x overlaps',xOverlapLeft, xOverlapRight)
      if (toCenterTop) {
        const viewportCenter = scroll.x + (viewport.width / 2)
        const centeredCardX = viewportCenter - (rect.width / 2)
        x = (rect.x - scroll.x) - centeredCardX
      } else if (xOverlapLeft < 0) {
        x = xOverlapLeft - padding
      } else if (xOverlapRight > 0) {
        x = xOverlapRight + padding
      }

      // y to scroll by
      const yOverlapTop = rect.y - scroll.y
      const yOverlapBelow = (yOverlapTop + rect.height) - viewport.height
      const rectIsInBottomQuarter = rect.y > (scroll.y + (viewport.height / 4))
      const rectIsInBottomHalf = rect.y > (scroll.y + (viewport.height / 2))
      if (toCenterTop) {
        if (rectIsInBottomQuarter) {
          y = viewport.height / 4
        } else if (rectIsInBottomHalf) {
          y = viewport.height / 2
        } else {
          y = 0
        }
      } else if (rect.height > viewport.height) {
        y = scroll.y + headerPadding
      } else if (yOverlapTop < 0) {
        y = yOverlapTop - padding
      } else if (yOverlapBelow > 0) {
        y = yOverlapBelow + padding
      }
      // console.log(x,y)
      this.scrollBy({ x, y, behavior: 'smooth' })
    },
    scrollBy ({ x, y, behavior }) {
      behavior = behavior || 'smooth'
      if (this.isTouchDevice) {
        this.scrollByOnTouchDevice({ x, y, behavior })
      } else {
        this.scrollByOnMouseDevice({ x, y, behavior })
      }
    },
    scrollByOnTouchDevice ({ x, y, behavior }) {
      if (behavior === 'smooth') {
        if (scrollTimer) { return }
        scrollByTotal = { x, y }
        prevScrolledBy = { x: 0, y: 0 }
        shouldCancelScroll = false
        scrollTimer = window.requestAnimationFrame(this.scrollFrame)
      } else {
        this.$store.commit('updateTouchScrollOriginBy', { x, y })
        this.$nextTick(() => {
          this.$store.commit('triggerScrolledIntoView')
        })
      }
    },
    scrollFrame (timestamp) {
      if (!scrollStartTime) {
        scrollStartTime = timestamp
      }
      const elaspedTime = timestamp - scrollStartTime
      const percentComplete = (elaspedTime / scrollTimerDuration) // between 0 and 1
      let scrollBy = {
        x: Math.round(scrollByTotal.x * percentComplete) - prevScrolledBy.x,
        y: Math.round(scrollByTotal.y * percentComplete) - prevScrolledBy.y
      }
      prevScrolledBy = {
        x: prevScrolledBy.x + scrollBy.x,
        y: prevScrolledBy.y + scrollBy.y
      }
      if (shouldCancelScroll) {
        console.log('shouldCancelScroll') // TEMP
        this.cancelScroll()
      } else if (percentComplete <= 1.1) {
        this.$store.commit('updateTouchScrollOriginBy', scrollBy)
        window.requestAnimationFrame(this.scrollFrame)
      } else {
        this.cancelScroll()
        this.$nextTick(() => {
          this.$store.commit('triggerScrolledIntoView')
        })
      }
    },
    cancelScroll () {
      window.cancelAnimationFrame(scrollTimer)
      shouldCancelScroll = true
      scrollTimer = undefined
      scrollStartTime = undefined
    },
    scrollByOnMouseDevice ({ x, y, behavior }) {
      window.scrollBy({
        left: x,
        top: y,
        behavior
      })
    }
  }
}
</script>
