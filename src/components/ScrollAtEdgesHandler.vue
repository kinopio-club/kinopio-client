<template lang='pug'>
</template>

<script>
import utils from '@/utils.js'

let prevCursor, prevCursorPage, currentCursor, currentCursorPage, scrollTimer, scrollAreaHeight, scrollAreaWidth, maxHeight, maxWidth
let movementDirection = {}

export default {
  name: 'ScrollAtEdgesHandler',
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'currentUserIsPaintingLocked' && mutation.payload) {
        const position = this.$store.state.triggeredPaintFramePosition
        const event = {
          clientX: position.x,
          clientY: position.y
        }
        this.stopScrollTimer()
        this.initInteractions(event)
      }
      if (mutation.type === 'triggeredTouchCardDragPosition') {
        const position = this.$store.state.triggeredTouchCardDragPosition
        const event = {
          clientX: position.x,
          clientY: position.y
        }
        this.stopScrollTimer()
        this.initInteractions(event)
      }
    })
  },
  mounted () {
    window.addEventListener('mousedown', this.initInteractions)
    window.addEventListener('touchstart', this.initInteractions)
    // bind events to window to receive events when mouse is outside window
    window.addEventListener('mousemove', this.interact)
    window.addEventListener('touchmove', this.interact)
    window.addEventListener('mouseup', this.stopInteractions)
    window.addEventListener('touchend', this.stopInteractions)
  },
  beforeUnmount () {
    window.removeEventListener('mousedown', this.initInteractions)
    window.removeEventListener('touchstart', this.initInteractions)
    window.removeEventListener('mousemove', this.interact)
    window.removeEventListener('touchmove', this.interact)
    window.removeEventListener('mouseup', this.stopInteractions)
    window.removeEventListener('touchend', this.stopInteractions)
  },
  computed: {
    viewportHeight () { return this.$store.state.viewportHeight },
    viewportWidth () { return this.$store.state.viewportWidth },
    pageHeight () { return this.$store.state.pageHeight },
    pageWidth () { return this.$store.state.pageWidth },
    currentUserIsPainting () { return this.$store.state.currentUserIsPainting },
    isDraggingCard () { return this.$store.state.currentUserIsDraggingCard },
    isDrawingConnection () { return this.$store.state.currentUserIsDrawingConnection },
    isResizingCard () { return this.$store.state.currentUserIsResizingCard },
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal },
    spaceZoomDecimal () { return this.$store.getters.spaceZoomDecimal },
    shouldPreventResize () { return this.currentUserIsPainting || this.isDrawingConnection || this.isResizingCard }
  },
  methods: {
    // init

    initCursors ({ event, position }) {
      if (event) {
        position = utils.cursorPositionInSpaceViewport(event)
      }
      prevCursor = position
      currentCursor = position
    },
    initMeasurements () {
      scrollAreaHeight = (this.viewportHeight / 8)
      scrollAreaHeight = Math.max(50, scrollAreaHeight)
      scrollAreaHeight = Math.round(scrollAreaHeight)
      scrollAreaWidth = (this.viewportWidth / 8)
      scrollAreaWidth = Math.max(50, scrollAreaWidth)
      scrollAreaWidth = Math.round(scrollAreaWidth)
      maxHeight = Math.max(6500, this.$store.state.viewportHeight)
      maxWidth = Math.max(6500, this.$store.state.viewportWidth)
    },
    initInteractions (event) {
      this.initCursors({ event })
      this.initMeasurements()
      const shouldScroll = this.$store.getters.shouldScrollAtEdges(event)
      if (shouldScroll) {
        this.updateMovementDirection()
      }
      if (shouldScroll && !scrollTimer) {
        scrollTimer = window.requestAnimationFrame(this.scrollFrame)
      }
    },

    // interact

    interact (event) {
      currentCursor = utils.cursorPositionInSpaceViewport(event)
      currentCursorPage = utils.cursorPositionInPage(event)
      if (this.$store.getters.shouldScrollAtEdges(event)) {
        this.updateMovementDirection()
      }
      prevCursorPage = currentCursorPage
    },

    // direction and speed

    updateMovementDirection () {
      const xMove = prevCursor.x - currentCursor.x
      const yMove = prevCursor.y - currentCursor.y
      if (Math.sign(yMove) === 1) {
        movementDirection.y = 'up'
      } else if (Math.sign(yMove) === -1) {
        movementDirection.y = 'down'
      }
      if (Math.sign(xMove) === 1) {
        movementDirection.x = 'left'
      } else if (Math.sign(xMove) === -1) {
        movementDirection.x = 'right'
      }
    },
    speed (direction) {
      const minSpeed = 10
      const maxSpeed = 20
      const maxSpeedOutsideWindow = 50
      const viewportHeight = this.viewportHeight
      const viewportWidth = this.viewportWidth
      // viewportSize based on direction
      const directionIsY = direction === 'up' || direction === 'down'
      const directionIsX = direction === 'left' || direction === 'right'
      let scrollAreaSize, viewportSize
      let cursor
      if (directionIsX) {
        scrollAreaSize = scrollAreaWidth
        cursor = prevCursor.x
        viewportSize = viewportWidth
      } else if (directionIsY) {
        scrollAreaSize = scrollAreaHeight
        cursor = prevCursor.y
        viewportSize = viewportHeight
      }
      // calc percent over scrollArea
      let amount
      if (direction === 'up' || direction === 'left') {
        amount = Math.abs(cursor - scrollAreaSize)
      }
      if (direction === 'down' || direction === 'right') {
        amount = Math.abs(cursor - (viewportSize - scrollAreaSize))
      }
      let percent = utils.roundFloat(amount / scrollAreaSize)
      // speed
      let speed = percent * scrollAreaSize
      speed = Math.max(speed, minSpeed)
      if (percent > 1) {
        speed = Math.min(speed, maxSpeedOutsideWindow)
      } else {
        speed = Math.min(speed, maxSpeed)
      }
      return speed
    },

    // scroll

    scrollFrame () {
      if (!prevCursor) { return }
      let delta = { x: 0, y: 0 }
      const viewportHeight = this.viewportHeight
      const viewportWidth = this.viewportWidth
      const cursorIsTopSide = prevCursor.y <= scrollAreaHeight
      const cursorIsBottomSide = prevCursor.y >= (viewportHeight - scrollAreaHeight)
      const cursorIsLeftSide = prevCursor.x <= scrollAreaWidth
      const cursorIsRightSide = prevCursor.x >= (viewportWidth - scrollAreaWidth)
      // Y movement
      if (movementDirection.y === 'up' && cursorIsTopSide && window.scrollY) {
        const speed = this.speed('up')
        delta.y = -speed
      } else if (movementDirection.y === 'down' && cursorIsBottomSide && this.shouldScrollDown()) {
        const speed = this.speed('down')
        delta.y = speed
      }
      // X movement
      if (movementDirection.x === 'left' && cursorIsLeftSide && window.scrollX) {
        const speed = this.speed('left')
        delta.x = -speed
      } else if (movementDirection.x === 'right' && cursorIsRightSide && this.shouldScrollRight()) {
        const speed = this.speed('right')
        delta.x = speed
      }
      delta = { x: Math.round(delta.x), y: Math.round(delta.y) }
      this.increasePageSize(delta)
      this.scrollBy(delta)
      if (scrollTimer) {
        window.requestAnimationFrame(this.scrollFrame)
      }
    },
    shouldScrollRight () {
      this.updatePageSizes()
      const scrolledTooFarRight = (window.scrollX + this.viewportWidth) > maxWidth
      return !scrolledTooFarRight
    },
    shouldScrollDown () {
      this.updatePageSizes()
      const scrolledTooFarDown = (window.scrollY + this.viewportHeight) > maxHeight
      return !scrolledTooFarDown
    },
    scrollBy (delta) {
      if (utils.isAndroid()) { return }
      const currentUserIsBoxSelecting = this.$store.state.currentUserIsBoxSelecting
      const isDraggingCard = this.$store.state.currentUserIsDraggingCard
      const isDraggingBox = this.$store.state.currentUserIsDraggingBox
      if (isDraggingCard || isDraggingBox) {
        this.$store.dispatch('history/pause')
        this.$store.dispatch('currentCards/move', delta)
        this.$store.dispatch('currentBoxes/move', delta)
      }
      currentCursorPage = { x: currentCursorPage.x + delta.x, y: currentCursorPage.y + delta.y }
      const event = {
        x: currentCursor.x,
        y: currentCursor.y,
        clientX: currentCursor.x,
        clientY: currentCursor.y,
        pageX: currentCursorPage.x,
        pageY: currentCursorPage.y
      }
      if (this.isDrawingConnection) {
        this.$store.commit('triggeredDrawConnectionFrame', event)
      }
      if (this.currentUserIsPainting && !currentUserIsBoxSelecting) {
        this.$store.commit('triggeredPaintFramePosition', event)
      }
      window.scrollBy({ left: delta.x, top: delta.y })
      prevCursor = currentCursor
    },

    // page size

    updatePageSizes () {
      this.$store.dispatch('updatePageSizes')
    },
    increasePageSize (delta) {
      if (delta.x > 0) {
        this.increasePageWidth(delta)
      }
      if (delta.y > 0) {
        this.increasePageHeight(delta)
      }
    },
    increasePageWidth (delta) {
      if (this.shouldPreventResize) { return }
      const cursorIsRightSideOfPage = (this.pageWidth - prevCursorPage.x) < scrollAreaWidth
      if (cursorIsRightSideOfPage) {
        const pageWidth = this.pageWidth
        const width = pageWidth + delta.x
        this.$store.commit('pageWidth', width)
      }
    },
    increasePageHeight (delta) {
      if (this.shouldPreventResize) { return }
      const cursorIsBottomSideOfPage = (this.pageHeight - prevCursorPage.y) < scrollAreaHeight
      if (cursorIsBottomSideOfPage) {
        const pageHeight = this.pageHeight
        const height = pageHeight + delta.y
        this.$store.commit('pageHeight', height)
      }
    },

    // end interactions

    stopScrollTimer () {
      window.cancelAnimationFrame(scrollTimer)
      scrollTimer = undefined
      prevCursor = undefined
      currentCursorPage = undefined
      movementDirection = {}
    },
    stopInteractions () {
      this.stopScrollTimer()
    }
  }
}
</script>
