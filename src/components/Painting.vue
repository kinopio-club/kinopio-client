<template lang="pug">
  canvas#painting.painting(
    @mousedown="startPainting"
    @touchstart="startPainting"
    @mouseup="stopPainting"
    @touchend="stopPainting"
    @mousemove="paint"
    @touchmove="paint"
  )
</template>

<script>
export default {
  name: 'Painting',
  data () {
    return {
      size: 20,
      maxCircles: 50,
      canvas: undefined,
      context: undefined,
      isPainting: false,
      circles: []
    }
  },
  mounted () {
    this.canvas = document.getElementById('painting')
    this.context = this.canvas.getContext('2d')
    this.context.scale(window.devicePixelRatio, window.devicePixelRatio)
    this.updateCanvasSize()
    window.addEventListener('resize', this.updateCanvasSize)
    setInterval(this.paintCirclesPerFrame, 16) // 16ms ~= 60fps
  },
  methods: {
    updateCanvasSize () {
      this.canvas.width = window.innerWidth
      this.canvas.height = window.innerHeight
      this.context.clearRect(0, 0, window.innerWidth, window.innerHeight)
    },
    startPainting (event) {
      this.isPainting = true
      this.paint(event)
    },
    stopPainting () {
      this.isPainting = false
    },
    paint (event) {
      if (!this.isPainting) { return }
      let x, y
      if (event.touches) {
        x = event.touches[0].clientX
        y = event.touches[0].clientY
      } else {
        x = event.clientX
        y = event.clientY
      }
      let color = this.$store.state.currentUser().color
      let paintCircle = { x, y, color, iteration: 1 }
      this.$store.dispatch('broadcast/paint', paintCircle)

      this.circles.push(paintCircle)
      this.addPaintCircle(paintCircle)
    },
    addPaintCircle (paintCircle) {
      const { x, y, color, iteration } = paintCircle
      this.context.beginPath()
      this.context.arc(x, y, this.size, 0, 2 * Math.PI)
      this.context.closePath()
      this.context.globalAlpha = 1 / iteration
      this.context.fillStyle = color
      console.log(1 / iteration)
      this.context.fill()
    },
    paintCirclesPerFrame () {
      this.circles = this.circles.filter(circle => circle.iteration < this.maxCircles)
      this.context.clearRect(0, 0, window.innerWidth, window.innerHeight)

      this.circles.forEach(circle => {
        circle.iteration++
        let paintCircle = JSON.parse(JSON.stringify(circle))
        this.addPaintCircle(paintCircle)
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
