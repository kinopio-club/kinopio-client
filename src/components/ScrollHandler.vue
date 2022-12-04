<template lang="pug">
</template>

<script>
import utils from '@/utils.js'

const scrollTimerDuration = 100 // ms
let scrollTimer, scrollStartTime, shouldCancelScroll //, scrollByTotal

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
  computed: {
    isTouchDevice () { return this.$store.state.isTouchDevice }
  },
  methods: {
    scrollTo ({ x, y, behavior }) {
      behavior = behavior || 'auto'
      if (this.isTouchDevice) {
        this.$store.commit('touchScrollOrigin', { x, y })
      } else {
        window.scrollTo(x, y, behavior)
      }
    },
    scrollIntoView ({ element, toCenterTop }) {
      console.log('🚙 scrollIntoView', element, toCenterTop)
      if (!element) { return }
      const padding = 20
      let rect = element.getBoundingClientRect()
      const position = utils.cursorPositionInSpace({ position: rect })
      rect.x = position.x
      rect.y = position.y
      const viewport = {
        width: this.$store.state.viewportWidth,
        height: this.$store.state.viewportHeight
      }
      const touchScrollOrigin = this.$store.state.touchScrollOrigin
      const scroll = {
        x: -touchScrollOrigin.x || window.scrollX,
        y: -touchScrollOrigin.y || window.scrollY
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
      // x
      const xOverlapLeft = rect.x - scroll.x
      const xOverlapRight = (xOverlapLeft + rect.width) - viewport.width
      if (xOverlapLeft < 0) {
        x = xOverlapLeft - padding
      } else if (xOverlapRight > 0) {
        x = xOverlapRight + padding
      }
      // y
      const yOverlapLeft = rect.y - scroll.y
      const yOverlapRight = (yOverlapLeft + rect.height) - viewport.height
      if (yOverlapLeft < 0) {
        y = yOverlapLeft - padding
      } else if (yOverlapRight > 0) {
        y = yOverlapRight + padding
      }
      // TODO add toCenterTop handling using half vph
      this.scrollBy({ x, y, behavior: 'smooth' })
    },
    scrollBy ({ x, y, behavior }) {
      behavior = behavior || 'smooth'
      if (this.isTouchDevice) {
        console.log('❤️ scrollBy', x, y)
        // if (scrollTimer) { return }
        // shouldCancelScroll = false
        // const currentScroll = this.$store.state.touchScrollOrigin
        // scrollByTotal = {
        //   x: currentScroll.x - x,
        //   y: currentScroll.y - y
        // }
        //  raf if smooth
        // scrollTimer = window.requestAnimationFrame(this.scrollFrame)
        this.$store.commit('updateTouchScrollOriginBy', { x, y }) // temp
        this.$store.commit('triggerScrolledIntoView') // tODO run this After smooth scroll raf is completed
      } else {
        console.log('💖 window scrollBy', x, y, behavior)
        window.scrollBy({
          left: x,
          top: y,
          behavior
        })
      }
    },
    scrollFrame (timestamp) {
      if (!scrollStartTime) {
        scrollStartTime = timestamp
      }
      const elaspedTime = timestamp - scrollStartTime
      const percentComplete = (elaspedTime / scrollTimerDuration) // between 0 and 1
      if (shouldCancelScroll) {
        this.cancelScroll()
      } else if (percentComplete <= 1) {
        this.translateScroll(percentComplete)
        window.requestAnimationFrame(this.scrollFrame)
      } else {
        this.cancelScroll()
      }
    },
    translateScroll (percentComplete) {
      if (!percentComplete) { }
      // const scrollOrigin = {
      //   x: scrollByTotal.x / percentComplete,
      //   y: scrollByTotal.y / percentComplete,
      // }
      // console.log(window.scrollX, this.$store.state.touchScrollOrigin, scrollByTotal, percentComplete, scrollOrigin)
      // this.$store.commit('touchScrollOrigin', scrollOrigin)
    },
    cancelScroll () {
      window.cancelAnimationFrame(scrollTimer)
      scrollTimer = undefined
      scrollStartTime = undefined
    }
  }
}
</script>
