<template lang="pug">
canvas#inking.inking(
  @mousedown="startInking"
  @touchstart="startInking"
  @mouseup="stopInking"
  @touchend="stopInking"
  @mousemove="ink"
  @touchmove="ink"
  @click="showNewBlockDetailsPop"
  :width="width"
  :height="height"
)
</template>

<script>
const circleSize = 20
const maxIterationsToInk = 200 // higher is longer ink fade time
const rateOfIterationDecay = 0.03 // lower is slower decay
let canvas, context, inkTimer
let circles = []

export default {
  data () {
    return {
      height: 0,
      width: 0
    }
  },
  mounted () {
    canvas = document.getElementById('inking')
    context = canvas.getContext('2d')
    context.scale(window.devicePixelRatio, window.devicePixelRatio)
    this.updateCanvasSize()
    window.addEventListener('resize', this.updateCanvasSize)
    window.addEventListener('scroll', this.updateCanvasSize)
  },
  methods: {
    updateCanvasSize () {
      const body = document.body
      const html = document.documentElement
      this.width = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth)
      this.height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
    },

    startInking (event) {
      this.$store.commit('currentUserIsInking', true)
      inkTimer = setInterval(this.inkCirclesPerFrame, 16) // 16ms ~= 60fps
    },

    stopInking () {
      this.$store.commit('currentUserIsInking', false)
    },

    ink (event) {
      if (!this.$store.state.currentUserIsInking) { return }
      let x, y
      if (event.touches) {
        x = event.touches[0].pageX
        y = event.touches[0].pageY
      } else {
        x = event.pageX
        y = event.pageY
      }
      let color = this.$store.state.currentUser.color
      let circle = { x, y, color, iteration: 0 }
      this.$store.dispatch('broadcast/inking', circle)
      circles.push(circle)
    },

    inkCirclesPerFrame () {
      this.filterCircles()
      this.clearCanvas()
      circles.forEach(item => {
        item.iteration++
        let circle = JSON.parse(JSON.stringify(item))
        this.inkCircle(circle)
      })
    },

    exponentialDecay (iteration) {
      return Math.exp(-(rateOfIterationDecay * iteration))
    },

    inkCircle (circle) {
      const { x, y, color, iteration } = circle
      context.beginPath()
      context.arc(x, y, circleSize, 0, 2 * Math.PI)
      context.closePath()
      context.globalAlpha = this.exponentialDecay(iteration)
      context.fillStyle = color
      context.fill()
    },

    filterCircles () {
      circles = circles.filter(circle => circle.iteration < maxIterationsToInk)
      if (circles.length === 0) {
        clearInterval(inkTimer)
      }
    },

    clearCanvas () {
      context.clearRect(0, 0, this.width, this.height)
    },

    showNewBlockDetailsPop () {
      this.$store.commit('closeAllPopOvers')
      if (this.$store.state.currentUserIsInking) {
        this.$store.commit('currentUserIsInking', false)
        return
      }
      // only create new blocks if router-view is Space
      console.log('🌸🌸 showNewBlockDetailsPop')
    }
  }
}
</script>

<style lang="stylus">
.inking
  position absolute
  top 0
</style>
