<template lang="pug">
  p connections
</template>

<script>
export default {
  name: 'Connections',
  data () {
    return {
      circleSize: 20
    }
  },
  mounted () {
    // this.canvas = document.getElementById('painting')
    // this.context = this.canvas.getContext('2d')
    // this.context.scale(window.devicePixelRatio, window.devicePixelRatio)
    // this.updateCanvasSize()
    // window.addEventListener('resize', this.updateCanvasSize)
    // setInterval(this.paintCirclesPerFrame, 16) // 16ms ~= 60fps
  },
  methods: {
    // updateCanvasSize () {
    //   this.canvas.width = window.innerWidth
    //   this.canvas.height = window.innerHeight
    // },
    // startPainting (event) {
    //   this.isPainting = true
    //   this.paint(event)
    // },
    // stopPainting () {
    //   this.isPainting = false
    // },
    // paint (event) {
    //   if (!this.isPainting) { return }
    //   let x, y
    //   if (event.touches) {
    //     x = event.touches[0].clientX
    //     y = event.touches[0].clientY
    //   } else {
    //     x = event.clientX
    //     y = event.clientY
    //   }
    //   let color = this.$store.state.currentUser().color
    //   let circle = { x, y, color, iteration: 0 }
    //   this.$store.dispatch('broadcast/paint', circle)
    //   this.circles.push(circle)
    // },
    // exponentialDecay (iteration) {
    //   return Math.exp(-(this.rateOfIterationDecay * iteration))
    // },
    // paintCircle (circle) {
    //   const { x, y, color, iteration } = circle
    //   this.context.beginPath()
    //   this.context.arc(x, y, this.circleSize, 0, 2 * Math.PI)
    //   this.context.closePath()
    //   this.context.globalAlpha = this.exponentialDecay(iteration)
    //   this.context.fillStyle = color
    //   this.context.fill()
    // },
    // filterCircles () {
    //   this.circles = this.circles.filter(circle => circle.iteration < this.maxIterationsToPaint)
    // },
    // clearCanvas () {
    //   this.context.clearRect(0, 0, window.innerWidth, window.innerHeight)
    // },
    // paintCirclesPerFrame () {
    //   this.filterCircles()
    //   this.clearCanvas()
    //   this.circles.forEach(item => {
    //     item.iteration++
    //     let circle = JSON.parse(JSON.stringify(item))
    //     this.paintCircle(circle)
    //   })
    // }
  }
}
</script>

<style lang="stylus">
.painting
  position absolute
  top 0
</style>
