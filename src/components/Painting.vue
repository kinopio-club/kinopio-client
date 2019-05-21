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
      initialSize: 25,
      maxSize: 50,
      consecutiveSizeMultiplier: 0.05,
      consecutivePaints: 1,
      canvas: undefined,
      context: undefined
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
    startPainting () {
      this.$store.state.isPainting = true
      this.paint(event)
    },
    stopPainting () {
      this.$store.state.isPainting = false
      this.consecutivePaints = 1
    },
    paint (event) {
      if (!this.$store.state.isPainting) { return }
      let x, y
      if (event.touches) {
        x = event.touches[0].clientX
        y = event.touches[0].clientY
      } else {
        x = event.clientX
        y = event.clientY
      }
      let size = Math.round(this.initialSize * (this.consecutivePaints * this.consecutiveSizeMultiplier))
      let color = this.$store.state.currentUser().color
      console.log('PAINT', x, y, size, color)
      this.addPaintCircle(x, y, size, color)
      // ADD: send to broadcast event
      this.consecutivePaints++
    },
    addPaintCircle (x, y, size, color) {
      size = Math.max(size || this.maxSize)
    }
  }
}
</script>

<style lang="stylus">
.painting
  background-color pink
</style>
