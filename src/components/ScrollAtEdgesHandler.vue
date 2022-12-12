<template lang='pug'>
</template>

<script>
import utils from '@/utils.js'

import { mapState, mapGetters } from 'vuex'

const scrollArea = 50
let startCursor, prevCursor, prevCursorPage, endCursor, scrollTimer, maxHeight, maxWidth, currentEvent
let movementDirection = {}

export default {
  name: 'ScrollAtEdgesHandler',
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'currentUserIsPaintingLocked' && mutation.payload) {
        const position = this.triggeredPaintFramePosition
        const event = {
          clientX: position.x,
          clientY: position.y
        }
        this.stopScrollTimer()
        this.initInteractions(event)
      }
      if (mutation.type === 'triggeredTouchCardDragPosition') {
        const position = this.triggeredTouchCardDragPosition
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
    ...mapState([
      'viewportHeight',
      'viewportWidth',
      'pageHeight',
      'pageWidth',
      'currentUserIsPainting',
      'isDraggingCard',
      'currentUserIsDrawingConnection',
      'currentUserIsResizingCard',
      'currentUserIsBoxSelecting',
      'currentUserIsDraggingCard',
      'currentUserIsDraggingBox',
      'triggeredPaintFramePosition',
      'triggeredTouchCardDragPosition'
    ]),
    ...mapGetters([
      'spaceCounterZoomDecimal',
      'spaceZoomDecimal',
      'currentScrollPosition'
    ]),
    shouldPreventResize () { return this.currentUserIsPainting || this.currentUserIsDrawingConnection || this.currentUserIsResizingCard }
  },
  methods: {
    initInteractions (event) {
      currentEvent = event
      const position = utils.cursorPositionInViewport(event)
      const zoom = this.spaceZoomDecimal
      startCursor = position
      endCursor = position
      maxHeight = Math.max(6500, this.viewportHeight) * zoom
      maxWidth = Math.max(6500, this.viewportWidth) * zoom
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
      const cursorSide = {
        top: cursor.y <= scrollArea,
        bottom: cursor.y >= (viewportHeight - scrollArea),
        left: cursor.x <= scrollArea,
        right: cursor.x >= (viewportWidth - scrollArea)
      }
      const canScroll = {
        x: this.currentScrollPosition.x > 0,
        y: this.currentScrollPosition.y > 0
      }
      // Y movement
      if (movementDirection.y === 'up' && cursorSide.top && canScroll.y) {
        speed = this.speed(cursor, 'up')
        delta = {
          x: 0,
          y: -speed
        }
        this.scrollBy(delta)
      } else if (movementDirection.y === 'down' && cursorSide.bottom && this.shouldScrollDown()) {
        speed = this.speed(cursor, 'down')
        delta = {
          x: 0,
          y: speed
        }
        this.increasePageHeight(delta)
        this.scrollBy(delta)
      }
      // X movement
      if (movementDirection.x === 'left' && cursorSide.left && canScroll.x) {
        speed = this.speed(cursor, 'left')
        delta = {
          x: -speed,
          y: 0
        }
        this.scrollBy(delta)
      } else if (movementDirection.x === 'right' && cursorSide.right && this.shouldScrollRight()) {
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
      const cursorSideIsPageRight = (this.pageWidth - prevCursorPage.x) < scrollArea
      if (cursorSideIsPageRight) {
        const pageWidth = this.pageWidth
        const width = pageWidth + delta.x
        this.$store.commit('pageWidth', width)
      }
    },
    increasePageHeight (delta) {
      if (this.shouldPreventResize) { return }
      const cursorSideIsPageBottom = (this.pageHeight - prevCursorPage.y) < scrollArea
      if (cursorSideIsPageBottom) {
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
      const isDraggingItem = this.currentUserIsDraggingCard || this.currentUserIsDraggingBox
      delta = {
        x: Math.round(delta.x * zoom),
        y: Math.round(delta.y * zoom),
        behavior: 'auto'
      }
      if (isDraggingItem) {
        const slowMultiplier = 0.9
        const itemDelta = {
          x: delta.x * slowMultiplier,
          y: delta.y * slowMultiplier
        }
        this.$store.dispatch('history/pause')
        this.$store.dispatch('currentCards/move', { endCursor, prevCursor, delta: itemDelta })
        this.$store.dispatch('currentBoxes/move', { endCursor, prevCursor, delta: itemDelta })
      }
      if (this.currentUserIsDrawingConnection) {
        this.$store.commit('triggeredDrawConnectionFrame', currentEvent)
      }
      if (this.currentUserIsPainting && !this.currentUserIsBoxSelecting) {
        this.$store.commit('triggeredPaintFramePosition', currentEvent)
      }
      this.$store.commit('triggerScrollBy', delta)
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
