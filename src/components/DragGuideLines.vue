<template lang="pug">
aside
  canvas#drag-guide-line.drag-guide-line
  //- .y(v-if="yIsVisible" :style="yStyles")
</template>

<script>
let canvas, context, paintingGuidesTimer

const lineWidth = 100
const lineMaxHeight = 25
let controlPointEvenY = lineMaxHeight / 2
let controlPointOddY = lineMaxHeight / 2
const centerLineY = lineMaxHeight / 2
let isReverse = false

export default {
  name: 'DragGuideLines',
  props: {
    currentCursor: Object
  },
  // created () {
  //   this.$store.subscribe((mutation, state) => {
  //   })
  // },
  mounted () {
    canvas = document.getElementById('drag-guide-line')
    context = canvas.getContext('2d')
    this.updateCanvasSize()
    window.addEventListener('load', this.updateCanvasSize)
    window.addEventListener('resize', this.updateCanvasSize)
  },
  beforeUnmount () {
    window.removeEventListener('load', this.updateCanvasSize)
    window.removeEventListener('resize', this.updateCanvasSize)
  },

  computed: {
    viewportWidth () { return this.$store.state.viewportWidth },
    viewportHeight () { return this.$store.state.viewportHeight },
    currentUserColor () { return this.$store.state.currentUser.color }
  },
  methods: {

    // Painting

    paintGuides () {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.strokeStyle = this.currentUserColor
      context.lineWidth = 4
      context.lineCap = 'round'

      const numberOfControlPoints = 4
      const lineSegmentLength = lineWidth / numberOfControlPoints
      const lineSegmentIncrement = (lineSegmentLength / 2)
      const currentCursor = {
        x: this.currentCursor.x,
        y: this.currentCursor.y
      }

      if (controlPointEvenY <= lineMaxHeight && controlPointOddY >= 0 && !isReverse) {
        if (controlPointEvenY <= 0) {
          controlPointEvenY = 0
          isReverse = true
        }
        controlPointEvenY--
        controlPointOddY++
      } else {
        controlPointEvenY++
        controlPointOddY--
        if (controlPointEvenY >= lineMaxHeight) {
          controlPointEvenY = lineMaxHeight
          isReverse = false
        }
      }

      // 0
      const startPointX = currentCursor.x
      const startPointY = currentCursor.y
      // 1
      const controlPointX1 = startPointX + lineSegmentIncrement
      const endPointX1 = startPointX + lineSegmentLength
      // 2
      const controlPointX2 = endPointX1 + lineSegmentIncrement
      const endPointX2 = startPointX + (lineSegmentLength * 2)
      // 3
      const controlPointX3 = endPointX2 + lineSegmentIncrement
      const endPointX3 = startPointX + (lineSegmentLength * 3)
      // 4
      const controlPointX4 = endPointX3 + lineSegmentIncrement
      const endPointX4 = startPointX + (lineSegmentLength * 4)
      // 5
      const endPointY = startPointY + centerLineY

      context.beginPath()
      context.moveTo(startPointX, startPointY)
      // quadraticCurveTo(controlPointX, controlPointY, endPointX, endPointY)
      context.quadraticCurveTo(controlPointX1, controlPointOddY + startPointY, endPointX1, endPointY)
      context.quadraticCurveTo(controlPointX2, controlPointEvenY + startPointY, endPointX2, endPointY)
      context.quadraticCurveTo(controlPointX3, controlPointOddY + startPointY, endPointX3, endPointY)
      context.quadraticCurveTo(controlPointX4, controlPointEvenY + startPointY, endPointX4, endPointY)
      context.stroke()

      if (paintingGuidesTimer) {
        window.requestAnimationFrame(this.paintGuides)
      } else {
        this.stopPaintingGuides()
      }
    },
    startPaintingGuides () {
      if (!paintingGuidesTimer) {
        paintingGuidesTimer = window.requestAnimationFrame(this.paintGuides)
      }
    },
    stopPaintingGuides () {
      window.cancelAnimationFrame(paintingGuidesTimer)
      paintingGuidesTimer = undefined
      context.clearRect(0, 0, canvas.width, canvas.height)
    },

    updateCanvasSize () {
      canvas.width = this.viewportWidth * window.devicePixelRatio
      canvas.height = this.viewportHeight * window.devicePixelRatio
      canvas.style.width = this.viewportWidth + 'px'
      canvas.style.height = this.viewportHeight + 'px'
      context.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

  }
}
</script>

<style lang="stylus" scoped>
canvas
  position fixed
  top 0
.drag-guide-line
  pointer-events none

// .drag-guide-line
//   position absolute
//   .y
//     top 50px
//     bottom 50px
//     border-left 1px solid var(--primary)
//     left 50px
//     width 1px
</style>
