<template lang="pug">
canvas#inking.inking(
  @mousedown="startInking"
  @touchstart="startInkingAndLocking"
  @mousemove="inking"
  @touchmove="inking"
  @mouseup="stopInking"
  @touchend="stopInking"
  :width="width"
  :height="height"
)
</template>

<script>
import utils from '@/utils.js'

const circleSize = 20
const maxIterationsToInk = 200 // higher is longer ink fade time
const rateOfIterationDecay = 0.03 // higher is faster decay
const maxIterationsToLock = 24 // higher is slower locking speed
const initialLockCircleSize = 60 // higher is bigger
let canvas, context, currentUserColor, startCursor, currentCursor, inkingCirclesTimer, lockingAnimationTimer, currentUserIsLocking, lockingIterationFrame
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
    currentUserColor = this.$store.state.currentUser.color
    context.scale(window.devicePixelRatio, window.devicePixelRatio)
    this.updateCanvasSize()
    window.addEventListener('resize', this.updateCanvasSize)
    window.addEventListener('scroll', this.updateCanvasSize)
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
      // this.inkCircle(startCursor.x, startCursor.y, currentUserColor, 1)
      if (!inkingCirclesTimer) {
        inkingCirclesTimer = window.requestAnimationFrame(this.inkCirclesAnimationFrame)
      }
      this.$store.commit('currentUserIsInking', true)
      this.$store.commit('multipleBlocksSelected', [])
      this.$store.commit('generateBlockMap')
      this.$store.commit('closeAllPopOvers')
    },

    startInkingAndLocking (event) {
      this.startInking(event)
      currentCursor = utils.cursorPositionInPage(event)
      currentUserIsLocking = true
      lockingIterationFrame = 1
      lockingAnimationTimer = window.requestAnimationFrame(this.lockingAnimationFrame)
    },

    lockingAnimationFrame () {
      if (!utils.cursorsAreClose(startCursor, currentCursor)) {
        currentUserIsLocking = false
      }
      if (currentUserIsLocking) {
        const currentFrame = Math.min(lockingIterationFrame++, maxIterationsToLock)
        const exponentialDecay = this.exponentialDecay(currentFrame)
        const radius = initialLockCircleSize * exponentialDecay
        context.beginPath()
        context.arc(startCursor.x, startCursor.y, radius, 0, 2 * Math.PI)
        context.closePath()
        context.globalAlpha = currentFrame / maxIterationsToLock
        context.fillStyle = currentUserColor
        context.fill()
        window.requestAnimationFrame(this.lockingAnimationFrame)
      }
      if (lockingIterationFrame >= maxIterationsToLock) {
        window.cancelAnimationFrame(lockingAnimationTimer)
        this.$store.commit('currentUserIsInkingLocked', true)
        console.log('🔒lockingAnimationFrame locked')
      }
    },

    inking (event) {
      currentCursor = utils.cursorPositionInPage(event)
      if (!this.$store.state.currentUserIsInking) { return }
      const x = currentCursor.x
      const y = currentCursor.y
      let color = this.$store.state.currentUser.color
      let circle = { x, y, color, iteration: 0 }
      this.$store.dispatch('broadcast/inking', circle)
      this.selectBlocks(circle)
      circles.push(circle)
    },

    inkCirclesAnimationFrame () {
      this.filterCircles()
      this.clearCanvas()
      circles.forEach(item => {
        item.iteration++
        let circle = JSON.parse(JSON.stringify(item))
        this.inkCircle(circle)
      })
      window.requestAnimationFrame(this.inkCirclesAnimationFrame)
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
      if (circles.length === 0) {
        window.cancelAnimationFrame(inkingCirclesTimer)
      }
    },

    clearCanvas () {
      context.clearRect(0, 0, this.width, this.height)
    },

    stopInking () {
      console.log('stopInking')
      currentUserIsLocking = false
      window.cancelAnimationFrame(lockingAnimationTimer)
      this.$store.commit('currentUserIsInkingLocked', false)

      const endCursor = utils.cursorPositionInPage(event)
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
    }

  }
}
</script>

<style lang="stylus">
.inking,
.locking
  position absolute
  top 0
.locking
  pointer-events none
</style>
