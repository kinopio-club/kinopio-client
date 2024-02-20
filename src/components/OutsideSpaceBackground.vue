<template lang="pug">
.outside-space-background(:style="styles")
</template>

<script>
import postMessage from '@/postMessage.js'
import utils from '@/utils.js'

// adapted from https://gist.github.com/pketh/3f62b807db3835d564c1
let colorCycleTimer
let colorCycleIteration = 0
const colorCycleDuration = 200
const max = 239
const min = 150

// initial rgb values
let r = Math.floor(Math.random() * 241)
let g = Math.floor(Math.random() * 241)
let b = Math.floor(Math.random() * 241)
r = Math.max(r, min)
g = Math.max(g, min)
b = Math.max(b, min)
r = Math.min(r, max)
g = Math.min(g, max)
b = Math.min(b, max)

// random intervals used to calculate the changing RGB values
let ri = Math.floor(Math.random() * 4)
let gi = Math.floor(Math.random() * 4)
let bi = Math.floor(Math.random() * 4)

export default {
  name: 'OutsideSpaceBackground',
  components: {
  },
  mounted () {
    this.start()
  },
  beforeUnmount () {
    this.cancel()
  },
  computed: {
    spaceZoomDecimal () { return this.$store.getters.spaceZoomDecimal },
    outsideSpaceBackgroundIsStatic () { return this.$store.state.currentUser.outsideSpaceBackgroundIsStatic },
    styles () {
      return {
        backgroundColor: this.$store.state.outsideSpaceBackgroundColor
      }
    }
  },
  methods: {
    updateBackgroundColor () {
      if (r > max || r < min) {
        ri = ri * -1
      }
      if (g > max || g < min) {
        gi = gi * -1
      }
      if (b > max || b < min) {
        bi = bi * -1
      }
      r += ri
      g += gi
      b += bi
      let backgroundColor = `rgb(${r}, ${g}, ${b})`
      if (this.outsideSpaceBackgroundIsStatic) {
        backgroundColor = utils.cssVariable('secondary-active-background')
      }
      this.$store.commit('outsideSpaceBackgroundColor', backgroundColor)
      this.updateMetaThemeColor(backgroundColor)
    },
    cancel () {
      window.cancelAnimationFrame(colorCycleTimer)
      colorCycleTimer = undefined
      const color = this.$store.state.currentSpace.backgroundTint || null
      this.updateMetaThemeColor(color)
    },
    start () {
      this.updateBackgroundColor()
      colorCycleIteration = 0
      if (colorCycleTimer) { return }
      colorCycleTimer = window.requestAnimationFrame(this.colorCycleFrame)
    },
    shouldUpdate () {
      const result = colorCycleIteration / colorCycleDuration
      const resultLength = result.toString().length
      const resultIntLength = parseInt(result).toString().length
      return resultLength === resultIntLength
      // TODO update w more efficient modulo math
    },
    colorCycleFrame () {
      colorCycleIteration++
      if (this.shouldUpdate()) {
        this.updateBackgroundColor()
      }
      window.requestAnimationFrame(this.colorCycleFrame)
    },
    updateMetaThemeColor (color) {
      const metaThemeColor = document.querySelector('meta[name=theme-color]')
      metaThemeColor.setAttribute('content', color)
      postMessage.send({ name: 'setBackgroundColor', value: color })
    }
  }
}
</script>

<style lang="stylus">
.outside-space-background
  position fixed
  top 0
  left 0
  width 110%
  height 110%
  background-color var(--secondary-active-background)
</style>
