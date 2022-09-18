<template lang="pug">
aside
  //- Magic painting is ephemeral brush strokes that select items
  canvas#magic-painting(
    @mousedown.left="startPainting"
    @touchstart="startPainting"
    @mousemove="painting"
    @touchmove="painting"
    :width="viewportWidth"
    :height="viewportHeight"
    :style="canvasStyles"
    @dragenter="checkIfUploadIsDraggedOver"
    @dragover.prevent="checkIfUploadIsDraggedOver"
    @dragleave="removeUploadIsDraggedOver"
    @dragend="removeUploadIsDraggedOver"
    @drop.prevent.stop="addCardsAndUploadFiles"
  )
  canvas#remote-painting.remote-painting(
    :width="viewportWidth"
    :height="viewportHeight"
    :style="canvasStyles"
  )
  canvas#locking.locking(
    :width="viewportWidth"
    :height="viewportHeight"
    :style="canvasStyles"
  )
  canvas#initial-circle.initial-circle(
    :width="viewportWidth"
    :height="viewportHeight"
    :style="canvasStyles"
  )
  DropGuideLine(
    :currentCursor="currentCursor"
    :uploadIsDraggedOver="uploadIsDraggedOver"
  )
</template>

<script>
import utils from '@/utils.js'
import DropGuideLine from '@/components/layers/DropGuideLine.vue'

const circleRadius = 20
const circleSelectionRadius = circleRadius - 10 // magnitude of sensitivity

// painting
// a sequence of circles that's broadcasted to others and is used for multi-card selection
const maxIterations = 200 // higher is longer paint fade time
const rateOfIterationDecay = 0.03 // higher is faster tail decay
let paintingCircles = []
let paintingCanvas, paintingContext, startCursor, paintingCirclesTimer
let prevScroll

// remote painting
let remotePaintingCircles = []
let remotePaintingCanvas, remotePaintingContext, remotePaintingCirclesTimer

// locking
// long press to lock scrolling
const lockingPreDuration = 100 // ms
const lockingDuration = 150 // ms
const initialLockCircleRadius = 65
let lockingCanvas, lockingContext, lockingAnimationTimer, currentUserIsLocking, lockingStartTime, shouldCancelLocking

// initial
// shows immediate feedback without having to move cursor
let initialCircles = []
let initialCircleCanvas, initialCircleContext, initialCirclesTimer

// post scroll timer
// runs scroll events after scrollend to compensate for android inertia scrolling
const postScrollDuration = 300 // ms
let postScrollAnimationTimer, postScrollStartTime, shouldCancelPostScroll

export default {
  name: 'MagicPaint',
  components: {
    DropGuideLine
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggeredPaintFramePosition') {
        const position = this.$store.state.triggeredPaintFramePosition
        const event = {
          clientX: position.x,
          clientY: position.y
        }
        this.createPaintingCircle(event)
      } else if (mutation.type === 'triggerUpdateMagicPaintPositionOffset') {
        this.updatePositionOffsetByPinchZoom()
        this.updateCirclesWithScroll()
      } else if (mutation.type === 'triggerAddRemotePaintingCircle') {
        let circle = mutation.payload
        delete circle.type
        this.createRemotePaintingCircle(circle)
        this.remotePainting()
      }
    })
  },
  mounted () {
    paintingCanvas = document.getElementById('magic-painting')
    paintingContext = paintingCanvas.getContext('2d')
    paintingContext.scale(window.devicePixelRatio, window.devicePixelRatio)
    remotePaintingCanvas = document.getElementById('remote-painting')
    remotePaintingContext = remotePaintingCanvas.getContext('2d')
    remotePaintingContext.scale(window.devicePixelRatio, window.devicePixelRatio)
    lockingCanvas = document.getElementById('locking')
    lockingContext = lockingCanvas.getContext('2d')
    lockingContext.scale(window.devicePixelRatio, window.devicePixelRatio)
    initialCircleCanvas = document.getElementById('initial-circle')
    initialCircleContext = initialCircleCanvas.getContext('2d')
    initialCircleContext.scale(window.devicePixelRatio, window.devicePixelRatio)
    // trigger stopPainting even if mouse is outside window
    window.addEventListener('mouseup', this.stopPainting)
    window.addEventListener('touchend', this.stopPainting)
    // shift circle positions with scroll to simulate full size canvas
    this.updatePrevScrollPosition()
    window.addEventListener('scroll', this.userScroll)
    window.addEventListener('touchmove', this.userScroll) // android fix
    window.addEventListener('load', this.clearCircles)
    this.startPostScroll()
  },
  beforeUnmount () {
    window.removeEventListener('mouseup', this.stopPainting)
    window.removeEventListener('touchend', this.stopPainting)
    window.removeEventListener('scroll', this.userScroll)
    window.removeEventListener('touchmove', this.userScroll)
    window.removeEventListener('load', this.clearCircles)
  },
  data () {
    return {
      pinchZoomOffsetTop: 0,
      pinchZoomOffsetLeft: 0,
      currentCursor: {},
      uploadIsDraggedOver: false
    }
  },
  computed: {
    currentUserColor () { return this.$store.state.currentUser.color },
    userCantEditSpace () { return !this.$store.getters['currentUser/canEditSpace']() },
    // keep canvases updated to viewport size so you can draw on newly created areas
    pageHeight () { return this.$store.state.pageHeight },
    pageWidth () { return this.$store.state.pageWidth },
    viewportHeight () { return this.$store.state.viewportHeight },
    viewportWidth () { return this.$store.state.viewportWidth },
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal },
    spaceZoomDecimal () { return this.$store.getters.spaceZoomDecimal },
    isPanning () { return this.$store.state.currentUserIsPanningReady },
    isBoxSelecting () { return this.$store.state.currentUserIsBoxSelecting },
    canvasStyles () {
      return { top: this.pinchZoomOffsetTop + 'px', left: this.pinchZoomOffsetLeft + 'px' }
    },
    toolbarIsCard () { return this.$store.state.currentUserToolbar === 'card' },
    toolbarIsBox () { return this.$store.state.currentUserToolbar === 'box' }
  },
  methods: {
    userScroll () {
      if (postScrollAnimationTimer) {
        shouldCancelPostScroll = true
      }
      this.scroll()
    },
    scroll () {
      this.updateCirclesWithScroll()
      this.updatePositionOffsetByPinchZoom()
      this.cancelLocking()
    },
    clearCircles () {
      initialCircles = []
      paintingCircles = []
      remotePaintingCircles = []
    },
    updatePositionOffsetByPinchZoom () {
      if (!window.visualViewport) { return }
      this.pinchZoomOffsetTop = window.visualViewport.offsetTop
      this.pinchZoomOffsetLeft = window.visualViewport.offsetLeft
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
    updateCircleForAndroid (circle) {
      if (!utils.isAndroid()) { return circle }
      circle.x = circle.x - window.visualViewport.offsetLeft
      circle.y = circle.y - window.visualViewport.offsetTop
      return circle
    },
    isCircleVisible (circle) {
      let { x, y, radius } = circle
      radius = radius || circleRadius
      let isBetween = {
        value: x + radius,
        min: 0,
        max: this.viewportWidth
      }
      const isCircleVisibleX = utils.isBetween(isBetween)
      isBetween = {
        value: y + radius,
        min: 0,
        max: this.viewportHeight
      }
      const isCircleVisibleY = utils.isBetween(isBetween)
      return Boolean(isCircleVisibleX && isCircleVisibleY)
    },
    offscreenCircle (circle) {
      if (circle.x > this.viewportWidth) {
        circle.x = this.viewportWidth
      } else if (circle.x < 0) {
        circle.x = 0
      }
      if (circle.y > this.viewportHeight) {
        circle.y = this.viewportHeight
      } else if (circle.y < 0) {
        circle.y = 0
      }
      return circle
    },
    drawCircle (circle, context, shouldDrawOffscreen) {
      circle = this.updateCircleForAndroid(circle)
      const isCircleVisible = this.isCircleVisible(circle)
      if (!isCircleVisible && !shouldDrawOffscreen) { return }
      if (!isCircleVisible && shouldDrawOffscreen) { circle = this.offscreenCircle(circle) }
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
    shouldCancel (event) {
      let shouldCancelOutsideOfBrowser = !(event.target instanceof Element)
      if (shouldCancelOutsideOfBrowser) {
        return false
      }
      const fromDialog = event.target.closest('dialog')
      const fromHeader = event.target.closest('header')
      const fromFooter = event.target.closest('footer')
      return fromDialog || fromHeader || fromFooter
    },
    stopPainting (event) {
      if (this.$store.state.isAddPage) { return }
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
      if (utils.cursorsAreClose(startCursor, endCursor) && shouldAddCard && event.cancelable) {
        this.$store.commit('shouldAddCard', true)
        event.preventDefault()
      } else {
        this.$store.commit('shouldAddCard', false)
      }
      // prevent mouse events from firing after touch events on touch device
      if (event.cancelable) { event.preventDefault() }
      this.$store.commit('triggerUpdatePositionInVisualViewport')
      this.startPostScroll()
    },

    // Post Scrolling (for android)

    startPostScroll () {
      shouldCancelPostScroll = false
      if (!postScrollAnimationTimer) {
        postScrollAnimationTimer = window.requestAnimationFrame(this.postScrollFrame)
      }
    },
    postScrollFrame (timestamp) {
      if (!postScrollStartTime) {
        postScrollStartTime = timestamp
      }
      const elaspedTime = timestamp - postScrollStartTime
      const percentComplete = (elaspedTime / postScrollDuration) // between 0 and 1
      if (shouldCancelPostScroll) {
        this.endPostScroll()
      } else if (percentComplete <= 1) {
        this.scroll()
        window.requestAnimationFrame(this.postScrollFrame)
      } else {
        this.endPostScroll()
      }
    },
    endPostScroll () {
      shouldCancelPostScroll = false
      window.cancelAnimationFrame(postScrollAnimationTimer)
      postScrollAnimationTimer = undefined
      postScrollStartTime = undefined
    },

    // Painting

    painting (event) {
      const isPainting = this.$store.state.currentUserIsPainting
      if (this.isPanning) { return }
      if (this.isBoxSelecting) { return }
      if (!this.toolbarIsCard) { return }
      if (!isPainting) { return }
      if (this.$store.getters.shouldScrollAtEdges(event) && event.cancelable) {
        event.preventDefault() // prevents touch swipe viewport scrolling
      }
      if (!paintingCirclesTimer) {
        paintingCirclesTimer = window.requestAnimationFrame(this.paintCirclesAnimationFrame)
      }
      if (event.getCoalescedEvents) {
        const events = event.getCoalescedEvents()
        events.forEach(event => this.createPaintingCircle(event))
      } else {
        this.createPaintingCircle(event)
      }
      this.triggerHideTouchInterface()
    },
    triggerHideTouchInterface () {
      if (!this.$store.state.currentUserIsPaintingLocked) { return }
      this.$store.commit('triggerHideTouchInterface')
    },
    createPaintingCircle (event) {
      const isTouch = Boolean(event.touches)
      const isPaintingLocked = this.$store.state.currentUserIsPaintingLocked
      if (isTouch && !isPaintingLocked) { return }
      if (this.isBoxSelecting) { return }
      const currentUserIsPaintingLocked = this.$store.state.currentUserIsPaintingLocked
      if (event.touches && !currentUserIsPaintingLocked) { return }
      let color = this.$store.state.currentUser.color
      this.currentCursor = utils.cursorPositionInViewport(event)
      let circle = { x: this.currentCursor.x, y: this.currentCursor.y, color, iteration: 0 }
      this.selectCards(circle)
      this.selectConnections(circle)
      this.selectBoxes(circle)
      this.selectCardsAndConnectionsBetweenCircles(circle)
      paintingCircles.push(circle)
      this.broadcastCircle(circle)
    },
    startPainting (event) {
      if (this.isPanning) { return }
      if (this.isBoxSelecting) { return }
      startCursor = utils.cursorPositionInViewport(event)
      this.currentCursor = utils.cursorPositionInViewport(event)
      const multipleCardsIsSelected = Boolean(this.$store.state.multipleCardsSelectedIds.length)
      if (utils.isMultiTouch(event)) { return }
      this.startLocking()
      if (event.touches) {
        this.$store.commit('currentUserIsPainting', false)
      } else {
        this.$store.commit('currentUserIsPainting', true)
        this.createInitialCircle()
      }
      const shouldAdd = !multipleCardsIsSelected && !utils.unpinnedDialogIsVisible()
      // add card
      if (shouldAdd && this.toolbarIsCard) {
        this.$store.commit('shouldAddCard', true)
      // add box
      } else if (shouldAdd && this.toolbarIsBox) {
        this.addBox(event)
        return
      }
      // clear selected
      if (!event.shiftKey) {
        this.$store.dispatch('clearMultipleSelected')
      }
      this.$store.commit('previousMultipleCardsSelectedIds', utils.clone(this.$store.state.multipleCardsSelectedIds))
      this.$store.commit('previousMultipleConnectionsSelectedIds', utils.clone(this.$store.state.multipleConnectionsSelectedIds))
      this.$store.dispatch('closeAllDialogs', 'MagicPaint.startPainting')
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

    // Boxes

    addBox (event) {
      const zoom = this.$store.getters.spaceCounterZoomDecimal
      let position = utils.cursorPositionInPage(event)
      position = {
        x: position.x * zoom,
        y: position.y * zoom
      }
      const shouldPrevent = this.checkIfShouldPreventInteraction(position)
      if (shouldPrevent) { return }
      this.$store.dispatch('currentBoxes/add', { box: position, shouldResize: true })
      this.$store.commit('currentBoxIsNew', true)
      event.preventDefault() // allows dragging boxes without scrolling on touch
    },
    checkIfShouldPreventInteraction (position) {
      const currentUserCanEdit = this.$store.getters['currentUser/canEditSpace']()
      if (currentUserCanEdit) { return }
      const notificationWithPosition = document.querySelector('.notifications-with-position .item')
      if (!notificationWithPosition) {
        this.$store.commit('addNotificationWithPosition', { message: 'Space is Read Only', position, type: 'info', layer: 'space', icon: 'cancel' })
      }
      return true
    },

    // Selecting

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
    shouldPreventSelectionOnMobile () {
      const isMobile = utils.isMobile()
      const isPaintingLocked = this.$store.state.currentUserIsPaintingLocked
      return isMobile && !isPaintingLocked
    },
    selectConnections (circle) {
      if (this.shouldPreventSelectionOnMobile()) { return }
      if (this.userCantEditSpace) { return }
      this.selectConnectionPaths(circle)
    },
    selectCardsAndConnectionsBetweenCircles (circle) {
      if (this.shouldPreventSelectionOnMobile()) { return }
      if (this.userCantEditSpace) { return }
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
      const increment = 2
      let x = circle.x
      let y = circle.y
      if (movementDirection.x === 'right') {
        x = prevCircle.x + increment
        while (x < circle.x) {
          x += increment
          this.selectConnectionPaths({ x, y })
          this.selectCards({ x, y })
        }
      } else if (movementDirection.x === 'left') {
        x = prevCircle.x - increment
        while (x > circle.x) {
          x += -increment
          this.selectConnectionPaths({ x, y })
          this.selectCards({ x, y })
        }
      } else if (movementDirection.y === 'down') {
        y = prevCircle.y + increment
        while (y < circle.y) {
          y += increment
          this.selectConnectionPaths({ x, y })
          this.selectCards({ x, y })
        }
      } else if (movementDirection.y === 'up') {
        y = prevCircle.y - increment
        while (y > circle.y) {
          y += -increment
          this.selectConnectionPaths({ x, y })
          this.selectCards({ x, y })
        }
      }
    },
    selectCards (point) {
      if (this.shouldPreventSelectionOnMobile()) { return }
      if (this.userCantEditSpace) { return }
      const zoom = this.spaceCounterZoomDecimal
      const cardMap = this.$store.state.currentCards.cardMap
      const filterComments = this.$store.state.currentUser.filterComments
      cardMap.forEach(card => {
        if (filterComments && card.isComment) { return }
        const cardX = card.x
        const cardY = card.y
        const pointX = (point.x + window.scrollX) * zoom
        const pointY = (point.y + window.scrollY) * zoom
        const x = {
          value: pointX,
          min: cardX - circleSelectionRadius,
          max: cardX + card.width + circleSelectionRadius
        }
        const y = {
          value: pointY,
          min: cardY - circleSelectionRadius,
          max: cardY + card.height + circleSelectionRadius
        }
        const isBetweenX = utils.isBetween(x)
        const isBetweenY = utils.isBetween(y)
        if (isBetweenX && isBetweenY) {
          this.$store.dispatch('addToMultipleCardsSelected', card.id)
        }
      })
    },
    selectConnectionPaths (point) {
      const zoom = this.spaceCounterZoomDecimal
      const paths = document.querySelectorAll('svg .connection-path')
      const pointX = (point.x + window.scrollX) * zoom
      const pointY = (point.y + window.scrollY) * zoom
      paths.forEach(path => {
        if (path.dataset['is-hidden-by-comment-filter'] === 'true') { return }
        const pathId = path.dataset.id
        const svg = document.querySelector('svg.connections')
        let svgPoint = svg.createSVGPoint()
        svgPoint.x = pointX
        svgPoint.y = pointY
        const isSelected = path.isPointInStroke(svgPoint)
        if (isSelected) {
          this.$store.dispatch('addToMultipleConnectionsSelected', pathId)
        }
      })
    },
    selectBoxes (point) {
      if (this.shouldPreventSelectionOnMobile()) { return }
      if (this.userCantEditSpace) { return }
      const zoom = this.spaceCounterZoomDecimal
      const boxes = this.$store.getters['currentBoxes/isNotLocked']
      boxes.forEach(box => {
        const element = document.querySelector(`.box-info[data-box-id="${box.id}"]`)
        const rect = element.getBoundingClientRect()
        box = {
          id: box.id,
          name: box.name,
          x: (rect.x + window.scrollX) * zoom,
          y: (rect.y + window.scrollY) * zoom,
          width: rect.width,
          height: rect.height
        }
        const pointX = (point.x + window.scrollX) * zoom
        const pointY = (point.y + window.scrollY) * zoom
        const x = {
          value: pointX,
          min: box.x - circleSelectionRadius,
          max: box.x + box.width + circleSelectionRadius
        }
        const y = {
          value: pointY,
          min: box.y - circleSelectionRadius,
          max: box.y + box.height + circleSelectionRadius
        }
        const isBetweenX = utils.isBetween(x)
        const isBetweenY = utils.isBetween(y)
        if (isBetweenX && isBetweenY) {
          this.$store.dispatch('addToMultipleBoxesSelected', box.id)
        }
      })
    },

    // Remote Painting

    broadcastCircle (circle) {
      const currentUserCanEdit = this.$store.getters['currentUser/canEditSpace']()
      if (!currentUserCanEdit) { return }
      this.$store.commit('broadcast/update', {
        updates: {
          userId: this.$store.state.currentUser.id,
          x: circle.x + window.scrollX,
          y: circle.y + window.scrollY,
          color: circle.color,
          iteration: circle.iteration,
          zoom: this.spaceZoomDecimal
        },
        type: 'addRemotePaintingCircle',
        handler: 'triggerAddRemotePaintingCircle'
      })
    },
    createRemotePaintingCircle (circle) {
      const remoteZoom = 1 / circle.zoom
      const localZoom = this.spaceCounterZoomDecimal
      // remote zoom
      circle.x = circle.x * remoteZoom
      circle.y = circle.y * remoteZoom
      // local zoom
      circle.x = circle.x / localZoom
      circle.y = circle.y / localZoom
      remotePaintingCircles.push(circle)
    },
    remotePainting () {
      if (!remotePaintingCirclesTimer) {
        remotePaintingCirclesTimer = window.requestAnimationFrame(this.remotePaintCirclesAnimationFrame)
      }
    },
    remotePaintCirclesAnimationFrame () {
      remotePaintingCircles = utils.filterCircles(remotePaintingCircles, maxIterations)
      remotePaintingContext.clearRect(0, 0, this.pageWidth, this.pageHeight)
      remotePaintingCircles.forEach(item => {
        item.iteration++
        let circle = JSON.parse(JSON.stringify(item))
        circle.x = circle.x - window.scrollX
        circle.y = circle.y - window.scrollY
        const shouldDrawOffscreen = true
        this.drawCircle(circle, remotePaintingContext, shouldDrawOffscreen)
      })
      if (remotePaintingCircles.length > 0) {
        window.requestAnimationFrame(this.remotePaintCirclesAnimationFrame)
      } else {
        setTimeout(() => {
          window.cancelAnimationFrame(remotePaintingCirclesTimer)
          remotePaintingCirclesTimer = undefined
        }, 0)
      }
    },

    // Locking

    cancelLocking () {
      shouldCancelLocking = true
    },
    startLocking () {
      if (this.toolbarIsBox) { return }
      currentUserIsLocking = true
      shouldCancelLocking = false
      setTimeout(() => {
        if (!lockingAnimationTimer) {
          lockingAnimationTimer = window.requestAnimationFrame(this.lockingAnimationFrame)
        }
      }, lockingPreDuration)
    },
    lockingAnimationFrame (timestamp) {
      if (!lockingStartTime) {
        lockingStartTime = timestamp
      }
      const elaspedTime = timestamp - lockingStartTime
      const percentComplete = (elaspedTime / lockingDuration) // between 0 and 1
      if (!utils.cursorsAreClose(startCursor, this.currentCursor)) {
        currentUserIsLocking = false
      }
      if (shouldCancelLocking) {
        currentUserIsLocking = false
        shouldCancelLocking = false
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
        this.$store.commit('currentUserIsPainting', true)
        this.$store.commit('currentUserIsPaintingLocked', true)
        this.$store.commit('triggeredPaintFramePosition', { x: startCursor.x, y: startCursor.y })
        console.log('🔒 lockingAnimationFrame locked')
        lockingStartTime = undefined
      }
    },

    // Initial Circles

    startInitialCircles () {
      initialCircles.map(circle => {
        circle.persistent = false
      })
      if (!initialCirclesTimer) {
        initialCirclesTimer = window.requestAnimationFrame(this.initialCirclesAnimationFrame)
      }
    },
    createInitialCircle () {
      if (this.toolbarIsBox) { return }
      const initialCircle = {
        x: startCursor.x,
        y: startCursor.y,
        color: this.currentUserColor,
        iteration: 1,
        persistent: true
      }
      initialCircles.push(initialCircle)
      this.drawCircle(initialCircle, initialCircleContext)
      this.startInitialCircles()
    },
    initialCirclesAnimationFrame () {
      initialCircles = utils.filterCircles(initialCircles, maxIterations)
      initialCircleContext.clearRect(0, 0, this.pageWidth, this.pageHeight)
      initialCircles.forEach(item => {
        if (!item.persistent) {
          item.iteration++
        }
        let circle = JSON.parse(JSON.stringify(item))
        this.drawCircle(circle, initialCircleContext)
      })
      if (initialCircles.length) {
        window.requestAnimationFrame(this.initialCirclesAnimationFrame)
      } else {
        window.cancelAnimationFrame(initialCirclesTimer)
        initialCirclesTimer = undefined
      }
    },

    // Upload Files

    checkIfUploadIsDraggedOver (event) {
      const uploadIsFiles = event.dataTransfer.types.find(type => type === 'Files')
      if (!uploadIsFiles) { return }
      this.currentCursor = utils.cursorPositionInViewport(event)
      this.uploadIsDraggedOver = true
    },
    removeUploadIsDraggedOver () {
      this.uploadIsDraggedOver = false
    },
    addCardsAndUploadFiles (event) {
      let files = event.dataTransfer.files
      files = Array.from(files)
      this.currentCursor = utils.cursorPositionInPage(event)
      this.removeUploadIsDraggedOver()
      this.$store.dispatch('upload/addCardsAndUploadFiles', {
        files,
        currentCursor: this.currentCursor
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
.initial-circle,
.remote-painting
  pointer-events none
</style>
