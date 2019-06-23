<template lang="pug">
aside.magic-ink
  canvas#inking.inking(
    @mousedown="startInking"
    @touchstart="startInking"
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
  canvas#initial.initial(
    :width="width"
    :height="height"
  )
</template>

<script>
import utils from '@/utils.js'

const circleRadius = 20

// inking
// a sequence of circles that's broadcasted to others and is used for multi-block selection
const maxIterationsToInk = 200 // higher is longer ink fade time
const rateOfIterationDecay = 0.03 // higher is faster tail decay
let inkingCircles = []
let inkingCanvas, inkingContext, startCursor, currentCursor, inkingCirclesTimer

// locking
// long press to lock scrolling
const lockingPreDuration = 150 // ms
const lockingDuration = 250 // ms
const initialLockCircleRadius = 65
let lockingCanvas, lockingContext, lockingAnimationTimer, currentUserIsLocking, lockingStartTime

// initial
// shows immediate feedback without having to move cursor
let initialCircles = []
let initialCanvas, initialContext, initialCirclesTimer

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
    initialCanvas = document.getElementById('initial')
    initialContext = initialCanvas.getContext('2d')
    initialContext.scale(window.devicePixelRatio, window.devicePixelRatio)
    this.updateCanvasSize()
    window.addEventListener('resize', this.updateCanvasSize)
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

    drawCircle (circle, context) {
      let { x, y, color, iteration, radius, alpha } = circle
      radius = radius || circleRadius
      alpha = alpha || utils.exponentialDecay(iteration, rateOfIterationDecay)
      context.beginPath()
      context.arc(x, y, radius, 0, 2 * Math.PI)
      context.closePath()
      context.globalAlpha = alpha
      context.fillStyle = color
      context.fill()
    },

    startLocking () {
      currentUserIsLocking = true
      setTimeout(() => {
        lockingAnimationTimer = window.requestAnimationFrame(this.lockingAnimationFrame)
      }, lockingPreDuration)
    },

    createInitialCircle () {
      const initialCircle = {
        x: startCursor.x,
        y: startCursor.y,
        color: this.currentUserColor,
        iteration: 1,
        persistent: true
      }
      initialCircles.push(initialCircle)
      this.drawCircle(initialCircle, initialContext)
    },

    startInking (event) {
      startCursor = utils.cursorPositionInPage(event)
      currentCursor = utils.cursorPositionInPage(event)
      this.startLocking()
      this.createInitialCircle()
      this.$store.commit('currentUserIsInking', true)
      this.$store.commit('multipleBlocksSelected', [])
      this.$store.commit('generateBlockMap')
      this.$store.commit('closeAllPopOvers')
    },

    easeOut (percentComplete, elaspedTime) {
      const duration = lockingDuration
      const startValue = 0
      const endValue = 1
      return -endValue * (elaspedTime /= duration) * (elaspedTime - 2) + startValue
    },

    lockingAnimationFrame (timestamp) {
      if (!lockingStartTime) {
        lockingStartTime = timestamp
      }
      const elaspedTime = timestamp - lockingStartTime
      const percentComplete = (elaspedTime / lockingDuration) // between 0 and 1
      if (!utils.cursorsAreClose(startCursor, currentCursor)) {
        currentUserIsLocking = false
      }
      if (currentUserIsLocking && percentComplete <= 1) {
        const minSize = circleRadius
        const percentRemaining = Math.abs(percentComplete - 1)
        const circleRadiusDelta = initialLockCircleRadius - minSize
        const radius = (circleRadiusDelta * percentRemaining) + minSize
        const alpha = this.easeOut(percentComplete, elaspedTime)
        const circle = {
          x: startCursor.x,
          y: startCursor.y,
          color: this.currentUserColor,
          radius,
          alpha: alpha || 0.01, // to ensure truthyness
          iteration: 1
        }
        lockingContext.clearRect(0, 0, this.width, this.height)
        this.drawCircle(circle, lockingContext)
        window.requestAnimationFrame(this.lockingAnimationFrame)
      } else {
        window.cancelAnimationFrame(lockingAnimationTimer)
        lockingStartTime = undefined
      }
      if (currentUserIsLocking && percentComplete > 1) {
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
      if (!initialCirclesTimer) {
        initialCirclesTimer = window.requestAnimationFrame(this.initialCirclesAnimationFrame)
      }
      initialCircles.map(circle => {
        circle.persistent = false
      })
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
        this.drawCircle(circle, inkingContext)
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

    initialCirclesAnimationFrame () {
      initialCircles = utils.filterCircles(initialCircles, maxIterationsToInk)
      initialContext.clearRect(0, 0, this.width, this.height)
      initialCircles.forEach(item => {
        if (!item.persistent) {
          item.iteration++
        }
        let circle = JSON.parse(JSON.stringify(item))
        this.drawCircle(circle, initialContext)
      })
      if (initialCircles.length > 0) {
        window.requestAnimationFrame(this.initialCirclesAnimationFrame)
      } else {
        setTimeout(() => {
          window.cancelAnimationFrame(initialCirclesTimer)
          initialCirclesTimer = undefined
        }, 0)
      }
    },

    stopInking () {
      const endCursor = utils.cursorPositionInPage(event)
      const isMultipleBlocksSelected = Boolean(this.$store.state.multipleBlocksSelected.length)
      currentUserIsLocking = false
      window.cancelAnimationFrame(lockingAnimationTimer)
      lockingContext.clearRect(0, 0, this.width, this.height)
      this.$store.commit('currentUserIsInkingLocked', false)
      this.$store.commit('currentUserIsInking', false)
      this.$store.commit('closeAllPopOvers')
      if (isMultipleBlocksSelected) {
        this.$store.commit('multipleBlockActionsPosition', endCursor)
        this.$store.commit('multipleBlockActionsIsVisible', true)
      }
      if (utils.cursorsAreClose(startCursor, endCursor)) {
        console.log('🌸🌸 showNewBlockDetails')
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
.locking,
.initial
  pointer-events none
</style>
