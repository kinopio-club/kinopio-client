<template lang="pug">
canvas#drop-guides.drop-guides(
  :width="width"
  :height="height"
)
</template>
<script>
// import times from 'lodash-es/times'

let canvas, context, paintingGuidesTimer

export default {
  name: 'DropGuides',
  props: {
    currentCursor: Object,
    width: Number,
    height: Number,
    uploadIsDraggedOver: Boolean,
    filesCount: Number // chrome, firefox
  },
  mounted () {
    canvas = document.getElementById('drop-guides')
    context = canvas.getContext('2d')
  },
  methods: {
    startPaintingGuides () {
      if (!paintingGuidesTimer) {
        paintingGuidesTimer = window.requestAnimationFrame(this.paintGuides)
      }
    },
    paintGuides () {
      console.log('🌸 paintDropGuides', this.filesCount) // at currentCursor.x,y
      // filesCount is 0(always falsey)for safari, accurate (1+ for others)
      console.log(canvas, context) // temp
      if (paintingGuidesTimer) {
        window.requestAnimationFrame(this.paintGuides)
      }
    },
    stopPaintingGuides () {
      window.cancelAnimationFrame(paintingGuidesTimer)
      paintingGuidesTimer = undefined
    }
  },
  watch: {
    // currentCursor (value) {
    //   console.log('🍡', this.filesCount)
    // console.log('------')
    // for(let i=0; i < this.filesCount; i++){
    //   console.log('🌸', i)
    // }
    // console.log('------')

    // const count = times(this.filesCount)
    // count.forEach(index => {
    //   console.log('🌹')
    // })
    //   console.log('------')
    // },
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
