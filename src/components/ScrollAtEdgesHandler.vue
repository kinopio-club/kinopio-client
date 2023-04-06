<template lang='pug'>
</template>

<script>
import utils from '@/utils.js'

const scrollArea = 50
let startCursor, prevCursor, prevCursorPage, endCursor, scrollTimer, maxHeight, maxWidth, currentEvent
let movementDirection = {}

export default {
  name: 'ScrollAtEdgesHandler',
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'currentUserIsPaintingLocked' && mutation.payload) {
        const event = mutation.payload
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
      currentEvent = event
      const position = utils.cursorPositionInViewport(event)
      const zoom = this.spaceZoomDecimal
      startCursor = position
      endCursor = position
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
      currentEvent = event
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
      const cursorIsTopSide = cursor.y <= scrollArea
      const cursorIsBottomSide = cursor.y >= (viewportHeight - scrollArea)
      const cursorIsLeftSide = cursor.x <= scrollArea
      const cursorIsRightSide = cursor.x >= (viewportWidth - scrollArea)
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
      const cursorIsRightSideOfPage = (this.pageWidth - prevCursorPage.x) < scrollArea
      if (cursorIsRightSideOfPage) {
        const pageWidth = this.pageWidth
        const width = pageWidth + delta.x
        this.$store.commit('pageWidth', width)
      }
    },
    increasePageHeight (delta) {
      if (this.shouldPreventResize) { return }
      const cursorIsBottomSideOfPage = (this.pageHeight - prevCursorPage.y) < scrollArea
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
      let zoom = this.spaceZoomDecimal
      if (zoom === 1) {
        const viewport = utils.visualViewport()
        zoom = viewport.scale
      }
      const currentUserIsBoxSelecting = this.$store.state.currentUserIsBoxSelecting
      const isDraggingCard = this.$store.state.currentUserIsDraggingCard
      const isDraggingBox = this.$store.state.currentUserIsDraggingBox
      const isDraggingItem = isDraggingCard || isDraggingBox
      delta = {
        left: Math.round(delta.x * zoom),
        top: Math.round(delta.y * zoom)
      }
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
        this.$store.commit('triggerDrawConnectionFrame', currentEvent)
      }
      if (this.currentUserIsPainting && !currentUserIsBoxSelecting) {
        this.$store.commit('triggerPaintFramePosition', currentEvent)
      }
      window.scrollBy(delta)
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
      let viewportSize
      if (directionIsX) {
        cursor = cursor.x
        viewportSize = viewportWidth
      } else if (directionIsY) {
        cursor = cursor.y
        viewportSize = viewportHeight
      }
      // calc percent over scrollArea
      let amount
      if (direction === 'up' || direction === 'left') {
        amount = Math.abs(cursor - scrollArea)
      }
      if (direction === 'down' || direction === 'right') {
        amount = Math.abs(cursor - (viewportSize - scrollArea))
      }
      let percent = utils.roundFloat(amount / scrollArea)
      // speed
      let speed = percent * scrollArea
      speed = Math.max(speed, minSpeed)
      if (percent > 1) {
        speed = Math.min(speed, maxSpeedOutsideWindow)
      } else {
        speed = Math.min(speed, maxSpeed)
      }
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
    }
  }
}
</script>
