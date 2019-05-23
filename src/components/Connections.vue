<template lang="pug">
  svg.connections(
    @mousemove="drawConnection"
    @touchmove="drawConnection"
  )
    // Manipulating the first and last sets of values, M20,50 and 100,50, impacts the positioning of the beginning and end points of the curve. The center set of values, Q40,5, define the control point for the curve, establishing its shape.
    // d = first two x,y = start point
    // last two x,y = end point (but halved?)
    path.id1(fill="none" stroke="#333333" stroke-width="3" d="m10,10 q90,40 200,10")

    path.id2(fill="none" stroke="#333333" stroke-width="3" d="M100,100 q90,40 200,400") // second point is relative to the first - not absolute x,y of end point
</template>

<script>
export default {
  name: 'Connections',
  data () {
    return {
      svg: undefined
    }
  },
  mounted () {
    // this.connections = document.getElementById('connections')
    // this.context = this.canvas.getContext('2d')
    // this.context.scale(window.devicePixelRatio, window.devicePixelRatio)
    // this.updateCanvasSize()
    // window.addEventListener('resize', this.updateCanvasSize)
    // setInterval(this.paintCirclesPerFrame, 16) // 16ms ~= 60fps
  },
  methods: {
    // updateCanvasSize () { //
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
    drawConnection (event) {
      console.log('hi')
      // if (this.$store.state.isConnecting) { return }
      // let x, y
      // if (event.touches) {
      //   x = event.touches[0].clientX
      //   y = event.touches[0].clientY
      // } else {
      //   x = event.clientX
      //   y = event.clientY
      // }
      // let color = this.$store.state.currentUser().color
      // let circle = { x, y, color, iteration: 0 }
      // this.$store.dispatch('broadcast/paint', circle)
      // this.circles.push(circle)
    }

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
svg
  position absolute
  top 0
  left 0
  width 100%
  height 100vh
path
  pointer-events all
  cursor pointer
</style>
