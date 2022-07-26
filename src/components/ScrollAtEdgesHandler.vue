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
      if (mutation.type === 'currentUserIsPaintingLocked') {
        const position = this.$store.state.triggeredPaintFramePosition
        const event = {
          clientX: position.x,
          clientY: position.y
        }
        this.initInteractions(event)
      }
      if (mutation.type === 'triggeredTouchCardDragPosition') {
        const position = this.$store.state.triggeredTouchCardDragPosition
        const event = {
          clientX: position.x,
          clientY: position.y
        }
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
      if (!cursor.x) { return }
      const currentScroll = utils.currentScroll()
      const cursorIsTopSide = cursor.y <= scrollAreaHeight
      const cursorIsBottomSide = cursor.y >= (viewportHeight - scrollAreaHeight)
      const cursorIsLeftSide = cursor.x <= scrollAreaWidth
      const cursorIsRightSide = cursor.x >= (viewportWidth - scrollAreaWidth)
      // Y movement
      // Up
      if (movementDirection.y === 'up' && cursorIsTopSide && currentScroll.y) {
        speed = this.speed(cursor, 'up')
        delta = {
          x: 0,
          y: -speed
        }
        this.scrollBy(delta)
      // Down
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
      // Left
      if (movementDirection.x === 'left' && cursorIsLeftSide && currentScroll.x) {
        speed = this.speed(cursor, 'left')
        delta = {
          x: -speed,
          y: 0
        }
        this.scrollBy(delta)
      // Right
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
      const currentScroll = utils.currentScroll()
      const scrolledTooFarRight = (currentScroll.x + this.viewportWidth) > maxWidth
      return !scrolledTooFarRight
    },
    shouldScrollDown () {
      this.updatePageSizes()
      const currentScroll = utils.currentScroll()
      const scrolledTooFarDown = (currentScroll.y + this.viewportHeight) > maxHeight
      return !scrolledTooFarDown
    },
    scrollBy (delta) {
      const zoom = this.spaceCounterZoomDecimal
      const currentUserIsBoxSelecting = this.$store.state.currentUserIsBoxSelecting
      delta.left = delta.x * 1.1
      delta.top = delta.y
      delta.x = delta.x * zoom
      delta.y = delta.y * zoom
      const cursor = this.cursor()
      if (this.isDraggingCard) {
        this.$store.dispatch('currentCards/move', { endCursor, prevCursor, delta })
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
      const minSpeed = 1
      const maxSpeed = 30
      const maxSpeedOutsideWindow = 60
      const multiplier = 0.15
      const viewportHeight = this.viewportHeight
      const viewportWidth = this.viewportWidth
      const directionY = direction === 'up' || direction === 'down'
      const directionX = direction === 'left' || direction === 'right'
      let scrollAreaSize, viewportSize, percent
      if (directionX) {
        scrollAreaSize = scrollAreaWidth
        cursor = cursor.x
        viewportSize = viewportWidth
      } else if (directionY) {
        scrollAreaSize = scrollAreaHeight
        cursor = cursor.y
        viewportSize = viewportHeight
      }
      if (direction === 'up' || direction === 'left') {
        const amount = Math.abs(cursor - scrollAreaSize)
        percent = amount / scrollAreaSize
      }
      if (direction === 'down' || direction === 'right') {
        const amount = Math.abs(cursor - (viewportSize - scrollAreaSize))
        percent = amount / scrollAreaSize
      }
      let amount = percent * scrollAreaSize
      amount = Math.round(amount * multiplier)
      amount = Math.max(amount, minSpeed)
      if (percent > 1) {
        amount = Math.min(amount, maxSpeedOutsideWindow)
      } else {
        amount = Math.min(amount, maxSpeed)
      }
      return amount
    },
    updatePageSizes () {
      this.$store.dispatch('updatePageSizes')
    },
    stopInteractions () {
      window.cancelAnimationFrame(scrollTimer)
      this.$store.dispatch('currentCards/afterMove')
      scrollTimer = undefined
      prevCursor = undefined
      movementDirection = {}
    }
  }
}
</script>
