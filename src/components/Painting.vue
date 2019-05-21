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
      initialBrushSize: 25,
      maxBrushSize: 20,
      consecutiveBrushSizeMultiplier: 0.05,
      canvas: undefined,
      context: undefined,
      isPainting: false
    }
  },
  mounted () {
    this.canvas = document.getElementById('painting')
    this.context = this.canvas.getContext('2d')
    this.updateCanvasSize()
    window.addEventListener('resize', this.updateCanvasSize)
  },
  methods: {
    updateCanvasSize () {
      this.canvas.width = window.innerWidth
      this.canvas.height = window.innerHeight
      this.context.clearRect(0, 0, window.innerWidth, window.innerHeight)
      console.log('UPDATE SIZE 🌹', this.canvas, this.context)
    },
    startPainting () {
      this.isPainting = true
      this.paint(event)
      console.log('💐 START', event)
    },
    stopPainting () {
      this.isPainting = false
      console.log('🛑 STOP', event)
    },
    paint (event) {
      if (this.isPainting) {
        console.log('- PAINT', event)
      }
    }
  }
}
</script>

<style lang="stylus">
.painting
  background-color pink
</style>
