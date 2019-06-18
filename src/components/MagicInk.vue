<template lang="pug">
canvas#inking.inking(
  @mousedown="startInking"
  @touchstart="startInking"
  @mouseup="stopInking"
  @touchend="stopInking"
  @mousemove="ink"
  @touchmove="ink"
  :width="width"
  :height="height"
)
</template>

<script>
import utils from '@/utils.js'

const circleSize = 20
const maxIterationsToInk = 200 // higher is longer ink fade time
const rateOfIterationDecay = 0.03 // lower is slower decay
let canvas, context, startCursor, endCursor
let circles = []

export default {
  data () {
    return {
      height: 0,
      width: 0
    }
  },
  mounted () {
    canvas = document.getElementById('inking')
    context = canvas.getContext('2d')
    context.scale(window.devicePixelRatio, window.devicePixelRatio)
    this.updateCanvasSize()
    window.addEventListener('resize', this.updateCanvasSize)
    window.addEventListener('scroll', this.updateCanvasSize)
    window.requestAnimationFrame(this.inkCirclesPerFrame)
  },
  methods: {
    updateCanvasSize () {
      const body = document.body
      const html = document.documentElement
      this.width = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth)
      this.height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
    },

    startInking (event) {
      startCursor = utils.cursorPositionInPage(event)
      this.$store.commit('currentUserIsInking', true)
      this.$store.commit('multipleBlocksSelected', [])
      this.$store.commit('generateBlockMap')
      this.$store.commit('closeAllPopOvers')
    },

    stopInking () {
      endCursor = utils.cursorPositionInPage(event)
      this.$store.commit('currentUserIsInking', false)
      this.$store.commit('closeAllPopOvers')
      if (this.$store.state.multipleBlocksSelected.length) {
        this.$store.commit('multipleBlockActionsPosition', endCursor)
        this.$store.commit('multipleBlockActionsIsVisible', true)
      }
      if (utils.cursorsAreClose(startCursor, endCursor)) {
        console.log('🌸🌸 showNewBlockDetailsPop')
      }
    },

    selectBlocks (circle) {
      this.$store.state.blockMap.map(block => {
        const x = {
          value: circle.x,
          min: block.x,
          max: block.x + block.width
        }
        const y = {
          value: circle.y,
          min: block.y,
          max: block.y + block.height
        }
        const isBetweenX = utils.between(x)
        const isBetweenY = utils.between(y)
        if (isBetweenX && isBetweenY) {
          this.$store.commit('addToMultipleBlocksSelected', block.blockId)
        }
      })
    },

    ink (event) {
      if (!this.$store.state.currentUserIsInking) { return }
      let x, y
      if (event.touches) {
        x = event.touches[0].pageX
        y = event.touches[0].pageY
      } else {
        x = event.pageX
        y = event.pageY
      }
      let color = this.$store.state.currentUser.color
      let circle = { x, y, color, iteration: 0 }
      this.$store.dispatch('broadcast/inking', circle)
      this.selectBlocks(circle)
      circles.push(circle)
    },

    inkCirclesPerFrame () {
      this.filterCircles()
      this.clearCanvas()
      circles.forEach(item => {
        item.iteration++
        let circle = JSON.parse(JSON.stringify(item))
        this.inkCircle(circle)
      })
      window.requestAnimationFrame(this.inkCirclesPerFrame)
    },

    exponentialDecay (iteration) {
      return Math.exp(-(rateOfIterationDecay * iteration))
    },

    inkCircle (circle) {
      const { x, y, color, iteration } = circle
      context.beginPath()
      context.arc(x, y, circleSize, 0, 2 * Math.PI)
      context.closePath()
      context.globalAlpha = this.exponentialDecay(iteration)
      context.fillStyle = color
      context.fill()
    },

    filterCircles () {
      circles = circles.filter(circle => circle.iteration < maxIterationsToInk)
      // if (circles.length === 0) {
      //   window.clearInterval(inkTimer)
      // }
    },

    clearCanvas () {
      context.clearRect(0, 0, this.width, this.height)
    }

  }
}
</script>

<style lang="stylus">
.inking
  position absolute
  top 0
</style>
