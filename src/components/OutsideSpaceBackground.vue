<template lang="pug">
.outside-space-background(:style="styles")
</template>

<script>
// adapted from https://gist.github.com/pketh/3f62b807db3835d564c1
let colorCycleTimer
let colorCycleIteration = 0
const colorCycleDuration = 10
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
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'spaceZoomPercent') {
        const zoom = mutation.payload
        if (zoom === 100) {
          this.cancel()
        } else {
          this.start()
        }
      }
    })
  },
  mounted () {
    this.start()
  },
  beforeUnmount () {
    this.cancel()
  },
  data () {
    return {
      backgroundColor: ''
    }
  },
  computed: {
    spaceZoomDecimal () { return this.$store.getters.spaceZoomDecimal },
    zoomIsInitial () { return this.spaceZoomDecimal === 1 },
    styles () {
      return {
        backgroundColor: this.backgroundColor
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
      this.backgroundColor = `rgb(${r}, ${g}, ${b})`
    },
    cancel () {
      window.cancelAnimationFrame(colorCycleTimer)
      colorCycleTimer = undefined
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
      if (this.zoomIsInitial) {
        this.cancel()
        return
      }
      colorCycleIteration++
      if (this.shouldUpdate()) {
        this.updateBackgroundColor()
      }
      window.requestAnimationFrame(this.colorCycleFrame)
    }
  }
}
</script>

<style lang="stylus">
.outside-space-background
  position absolute
  top 0
  left 0
  width 100%
  height 100%
  background-color var(--secondary-background)
</style>
