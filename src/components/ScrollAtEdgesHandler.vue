<template lang='pug'>
</template>

<script>
import utils from '@/utils.js'

let startCursor, prevCursor, prevCursorPage, endCursor, scrollTimer, scrollAreaHeight, scrollAreaWidth, maxHeight, maxWidth
let movementDirection = {}

export default {
  name: 'ScrollAtEdgesHandler',
  mounted () {
    window.addEventListener('mousedown', this.initInteractions)
    window.addEventListener('touchstart', this.initInteractions)
    // bind events to window to receive events when mouse is outside window
    window.addEventListener('mousemove', this.interact)
    window.addEventListener('touchmove', this.interact)
    window.addEventListener('mouseup', this.stopInteractions)
    window.addEventListener('touchend', this.stopInteractions)
  },
  computed: {
    viewportHeight () { return this.$store.state.viewportHeight },
    viewportWidth () { return this.$store.state.viewportWidth },
    pageHeight () { return this.$store.state.pageHeight },
    pageWidth () { return this.$store.state.pageWidth },
    currentUserIsPainting () { return this.$store.state.currentUserIsPainting }, // dont add page size if currentUserIsPainting
    isDraggingCard () { return this.$store.state.currentUserIsDraggingCard },
    isDrawingConnection () { return this.$store.state.currentUserIsDrawingConnection }
  },
  methods: {
    initInteractions (event) {
      this.$store.commit('generateCardMap')
      const position = utils.cursorPositionInViewport(event)
      startCursor = position
      endCursor = position
      scrollAreaHeight = Math.max(50, this.viewportHeight / 8)
      scrollAreaWidth = Math.max(50, this.viewportWidth / 8)
      maxHeight = Math.max(2500, this.$store.state.viewportHeight)
      maxWidth = Math.max(2500, this.$store.state.viewportWidth)
      if (this.$store.getters.shouldScrollAtEdges) {
        this.updateMovementDirection()
      }
      if (this.$store.getters.shouldScrollAtEdges && !scrollTimer) {
        scrollTimer = window.requestAnimationFrame(this.scrollFrame)
      }
    },
    interact () {
      if (this.$store.getters.shouldScrollAtEdges) {
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
      const cursorIsBottomSide = cursor.y >= viewportHeight - scrollAreaHeight
      const cursorIsLeftSide = cursor.x <= scrollAreaWidth
      const cursorIsRightSide = cursor.x >= viewportWidth - scrollAreaWidth
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
      if (this.currentUserIsPainting || this.isDrawingConnection) { return }
      const cursorIsRightSideOfPage = (this.pageWidth - prevCursorPage.x) < scrollAreaWidth
      if (cursorIsRightSideOfPage) {
        const pageWidth = this.pageWidth
        const width = pageWidth + delta.x
        this.$store.commit('pageWidth', width)
      }
    },
    increasePageHeight (delta) {
      if (this.currentUserIsPainting || this.isDrawingConnection) { return }
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
      delta.left = delta.x * 1.1
      delta.top = delta.y
      const cursor = this.cursor()
      if (this.isDraggingCard) {
        this.$store.dispatch('currentSpace/dragCards', { delta })
      }
      if (this.isDrawingConnection) {
        this.$store.commit('triggeredDrawConnectionFrame', cursor)
      }
      if (this.currentUserIsPainting) {
        this.$store.commit('triggeredPaintFramePosition', cursor)
      }
      window.scrollBy(delta)
    },
    speed (cursor, direction) {
      let multiplier
      const base = 10
      const maxSpeed = 30
      const viewportHeight = this.viewportHeight
      const viewportWidth = this.viewportWidth
      if (direction === 'up') {
        multiplier = (scrollAreaHeight - cursor.y) / scrollAreaHeight
      }
      if (direction === 'down') {
        multiplier = (cursor.y - (viewportHeight - scrollAreaHeight) / scrollAreaHeight) / viewportHeight
      }
      if (direction === 'left') {
        multiplier = (scrollAreaWidth - cursor.x) / scrollAreaWidth
      }
      if (direction === 'right') {
        multiplier = (cursor.x - (viewportWidth - scrollAreaWidth) / scrollAreaWidth) / viewportWidth
      }
      return Math.min(base * (multiplier + (multiplier * 0.5)), maxSpeed)
    },
    updatePageSizes () {
      this.$store.commit('updatePageSizes')
    },
    stopInteractions () {
      window.cancelAnimationFrame(scrollTimer)
      scrollTimer = undefined
      prevCursor = undefined
      movementDirection = {}
    }
  }
}
</script>
