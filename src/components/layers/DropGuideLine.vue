<template lang="pug">
canvas#drop-guide-line.drop-guide-line(
  :width="width"
  :height="height"
)
</template>
<script>
// import times from 'lodash-es/times'

let canvas, context, paintingGuidesTimer

let lineWidth = 100
let lineMaxHeight = 100
let controlPointEvenY = lineMaxHeight / 2
let controlPointOddY = lineMaxHeight / 2
let isReverse = false

export default {
  name: 'DropGuides',
  props: {
    width: Number,
    height: Number,
    currentCursor: Object,
    uploadIsDraggedOver: Boolean
  },
  mounted () {
    canvas = document.getElementById('drop-guide-line')
    context = canvas.getContext('2d')
  },
  computed: {
    currentUserColor () { return this.$store.state.currentUser.color }
  },
  methods: {
    startPaintingGuides () {
      if (!paintingGuidesTimer) {
        paintingGuidesTimer = window.requestAnimationFrame(this.paintGuides)
      }
    },
    paintGuides () {
      // console.log('🌸 paintGuides', this.currentCursor)

      const centerLineY = lineMaxHeight / 2 // todo should be currentcursor.y
      const numberOfControlPoints = 4
      const lineSegmentLength = lineWidth / numberOfControlPoints
      const lineSegmentIncrement = lineSegmentLength / 2

      if (controlPointEvenY <= lineMaxHeight && controlPointOddY >= 0 && !isReverse) {
        if (controlPointEvenY <= 0) {
          isReverse = true
        }
        controlPointEvenY--
        controlPointOddY++
      } else {
        controlPointEvenY++
        controlPointOddY--

        if (controlPointEvenY >= lineMaxHeight) {
          isReverse = false
        }
      }

      let startPointX = 0 // temp

      const controlPointX1 = startPointX + lineSegmentIncrement
      const endPointX1 = startPointX + lineSegmentLength

      const controlPointX2 = endPointX1 + lineSegmentIncrement
      const endPointX2 = startPointX + (lineSegmentLength * 2)

      const controlPointX3 = endPointX2 + lineSegmentIncrement
      const endPointX3 = startPointX + (lineSegmentLength * 3)

      const controlPointX4 = endPointX3 + lineSegmentIncrement

      // const controlPointX2 = endPointX2 + lineSegmentIncrement
      // const endPointX3 = startPointX + (lineSegmentLength * 3)
      // const controlPointX3 = endPointX3 + lineSegmentIncrement
      // const endPointX4 = startPointX + (lineSegmentLength * 4)
      // const controlPointX4 = endPointX4 + lineSegmentIncrement

      context.clearRect(0, 0, canvas.width, canvas.height)
      context.strokeStyle = this.currentUserColor
      context.lineWidth = 3
      context.beginPath()

      context.moveTo(startPointX, centerLineY)

      // quadraticCurveTo(controlPointX, controlPointY, endPointX, endPointY)
      context.quadraticCurveTo(controlPointX1, controlPointEvenY, endPointX1, centerLineY)
      context.quadraticCurveTo(controlPointX2, controlPointOddY, endPointX2, centerLineY)
      context.quadraticCurveTo(controlPointX3, controlPointEvenY, endPointX3, centerLineY)
      context.quadraticCurveTo(controlPointX4, controlPointOddY, lineWidth, centerLineY)

      context.stroke()

      if (paintingGuidesTimer) {
        window.requestAnimationFrame(this.paintGuides)
      } else {
        this.stopPaintingGuides()
      }
    },
    stopPaintingGuides () {
      window.cancelAnimationFrame(paintingGuidesTimer)
      paintingGuidesTimer = undefined
      context.clearRect(0, 0, canvas.width, canvas.height)
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
