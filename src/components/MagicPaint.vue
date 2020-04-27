<template lang="pug">
aside.magic-paint
  canvas#painting.painting(
    @mousedown="startPainting"
    @touchstart="startPainting"
    @mousemove="painting"
    @touchmove="painting"
    :width="viewportWidth"
    :height="viewportHeight"
    :style="{ top: pinchZoomOffsetTop + 'px', left: pinchZoomOffsetLeft + 'px' }"
  )
  canvas#locking.locking(
    :width="viewportWidth"
    :height="viewportHeight"
    :style="{ top: pinchZoomOffsetTop + 'px', left: pinchZoomOffsetLeft + 'px' }"
  )
  canvas#initial.initial(
    :width="viewportWidth"
    :height="viewportHeight"
    :style="{ top: pinchZoomOffsetTop + 'px', left: pinchZoomOffsetLeft + 'px' }"
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
let prevScroll

// locking
// long press to lock scrolling
const lockingPreDuration = 100 // ms
const lockingDuration = 150 // ms
const initialLockCircleRadius = 65
let lockingCanvas, lockingContext, lockingAnimationTimer, currentUserIsLocking, lockingStartTime

// initial
// shows immediate feedback without having to move cursor
let initialCircles = []
let initialCanvas, initialContext, initialCirclesTimer

export default {
  name: 'MagicPaint',
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggeredPaintFramePosition') {
        const position = this.$store.state.triggeredPaintFramePosition
        const event = {
          clientX: position.x,
          clientY: position.y
        }
        this.createPaintingCircle(event)
      }
      if (mutation.type === 'triggerUpdateMagicPaintPositionOffset') {
        console.log('🌷trigger🌷')
        this.updatePositionOffsetByPinchZoom()
        this.updateCirclesWithScroll()
      }
    })
  },
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
    this.updatePrevScrollPosition()
    window.addEventListener('scroll', this.updateCirclesWithScroll)
    window.addEventListener('scroll', this.updatePositionOffsetByPinchZoom)
  },
  data () {
    return {
      pinchZoomOffsetTop: 0,
      pinchZoomOffsetLeft: 0
    }
  },
  computed: {
    currentUserColor () {
      return this.$store.state.currentUser.color
    },
    spaceIsReadOnly () { return !this.$store.getters['currentUser/canEditSpace']() },
    // keep canvases updated to viewport size so you can draw on newly created areas
    pageHeight () { return this.$store.state.pageHeight },
    pageWidth () { return this.$store.state.pageWidth },
    viewportHeight () { return this.$store.state.viewportHeight },
    viewportWidth () { return this.$store.state.viewportWidth }
  },
  methods: {
    updatePositionOffsetByPinchZoom () {
      if (!window.visualViewport) { return }
      this.pinchZoomOffsetTop = window.visualViewport.offsetTop
      this.pinchZoomOffsetLeft = window.visualViewport.offsetLeft
      console.log('🌷updatePositionOffsetByPinchZoom', window.scrollY, window.scrollX, this.pinchZoomOffsetTop, this.pinchZoomOffsetLeft)
    },
    updatePrevScrollPosition () {
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
      this.updatePrevScrollPosition()
    },
    isCircleVisible (circle) {
      let { x, y, radius } = circle
      radius = radius || circleRadius
      const circleVisibleX = utils.isBetween({
        value: x + radius,
        min: 0,
        max: this.$store.state.viewportWidth
      })
      const circleVisibleY = utils.isBetween({
        value: y + radius,
        min: 0,
        max: this.$store.state.viewportHeight
      })
      return Boolean(circleVisibleX && circleVisibleY)
    },
    drawCircle (circle, context) {
      if (!this.isCircleVisible(circle)) { return }
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
      this.selectConnections(circle)
      this.selectCardsAndConnectionsBetweenCircles(circle)
      paintingCircles.push(circle)
    },
    startPainting (event) {
      console.log('🌙startPainting detect -> closeAllDialogs')
      startCursor = utils.cursorPositionInViewport(event)
      currentCursor = utils.cursorPositionInViewport(event)
      const dialogIsVisible = Boolean(document.querySelector('dialog'))
      const multipleCardsIsSelected = Boolean(this.$store.state.multipleCardsSelectedIds.length)
      this.startLocking()
      this.createInitialCircle()
      this.$store.commit('currentUserIsPainting', true)
      if (!multipleCardsIsSelected && !dialogIsVisible) {
        this.$store.commit('shouldAddCard', true)
      }
      this.$store.commit('clearMultipleSelected')
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
        this.$store.commit('triggeredPaintFramePosition', { x: startCursor.x, y: startCursor.y })
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
      const shouldAddCard = this.$store.state.shouldAddCard
      currentUserIsLocking = false
      window.cancelAnimationFrame(lockingAnimationTimer)
      lockingAnimationTimer = undefined
      lockingContext.clearRect(0, 0, this.pageWidth, this.pageHeight)
      this.$store.commit('currentUserIsPaintingLocked', false)
      this.$store.commit('currentUserIsPainting', false)
      if (utils.cursorsAreClose(startCursor, endCursor) && shouldAddCard) {
        this.$store.commit('shouldAddCard', true)
        event.preventDefault()
      } else {
        this.$store.commit('shouldAddCard', false)
      }
      // prevent mouse events from firing after touch events on touch device
      event.preventDefault()
    },
    selectCards (point) {
      if (this.spaceIsReadOnly) { return }
      this.$store.state.cardMap.map(card => {
        const x = {
          value: point.x + window.scrollX,
          min: card.x,
          max: card.x + card.width
        }
        const y = {
          value: point.y + window.scrollY,
          min: card.y,
          max: card.y + card.height
        }
        const isBetweenX = utils.isBetween(x)
        const isBetweenY = utils.isBetween(y)
        if (isBetweenX && isBetweenY) {
          this.$store.commit('addToMultipleCardsSelected', card.cardId)
        }
      })
    },
    movementDirection (prevCircle, delta) {
      let movementDirection = {}
      if (delta.xAbsolute > delta.yAbsolute) {
        if (Math.sign(delta.x) === 1) {
          movementDirection.x = 'left'
        } else if (Math.sign(delta.x) === -1) {
          movementDirection.x = 'right'
        }
      } else if (delta.xAbsolute < delta.yAbsolute) {
        if (Math.sign(delta.y) === 1) {
          movementDirection.y = 'up'
        } else if (Math.sign(delta.y) === -1) {
          movementDirection.y = 'down'
        }
      }
      return movementDirection
    },
    linearInterpolateY (x, delta, prevCircle, circle) {
      const slope = delta.y / delta.x
      const isNoSlope = Math.abs(slope) === Infinity || slope === 0
      if (isNoSlope) {
        return circle.y
      } else {
        return Math.round((x - prevCircle.x) * slope + prevCircle.y)
      }
    },
    linearInterpolateX (y, delta, prevCircle, circle) {
      const slope = delta.y / delta.x
      const isNoSlope = Math.abs(slope) === Infinity || slope === 0
      if (isNoSlope) {
        return circle.x
      } else {
        return Math.round(prevCircle.x + slope * (y - prevCircle.y))
      }
    },
    selectConnections (circle) {
      if (this.spaceIsReadOnly) { return }
      this.selectConnectionPaths(circle)
    },
    selectCardsAndConnectionsBetweenCircles (circle) {
      const prevCircle = paintingCircles[paintingCircles.length - 1] || circle
      const delta = {
        x: prevCircle.x - circle.x,
        y: prevCircle.y - circle.y,
        xAbsolute: Math.abs(prevCircle.x - circle.x),
        yAbsolute: Math.abs(prevCircle.y - circle.y)
      }
      const furthestDelta = Math.max(delta.xAbsolute, delta.yAbsolute)
      if (furthestDelta <= 5 || prevCircle.iteration > 1) { return }
      const movementDirection = this.movementDirection(prevCircle, delta)
      const initialIncrement = 1
      const increment = 4
      if (movementDirection.x === 'right') {
        let x = prevCircle.x + initialIncrement
        while (x < circle.x) {
          const y = this.linearInterpolateY(x, delta, prevCircle, circle)
          this.selectConnectionPaths({ x, y })
          this.selectCards({ x, y })
          x += increment
        }
      } else if (movementDirection.x === 'left') {
        let x = prevCircle.x - initialIncrement
        while (x < circle.x) {
          const y = this.linearInterpolateY(x, delta, prevCircle, circle)
          this.selectConnectionPaths({ x, y })
          this.selectCards({ x, y })
          x += -increment
        }
      } else if (movementDirection.y === 'down') {
        let y = prevCircle.y + initialIncrement
        while (y < circle.y) {
          const x = this.linearInterpolateX(y, delta, prevCircle, circle)
          this.selectConnectionPaths({ x, y })
          this.selectCards({ x, y })
          y += increment
        }
      } else if (movementDirection.y === 'up') {
        let y = prevCircle.y - initialIncrement
        while (y < circle.y) {
          const x = this.linearInterpolateX(y, delta, prevCircle, circle)
          this.selectConnectionPaths({ x, y })
          this.selectCards({ x, y })
          y += -increment
        }
      }
    },
    selectConnectionPaths (point) {
      const paths = document.querySelectorAll('svg .connection-path')
      paths.forEach(path => {
        const ids = this.$store.state.multipleConnectionsSelectedIds
        const pathId = path.dataset.id
        const svg = document.querySelector('svg.connections')
        let svgPoint = svg.createSVGPoint()
        svgPoint.x = point.x + window.scrollX
        svgPoint.y = point.y + window.scrollY
        const isAlreadySelected = ids.includes(pathId)
        if (isAlreadySelected) { return }
        if (path.isPointInFill(svgPoint)) {
          this.$store.commit('addToMultipleConnectionsSelected', pathId)
        }
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
canvas
  position fixed
  top 0
.locking,
.initial
  pointer-events none
</style>
