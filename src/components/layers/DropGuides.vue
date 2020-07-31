<template lang="pug">
canvas#drop-guides.drop-guides(
  :width="width"
  :height="height"
)
</template>
<script>
// import times from 'lodash-es/times'

let canvas, context, paintingGuidesTimer

let curveHeight = 250
let goUndergroup = 250
let reverse = false

export default {
  name: 'DropGuides',
  props: {
    width: Number,
    height: Number,
    currentCursor: Object,
    uploadIsDraggedOver: Boolean
  },
  mounted () {
    canvas = document.getElementById('drop-guides')
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
      console.log('🌸 paintGuides', this.currentCursor)

      // sine curve adapted from https://codepen.io/nzamarreno/pen/yXzGgG?editors=0010

      if (curveHeight <= 500 && goUndergroup >= 0 && !reverse) {
        if (curveHeight === 0) {
          reverse = true
        }

        curveHeight--
        goUndergroup++
      } else {
        curveHeight++
        goUndergroup--

        if (curveHeight === 500) {
          reverse = false
        }
      }

      context.clearRect(0, 0, canvas.width, canvas.height)
      context.strokeStyle = this.currentUserColor
      context.lineWidth = 3
      context.beginPath()
      context.moveTo(0, 250)
      context.quadraticCurveTo(100, curveHeight, 200, 250)
      context.quadraticCurveTo(300, goUndergroup, 400, 250)
      context.quadraticCurveTo(500, curveHeight, 600, 250)
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
.drop-guides
  pointer-events none
</style>
