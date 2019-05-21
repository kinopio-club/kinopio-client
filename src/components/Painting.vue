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
      consecutivePaints: 1,
      canvas: undefined,
      context: undefined,
      isPainting: false
    }
  },
  mounted () {
    this.canvas = document.getElementById('painting')
    this.context = this.canvas.getContext('2d')
    this.context.scale(window.devicePixelRatio, window.devicePixelRatio)
    this.updateCanvasSize()
    window.addEventListener('resize', this.updateCanvasSize)
  },
  methods: {
    updateCanvasSize () {
      this.canvas.width = window.innerWidth
      this.canvas.height = window.innerHeight
      this.context.clearRect(0, 0, window.innerWidth, window.innerHeight)
    },
    startPainting (event) {
      console.log(event)
      this.isPainting = true
      this.paint(event)
    },
    stopPainting () {
      this.isPainting = false
      this.consecutivePaints = 1
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
      this.$store.dispatch('broadcast/paint', {
        x, y, color
      })
      this.addPaintCircle(x, y, color)
      this.consecutivePaints++
    },

    addPaintCircle (x, y, color) {
      console.log('PAINT', x, y, color)
      this.context.beginPath()
      this.context.arc(x, y, this.size, 0, 2 * Math.PI)
      this.context.closePath()
      this.context.fillStyle = color
      this.context.fill()
    }
  }
}
</script>

<style lang="stylus">
.painting
  position absolute
  top 0
</style>
