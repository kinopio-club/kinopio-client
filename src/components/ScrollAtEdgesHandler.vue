<template lang='pug'>
</template>

<script>
import utils from '@/utils.js'

let startCursor, prevCursor, prevCursorPage, endCursor, scrollTimer, scrollAreaHeight, scrollAreaWidth, maxHeight, maxWidth
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
    initInteractions (event) {
      const position = utils.cursorPositionInViewport(event)
      const zoom = this.spaceZoomDecimal
      startCursor = position
      endCursor = position
      scrollAreaHeight = (this.viewportHeight / 8) * zoom
      scrollAreaHeight = Math.max(50, scrollAreaHeight)
      scrollAreaWidth = (this.viewportWidth / 8) * zoom
      scrollAreaWidth = Math.max(50, scrollAreaWidth)
      maxHeight = Math.max(6500, this.$store.state.viewportHeight) * zoom
      maxWidth = Math.max(6500, this.$store.state.viewportWidth) * zoom
      if (this.$store.getters.shouldScrollAtEdges(event)) {
        this.updateMovementDirection()
      }
      if (this.$store.getters.shouldScrollAtEdges(event) && !scrollTimer) {
        scrollTimer = window.requestAnimationFrame(this.scrollFrame)
      }
    },
    interact (event) {
      if (this.$store.getters.shouldScrollAtEdges(event)) {
        this.updateMovementDirection()
      }
      prevCursor = utils.cursorPositionInViewport(event)
      prevCursorPage = utils.cursorPositionInPage(event)
    },
    scrollFrame () {
      let delta, speed
      const viewportHeight = this.viewportHeight
      const viewportWidth = this.viewportWidth
      const cursor = this.cursor()
      const cursorIsTopSide = cursor.y <= scrollAreaHeight
      const cursorIsBottomSide = cursor.y >= (viewportHeight - scrollAreaHeight)
      const cursorIsLeftSide = cursor.x <= scrollAreaWidth
      const cursorIsRightSide = cursor.x >= (viewportWidth - scrollAreaWidth)
      // Y movement
      if (movementDirection.y === 'up' && cursorIsTopSide && window.scrollY) {
        speed = this.speed(cursor, 'up')
        delta = {
          x: 0,
          y: -speed
        }
        this.scrollBy(delta)
      } else if (movementDirection.y === 'down' && cursorIsBottomSide && this.shouldScrollDown()) {
        speed = this.speed(cursor, 'down')
        delta = {
          x: 0,
          y: speed
        }
        this.increasePageHeight(delta)
        this.scrollBy(delta)
      }
      // X movement
      if (movementDirection.x === 'left' && cursorIsLeftSide && window.scrollX) {
        speed = this.speed(cursor, 'left')
        delta = {
          x: -speed,
          y: 0
        }
        this.scrollBy(delta)
      } else if (movementDirection.x === 'right' && cursorIsRightSide && this.shouldScrollRight()) {
        speed = this.speed(cursor, 'right')
        delta = {
          x: speed,
          y: 0
        }
        this.increasePageWidth(delta)
        this.scrollBy(delta)
      }
      if (scrollTimer) {
        window.requestAnimationFrame(this.scrollFrame)
      }
    },
    cursor () {
      if (utils.objectHasKeys(prevCursor)) {
        return prevCursor
      } else {
        return startCursor
      }
    },
    updateMovementDirection () {
      const cursor = this.cursor()
      const xMove = endCursor.x - cursor.x
      const yMove = endCursor.y - cursor.y
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
      let zoom = this.spaceZoomDecimal
      if (zoom === 1) {
        const viewport = utils.visualViewport()
        zoom = viewport.scale
      }
      const currentUserIsBoxSelecting = this.$store.state.currentUserIsBoxSelecting
      console.log('🍅', delta, zoom)
      delta = {
        left: Math.round(delta.x * zoom),
        top: Math.round(delta.y * zoom)
      }
      console.log('🍅🍅', delta)
      const cursor = this.cursor()
      if (this.isDraggingCard) {
        const slowMultiplier = 0.9
        const cardDelta = {
          x: delta.left * slowMultiplier,
          y: delta.top * slowMultiplier
        }
        this.$store.dispatch('history/pause')
        this.$store.dispatch('currentCards/move', { endCursor, prevCursor, delta: cardDelta })
      }
      if (this.isDrawingConnection) {
        this.$store.commit('triggeredDrawConnectionFrame', cursor)
      }
      if (this.currentUserIsPainting && !currentUserIsBoxSelecting) {
        this.$store.commit('triggeredPaintFramePosition', cursor)
      }
      window.scrollBy(delta)
    },
    speed (cursor, direction) {
      const minSpeed = 20
      const maxSpeed = 30
      const maxSpeedOutsideWindow = 60
      const viewportHeight = this.viewportHeight
      const viewportWidth = this.viewportWidth
      // viewportSize based on direction
      const directionIsY = direction === 'up' || direction === 'down'
      const directionIsX = direction === 'left' || direction === 'right'
      let scrollAreaSize, viewportSize
      if (directionIsX) {
        scrollAreaSize = scrollAreaWidth
        cursor = cursor.x
        viewportSize = viewportWidth
      } else if (directionIsY) {
        scrollAreaSize = scrollAreaHeight
        cursor = cursor.y
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
      console.log('🏎', direction, viewportSize, scrollAreaSize, cursor, amount, percent, speed)
      return speed
    },
    updatePageSizes () {
      this.$store.dispatch('updatePageSizes')
    },
    stopScrollTimer () {
      window.cancelAnimationFrame(scrollTimer)
      scrollTimer = undefined
      prevCursor = undefined
      movementDirection = {}
    },
    stopInteractions () {
      this.stopScrollTimer()
      this.$store.dispatch('currentCards/afterMove')
    }
  }
}
</script>
