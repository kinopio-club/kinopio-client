<template lang="pug">
canvas#drop-guide-line.drop-guide-line(
  :width="viewportWidth"
  :height="viewportHeight"
)
</template>
<script>
let canvas, context, paintingGuidesTimer

const lineWidth = 100 / window.devicePixelRatio
const lineMaxHeight = 25
let controlPointEvenY = lineMaxHeight / 2
let controlPointOddY = lineMaxHeight / 2
const centerLineY = lineMaxHeight / 2
let isReverse = false

export default {
  name: 'DropGuides',
  props: {
    currentCursor: Object,
    uploadIsDraggedOver: Boolean
  },
  data () {
    return {
      retinaWidth: 0,
      retinaHeight: 0
    }
  },
  mounted () {
    canvas = document.getElementById('drop-guide-line')
    context = canvas.getContext('2d')
    this.updateCanvasSize()
    window.addEventListener('load', this.updateCanvasSize)
    window.addEventListener('resize', this.updateCanvasSize)
  },
  computed: {
    viewportWidth () { return this.$store.state.viewportWidth },
    viewportHeight () { return this.$store.state.viewportHeight },
    currentUserColor () { return this.$store.state.currentUser.color }
  },
  methods: {
    paintGuides () {
      const numberOfControlPoints = 4
      const lineSegmentLength = lineWidth / numberOfControlPoints
      const lineSegmentIncrement = (lineSegmentLength / 2)
      const currentCursor = {
        x: this.currentCursor.x / window.devicePixelRatio,
        y: this.currentCursor.y / window.devicePixelRatio
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
      const endPointY = centerLineY + startPointY

      context.clearRect(0, 0, canvas.width, canvas.height)
      context.strokeStyle = this.currentUserColor
      context.lineWidth = 4
      context.lineCap = 'round'

      // context.shadowOffsetY = 3
      // context.shadowColor = 'rgba(0,0,0,0.20)' // "orange" //  rgba(0,0,0,0.20)

      context.beginPath()
      context.moveTo(startPointX, startPointY)
      // quadraticCurveTo(controlPointX, controlPointY, endPointX, endPointY)
      context.quadraticCurveTo(controlPointX1, controlPointOddY, endPointX1, endPointY)
      context.quadraticCurveTo(controlPointX2, controlPointEvenY, endPointX2, endPointY)
      context.quadraticCurveTo(controlPointX3, controlPointOddY, endPointX3, endPointY)
      context.quadraticCurveTo(controlPointX4, controlPointEvenY, endPointX4, endPointY)
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
      context.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
  },
  watch: {
    uploadIsDraggedOver (value) {
      if (value) {
        this.startPaintingGuides()
      } else {
        console.log('☔️ remove guides')
        this.stopPaintingGuides()
      }
    }
  }
}
</script>
<style lang="stylus" scoped>
.drop-guide-line
  pointer-events none
</style>
