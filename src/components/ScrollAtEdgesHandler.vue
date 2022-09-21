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
    // init

    initCursors (event) {
      const position = utils.cursorPositionInSpaceViewport(event)
      startCursor = position
      endCursor = position
    },
    initMeasurements () {
      // const zoom = this.spaceZoomDecimal
      scrollAreaHeight = (this.viewportHeight / 8) // * zoom
      scrollAreaHeight = Math.max(50, scrollAreaHeight)
      scrollAreaWidth = (this.viewportWidth / 8) //* zoom
      scrollAreaWidth = Math.max(50, scrollAreaWidth)
      maxHeight = Math.max(6500, this.$store.state.viewportHeight) // * zoom
      maxWidth = Math.max(6500, this.$store.state.viewportWidth) // * zoom
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
    initInteractions (event) {
      this.initCursors(event)
      this.initMeasurements()
      const shouldScroll = this.$store.getters.shouldScrollAtEdges(event)
      if (shouldScroll) {
        this.updateMovementDirection()
      }
      if (shouldScroll && !scrollTimer) {
        scrollTimer = window.requestAnimationFrame(this.scrollFrame)
      }
    },
    cursor () {
      if (utils.objectHasKeys(prevCursor)) {
        return prevCursor
      } else {
        return startCursor
      }
    },

    // interactions

    interact (event) {
      if (this.$store.getters.shouldScrollAtEdges(event)) {
        this.updateMovementDirection()
      }
      prevCursor = utils.cursorPositionInSpaceViewport(event)
      prevCursorPage = utils.cursorPositionInPage(event)
    },
    speed (cursor, direction) {
      const minSpeed = 10
      const maxSpeed = 20
      const maxSpeedOutsideWindow = 50
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
      return speed
    },
    scrollFrame () {
      let delta = { x: 0, y: 0 }
      const viewportHeight = this.viewportHeight
      const viewportWidth = this.viewportWidth
      const cursor = this.cursor()
      const cursorIsTopSide = cursor.y <= scrollAreaHeight
      const cursorIsBottomSide = cursor.y >= (viewportHeight - scrollAreaHeight)
      const cursorIsLeftSide = cursor.x <= scrollAreaWidth
      const cursorIsRightSide = cursor.x >= (viewportWidth - scrollAreaWidth)
      // Y movement
      if (movementDirection.y === 'up' && cursorIsTopSide && window.scrollY) {
        const speed = this.speed(cursor, 'up')
        delta.y = -speed
      } else if (movementDirection.y === 'down' && cursorIsBottomSide && this.shouldScrollDown()) {
        const speed = this.speed(cursor, 'down')
        delta.y = speed
      }
      // X movement
      if (movementDirection.x === 'left' && cursorIsLeftSide && window.scrollX) {
        const speed = this.speed(cursor, 'left')
        delta.x = -speed
      } else if (movementDirection.x === 'right' && cursorIsRightSide && this.shouldScrollRight()) {
        const speed = this.speed(cursor, 'right')
        delta.x = speed
      }
      this.increasePageWidth(delta)
      this.scrollBy(delta)
      if (scrollTimer) {
        window.requestAnimationFrame(this.scrollFrame)
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
      if (utils.isAndroid()) { return }
      // let zoom = this.spaceZoomDecimal
      // if (zoom === 1) {
      //   const viewport = utils.visualViewport()
      //   zoom = viewport.scale
      // }
      const currentUserIsBoxSelecting = this.$store.state.currentUserIsBoxSelecting
      const isDraggingCard = this.$store.state.currentUserIsDraggingCard
      const isDraggingBox = this.$store.state.currentUserIsDraggingBox
      const isDraggingItem = isDraggingCard || isDraggingBox
      delta = {
        left: Math.round(delta.x), //* zoom
        top: Math.round(delta.y) //* zoom
      }
      const cursor = this.cursor()
      if (isDraggingItem) {
        const slowMultiplier = 0.9
        const itemDelta = {
          x: delta.left * slowMultiplier,
          y: delta.top * slowMultiplier
        }
        this.$store.dispatch('history/pause')
        if (isDraggingCard || isDraggingBox) {
          this.$store.dispatch('currentCards/move', { endCursor, prevCursor, delta: itemDelta })
          this.$store.dispatch('currentBoxes/move', { endCursor, prevCursor, delta: itemDelta })
        }
      }
      if (this.isDrawingConnection) {
        this.$store.commit('triggeredDrawConnectionFrame', cursor)
      }
      if (this.currentUserIsPainting && !currentUserIsBoxSelecting) {
        this.$store.commit('triggeredPaintFramePosition', cursor)
      }
      window.scrollBy(delta)
    },
    updatePageSizes () {
      this.$store.dispatch('updatePageSizes')
    },

    // end interactions

    stopScrollTimer () {
      window.cancelAnimationFrame(scrollTimer)
      scrollTimer = undefined
      prevCursor = undefined
      movementDirection = {}
    },
    stopInteractions () {
      this.stopScrollTimer()
    }
  }
}
</script>
