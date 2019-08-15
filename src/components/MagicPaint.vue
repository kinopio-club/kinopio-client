<template lang="pug">
aside.magic-paint
  canvas#painting.painting(
    @mousedown="startPainting"
    @touchstart="startPainting"
    @mousemove="painting"
    @touchmove="painting"
    :width="viewportWidth"
    :height="viewportHeight"
  )
  canvas#locking.locking(
    :width="viewportWidth"
    :height="viewportHeight"
  )
  canvas#initial.initial(
    :width="viewportWidth"
    :height="viewportHeight"
  )
</template>

<script>
import utils from '@/utils.js'

const circleRadius = 20

// painting
// a sequence of circles that's broadcasted to others and is used for multi-card selection
const maxIterations = 200 // higher is longer paint fade time
const rateOfIterationDecay = 0.03 // higher is faster tail decay
let paintingCircles = []
let paintingCanvas, paintingContext, startCursor, currentCursor, paintingCirclesTimer

// locking
// long press to lock scrolling
const lockingPreDuration = 150 // ms
const lockingDuration = 200 // ms
const initialLockCircleRadius = 65
let lockingCanvas, lockingContext, lockingAnimationTimer, currentUserIsLocking, lockingStartTime

// initial
// shows immediate feedback without having to move cursor
let initialCircles = []
let initialCanvas, initialContext, initialCirclesTimer
let prevScroll

export default {
  mounted () {
    paintingCanvas = document.getElementById('painting')
    paintingContext = paintingCanvas.getContext('2d')
    paintingContext.scale(window.devicePixelRatio, window.devicePixelRatio)
    lockingCanvas = document.getElementById('locking')
    lockingContext = lockingCanvas.getContext('2d')
    lockingContext.scale(window.devicePixelRatio, window.devicePixelRatio)
    initialCanvas = document.getElementById('initial')
    initialContext = initialCanvas.getContext('2d')
    initialContext.scale(window.devicePixelRatio, window.devicePixelRatio)
    // trigger stopPainting even if mouse is outside window
    window.addEventListener('mouseup', this.stopPainting)
    window.addEventListener('touchend', this.stopPainting)
    // shift circle positions with scroll to simulate full size canvas
    this.updateScrollPosition()
    window.addEventListener('scroll', this.updateCirclesWithScroll)
  },
  computed: {
    currentUserColor () {
      return this.$store.state.currentUser.color
    },
    // keep canvases updated to viewport size so you can draw on newly created areas
    pageHeight () { return this.$store.state.pageHeight },
    pageWidth () { return this.$store.state.pageWidth },
    viewportHeight () { return this.$store.state.viewportHeight },
    viewportWidth () { return this.$store.state.viewportWidth }
  },
  methods: {
    updateScrollPosition () {
      prevScroll = {
        x: window.scrollX,
        y: window.scrollY
      }
    },

    updateCirclePositions (circles, scrollDelta) {
      return circles.map(circle => {
        circle.x = circle.x - scrollDelta.x
        circle.y = circle.y - scrollDelta.y
        return circle
      })
    },

    updateCirclesWithScroll () {
      const scrollDelta = {
        x: window.scrollX - prevScroll.x,
        y: window.scrollY - prevScroll.y
      }
      if (initialCircles.length) {
        initialCircles = this.updateCirclePositions(initialCircles, scrollDelta) // covers locking circles of varialbe radius/
      }
      if (paintingCircles.length) {
        paintingCircles = this.updateCirclePositions(paintingCircles, scrollDelta)
      }
      this.updateScrollPosition()
    },

    isCircleVisible (circle) {
      let { x, y, radius } = circle
      radius = radius || circleRadius
      const circleVisibleX = utils.between({
        value: x + radius,
        min: 0,
        max: this.$store.state.viewportWidth
      })
      const circleVisibleY = utils.between({
        value: y + radius,
        min: 0,
        max: this.$store.state.viewportHeight
      })
      return Boolean(circleVisibleX && circleVisibleY)
    },

    drawCircle (circle, context) {
      let { x, y, color, iteration, radius, alpha } = circle
      radius = radius || circleRadius
      if (this.isCircleVisible(circle)) {
        alpha = alpha || utils.exponentialDecay(iteration, rateOfIterationDecay)
        context.beginPath()
        context.arc(x, y, radius, 0, 2 * Math.PI)
        context.closePath()
        context.globalAlpha = alpha
        context.fillStyle = color
        context.fill()
      }
    },

    startLocking () {
      currentUserIsLocking = true
      setTimeout(() => {
        if (!lockingAnimationTimer) {
          lockingAnimationTimer = window.requestAnimationFrame(this.lockingAnimationFrame)
        }
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

    createPaintingCircle (event) {
      let color = this.$store.state.currentUser.color
      currentCursor = utils.cursorPositionInViewport(event)
      let circle = { x: currentCursor.x, y: currentCursor.y, color, iteration: 0 }
      this.selectCards(circle)
      paintingCircles.push(circle)
    },

    startPainting (event) {
      startCursor = utils.cursorPositionInViewport(event)
      currentCursor = utils.cursorPositionInViewport(event)
      const dialogIsVisible = Boolean(document.querySelector('dialog'))
      const multipleCardsIsSelected = Boolean(this.$store.state.multipleCardsSelected.length)
      this.startLocking()
      this.createInitialCircle()
      this.$store.commit('currentUserIsPainting', true)
      if (!multipleCardsIsSelected && !dialogIsVisible) {
        this.$store.commit('shouldAddNewCard', true)
      }
      this.$store.commit('multipleCardsSelected', [])
      this.$store.commit('generateCardMap')
      this.$store.commit('closeAllDialogs')
      initialCircles.map(circle => {
        circle.persistent = false
      })
      if (!initialCirclesTimer) {
        initialCirclesTimer = window.requestAnimationFrame(this.initialCirclesAnimationFrame)
      }
    },

    painting (event) {
      if (!this.$store.state.currentUserIsPainting) { return }
      if (this.$store.getters.shouldScrollAtEdges) {
        event.preventDefault() // prevents touch swipe viewport scrolling
      }
      if (!paintingCirclesTimer) {
        paintingCirclesTimer = window.requestAnimationFrame(this.paintCirclesAnimationFrame)
      }
      this.createPaintingCircle(event)
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
        const alpha = utils.easeOut(percentComplete, elaspedTime, lockingDuration)
        const circle = {
          x: startCursor.x,
          y: startCursor.y,
          color: this.currentUserColor,
          radius,
          alpha: alpha || 0.01, // to ensure truthyness
          iteration: 1
        }
        lockingContext.clearRect(0, 0, this.pageWidth, this.pageHeight)
        this.drawCircle(circle, lockingContext)
        window.requestAnimationFrame(this.lockingAnimationFrame)
      } else {
        window.cancelAnimationFrame(lockingAnimationTimer)
        lockingContext.clearRect(0, 0, this.pageWidth, this.pageHeight)
        lockingAnimationTimer = undefined
        lockingStartTime = undefined
      }
      if (currentUserIsLocking && percentComplete > 1) {
        this.$store.commit('currentUserIsPaintingLocked', true)
        console.log('🔒lockingAnimationFrame locked')
        lockingStartTime = undefined
      }
    },

    paintCirclesAnimationFrame () {
      paintingCircles = utils.filterCircles(paintingCircles, maxIterations)
      paintingContext.clearRect(0, 0, this.pageWidth, this.pageHeight)
      paintingCircles.forEach(item => {
        item.iteration++
        let circle = JSON.parse(JSON.stringify(item))
        this.drawCircle(circle, paintingContext)
      })
      if (paintingCircles.length > 0) {
        window.requestAnimationFrame(this.paintCirclesAnimationFrame)
      } else {
        setTimeout(() => {
          window.cancelAnimationFrame(paintingCirclesTimer)
          paintingCirclesTimer = undefined
        }, 0)
      }
    },

    initialCirclesAnimationFrame () {
      initialCircles = utils.filterCircles(initialCircles, maxIterations)
      initialContext.clearRect(0, 0, this.pageWidth, this.pageHeight)
      initialCircles.forEach(item => {
        if (!item.persistent) {
          item.iteration++
        }
        let circle = JSON.parse(JSON.stringify(item))
        this.drawCircle(circle, initialContext)
      })
      if (initialCircles.length) {
        window.requestAnimationFrame(this.initialCirclesAnimationFrame)
      } else {
        window.cancelAnimationFrame(initialCirclesTimer)
        initialCirclesTimer = undefined
      }
    },

    shouldCancel (event) {
      const fromDialog = event.target.closest('dialog')
      const fromHeader = event.target.closest('header')
      const fromFooter = event.target.closest('footer')
      return fromDialog || fromHeader || fromFooter
    },

    stopPainting (event) {
      if (this.shouldCancel(event)) { return }
      startCursor = startCursor || {}
      const endCursor = utils.cursorPositionInViewport(event)
      const shouldAddNewCard = this.$store.state.shouldAddNewCard
      currentUserIsLocking = false
      window.cancelAnimationFrame(lockingAnimationTimer)
      lockingAnimationTimer = undefined
      lockingContext.clearRect(0, 0, this.pageWidth, this.pageHeight)
      this.$store.commit('currentUserIsPaintingLocked', false)
      this.$store.commit('currentUserIsPainting', false)
      if (utils.cursorsAreClose(startCursor, endCursor) && shouldAddNewCard) {
        this.$store.commit('shouldAddNewCard', true)
        event.preventDefault()
      } else {
        this.$store.commit('shouldAddNewCard', false)
      }
      // prevent mouse events from firing after touch events on touch device
      event.preventDefault()
    },

    selectCards (circle) {
      this.$store.state.cardMap.map(card => {
        const x = {
          value: circle.x + window.scrollX,
          min: card.x,
          max: card.x + card.width
        }
        const y = {
          value: circle.y + window.scrollY,
          min: card.y,
          max: card.y + card.height
        }
        const isBetweenX = utils.between(x)
        const isBetweenY = utils.between(y)
        if (isBetweenX && isBetweenY) {
          this.$store.commit('addToMultipleCardsSelected', card.cardId)
        }
      })
    }

  }
}
</script>

<style lang="stylus" scoped>
canvas
  position fixed
.locking,
.initial
  pointer-events none
</style>
