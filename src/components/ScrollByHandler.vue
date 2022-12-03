<template lang="pug">
</template>

<script>
// import utils from '@/utils.js'

const scrollTimerDuration = 100 // ms
let scrollTimer, scrollStartTime, shouldCancelScroll //, scrollByTotal

export default {
  name: 'ScrollByHandler',
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerScrollIntoView') {
        this.scrollIntoView(mutation.payload)
      } else if (mutation.type === 'triggerScrollBy') {
        const { x, y } = mutation.payload
        this.scrollBy(x, y)
      }
    })
  },
  methods: {
    scrollIntoView ({ element, behavior }) {
      console.log('🚙', element, behavior)
      if (!element) { return }
      const rect = element.getBoundingClientRect()
      const viewportWidth = this.$store.state.viewportWidth
      const viewportHeight = this.$store.state.viewportHeight
      let x = rect.x + rect.width - viewportWidth
      let y = rect.y + rect.height - viewportHeight
      let scrollX = 0
      let scrollY = 0
      if (x > 0) {
        scrollX = x + 20
      }
      if (y > 0) {
        scrollY = y + 80
      }
      this.scrollBy(scrollX, scrollY, behavior)
    },
    scrollBy (x, y, behavior) {
      behavior = behavior || 'smooth'
      const isTouchDevice = this.$store.state.isTouchDevice
      if (isTouchDevice) {
        console.log('❤️', window.scrollX)
        // if (scrollTimer) { return }
        // shouldCancelScroll = false
        // const currentScroll = this.$store.state.touchScrollOrigin
        // scrollByTotal = {
        //   x: currentScroll.x - x,
        //   y: currentScroll.y - y
        // }
        // scrollTimer = window.requestAnimationFrame(this.scrollFrame)
      } else {
        console.log('💖', x, y, behavior)
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
