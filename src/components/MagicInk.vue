<template lang="pug">
// mousdedown: "startInking"
aside.magic-ink
  canvas#inking.inking(
    @mousedown="startInkingAndLocking"
    @touchstart="startInkingAndLocking"
    @mousemove="inking"
    @touchmove="inking"
    @mouseup="stopInking"
    @touchend="stopInking"
    :width="width"
    :height="height"
  )
  canvas#locking.locking(
    :width="width"
    :height="height"
  )
  //canvas#init.init
</template>

<script>
import utils from '@/utils.js'

const circleRadius = 20

// inking
const maxIterationsToInk = 200 // higher is longer ink fade time
const rateOfIterationDecay = 0.03 // higher is faster decay
let inkingCircles = []
let inkingCanvas, inkingContext, startCursor, currentCursor, inkingCirclesTimer

// locking
const lockingDuration = 250 // ms
const initialLockCircleRadius = 65
let lockingCanvas, lockingContext, lockingAnimationTimer, currentUserIsLocking, lockingStartTime

export default {
  data () {
    return {
      height: 0,
      width: 0
    }
  },
  mounted () {
    inkingCanvas = document.getElementById('inking')
    inkingContext = inkingCanvas.getContext('2d')
    inkingContext.scale(window.devicePixelRatio, window.devicePixelRatio)
    lockingCanvas = document.getElementById('locking')
    lockingContext = lockingCanvas.getContext('2d')
    lockingContext.scale(window.devicePixelRatio, window.devicePixelRatio)
    this.updateCanvasSize()
    window.addEventListener('resize', this.updateCanvasSize)
    window.addEventListener('scroll', this.updateCanvasSize)
  },
  computed: {
    currentUserColor () {
      return this.$store.state.currentUser.color
    }
  },
  methods: {
    updateCanvasSize () {
      const body = document.body
      const html = document.documentElement
      this.width = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth)
      this.height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
    },

    inkCircle (circle) {
      const { x, y, color, iteration } = circle
      inkingContext.beginPath()
      inkingContext.arc(x, y, circleRadius, 0, 2 * Math.PI)
      inkingContext.closePath()
      inkingContext.globalAlpha = utils.exponentialDecay(iteration, rateOfIterationDecay)
      inkingContext.fillStyle = color
      inkingContext.fill()
    },

    startInking (event) {
      startCursor = utils.cursorPositionInPage(event)
      this.inkCircle({
        x: startCursor.x,
        y: startCursor.y,
        color: this.currentUserColor,
        iteration: 1
      })
      this.$store.commit('currentUserIsInking', true)
      this.$store.commit('multipleBlocksSelected', [])
      this.$store.commit('generateBlockMap')
      this.$store.commit('closeAllPopOvers')
    },

    startInkingAndLocking (event) {
      this.startInking(event)
      currentCursor = utils.cursorPositionInPage(event)
      currentUserIsLocking = true
      lockingAnimationTimer = window.requestAnimationFrame(this.lockingAnimationFrame)
    },

    lockingAnimationFrame (timestamp) {
      if (!lockingStartTime) {
        lockingStartTime = timestamp
      }
      let progress = timestamp - lockingStartTime
      progress = (progress / lockingDuration) // a value between 0 and 1
      const minSize = circleRadius
      if (!utils.cursorsAreClose(startCursor, currentCursor)) {
        currentUserIsLocking = false
      }
      if (currentUserIsLocking && progress <= 1) {
        const progressInverted = Math.abs(progress - 1)
        const circleRadiusDelta = initialLockCircleRadius - minSize
        const radius = (circleRadiusDelta * progressInverted) + minSize

        // console.log('progress values', progress, radius, alpha)
        lockingContext.clearRect(0, 0, this.width, this.height)
        lockingContext.beginPath()
        lockingContext.arc(startCursor.x, startCursor.y, radius, 0, 2 * Math.PI)
        lockingContext.closePath()
        lockingContext.globalAlpha = 1 // Math.abs(exponentialDecay - 1)
        lockingContext.fillStyle = this.currentUserColor
        lockingContext.fill()
        window.requestAnimationFrame(this.lockingAnimationFrame)
      } else {
        window.cancelAnimationFrame(lockingAnimationTimer)
        // lockingContext.clearRect(0, 0, this.width, this.height)
        lockingStartTime = undefined
      }
      if (currentUserIsLocking && progress > lockingDuration) {
        this.$store.commit('currentUserIsInkingLocked', true)
        console.log('🔒lockingAnimationFrame locked')
        lockingStartTime = undefined
      }
    },

    inking (event) {
      lockingContext.clearRect(0, 0, this.width, this.height)
      if (!inkingCirclesTimer) {
        inkingCirclesTimer = window.requestAnimationFrame(this.inkCirclesAnimationFrame)
      }
      currentCursor = utils.cursorPositionInPage(event)
      if (!this.$store.state.currentUserIsInking) { return }
      const x = currentCursor.x
      const y = currentCursor.y
      let color = this.$store.state.currentUser.color
      let circle = { x, y, color, iteration: 0 }
      this.$store.dispatch('broadcast/inking', circle)
      this.selectBlocks(circle)
      inkingCircles.push(circle)
    },

    inkCirclesAnimationFrame () {
      inkingCircles = utils.filterCircles(inkingCircles, maxIterationsToInk)
      inkingContext.clearRect(0, 0, this.width, this.height)
      inkingCircles.forEach(item => {
        item.iteration++
        let circle = JSON.parse(JSON.stringify(item))
        this.inkCircle(circle)
      })
      if (inkingCircles.length > 0) {
        window.requestAnimationFrame(this.inkCirclesAnimationFrame)
      } else {
        setTimeout(() => {
          window.cancelAnimationFrame(inkingCirclesTimer)
          inkingCirclesTimer = undefined
        }, 0)
      }
    },

    stopInking () {
      currentUserIsLocking = false
      window.cancelAnimationFrame(lockingAnimationTimer)
      lockingContext.clearRect(0, 0, this.width, this.height)
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

<style lang="stylus" scoped>
canvas
  position absolute
  top 0
.locking
  pointer-events none
</style>
