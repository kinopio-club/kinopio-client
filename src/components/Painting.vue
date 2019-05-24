<template lang="pug">
canvas#painting.painting(
  @mousedown="startPainting"
  @touchstart="startPainting"
  @mouseup="stopPainting"
  @touchend="stopPainting"
  @mousemove="paint"
  @touchmove="paint"
  :width="width"
  :height="height"
)
</template>

<script>
const circleSize = 20
const maxIterationsToPaint = 200 // higher is longer paint fade time
const rateOfIterationDecay = 0.03 // lower is slower decay
let circles = []

export default {
  name: 'Painting',
  data () {
    return {
      canvas: undefined,
      context: undefined,
      height: 0,
      width: 0
    }
  },
  mounted () {
    this.canvas = document.getElementById('painting')
    this.context = this.canvas.getContext('2d')
    this.context.scale(window.devicePixelRatio, window.devicePixelRatio)
    this.updateCanvasSize()
    window.addEventListener('resize', this.updateCanvasSize)
    window.addEventListener('scroll', this.updateCanvasSize)
    setInterval(this.paintCirclesPerFrame, 16) // 16ms ~= 60fps
  },
  methods: {
    updateCanvasSize () {
      const body = document.body
      const html = document.documentElement
      this.width = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth)
      this.height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
    },
    startPainting (event) {
      this.$store.commit('currentUserIsPainting', true)
    },
    stopPainting () {
      this.$store.commit('currentUserIsPainting', false)
    },
    paint (event) {
      if (!this.$store.state.currentUserIsPainting) { return }
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
      this.$store.dispatch('broadcast/painting', circle)
      circles.push(circle)
    },
    exponentialDecay (iteration) {
      return Math.exp(-(rateOfIterationDecay * iteration))
    },
    paintCircle (circle) {
      const { x, y, color, iteration } = circle
      this.context.beginPath()
      this.context.arc(x, y, circleSize, 0, 2 * Math.PI)
      this.context.closePath()
      this.context.globalAlpha = this.exponentialDecay(iteration)
      this.context.fillStyle = color
      this.context.fill()
    },
    filterCircles () {
      circles = circles.filter(circle => circle.iteration < maxIterationsToPaint)
    },
    clearCanvas () {
      this.context.clearRect(0, 0, this.width, this.height)
    },
    paintCirclesPerFrame () {
      this.filterCircles()
      this.clearCanvas()
      circles.forEach(item => {
        item.iteration++
        let circle = JSON.parse(JSON.stringify(item))
        this.paintCircle(circle)
      })
    }
  }
}
</script>

<style lang="stylus">
.painting
  position absolute
  top 0
</style>
