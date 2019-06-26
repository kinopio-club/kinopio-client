<template lang="pug">
main.space(
  :class="{'is-interacting': isInteracting, 'is-inking': isInking}"
  @mousedown="initInteractions"
  @touchstart="initInteractions"
  :style="size"
)
  svg.connections
    path.current-connection(
      v-if="isDrawingConnection"
      fill="none"
      stroke="#333333"
      stroke-width="3"
      :d="currentConnectionPath"
    )
    template(v-for="connection in connections")
      Connection(:connection="connection")
  .blocks
    template(v-for="block in blocks")
      Block(:block="block")
  ConnectionDetails
  MultipleBlockActions
  Footer
</template>

<script>
import utils from '@/utils.js'
import Connection from '@/components/Connection.vue'
import ConnectionDetails from '@/components/pop-overs/ConnectionDetails.vue'
import Block from '@/components/Block.vue'
import MultipleBlockActions from '@/components/pop-overs/MultipleBlockActions.vue'
import Footer from '@/components/Footer.vue'

let startCursor, prevCursor, endCursor, scrollTimer, viewportWidth, viewportHeight, scrollAreaWidth, scrollAreaHeight
let movementDirection = {}

export default {
  components: {
    Block,
    Connection,
    ConnectionDetails,
    MultipleBlockActions,
    Footer
  },
  name: 'Space',

  data () {
    return {
      currentConnectionPath: undefined,
      pageWidth: undefined,
      pageHeight: undefined
    }
  },

  mounted () {
    // have to bind events to window to receive events when mouse is outside window
    window.addEventListener('mousemove', this.interact)
    window.addEventListener('touchmove', this.interact)
    window.addEventListener('mouseup', this.stopInteractions)
    window.addEventListener('touchend', this.stopInteractions)
    // keep space element updated to viewport size so connections show up
    this.updateSpaceSize()
    window.addEventListener('resize', this.updateSpaceSize)
    window.addEventListener('scroll', this.updateSpaceSize) // potential perf issue during dragging
  },

  computed: {
    size () {
      return {
        width: `${this.pageWidth}px`,
        height: `${this.pageHeight}px`
      }
    },
    blocks () {
      return this.$store.state.currentSpace.blocks
    },
    isInking () {
      const currentUserIsInking = this.$store.state.currentUserIsInking
      if (currentUserIsInking) {
        return true
      } else { return false }
    },
    isInteracting () {
      const draggingBlock = this.$store.state.currentUserIsDraggingBlock
      const drawingConnection = this.$store.state.currentUserIsDrawingConnection
      if (draggingBlock || drawingConnection) {
        return true
      } else { return false }
    },

    isDrawingConnection () {
      return this.$store.state.currentUserIsDrawingConnection
    },

    connections () {
      return this.$store.state.currentSpace.connections
    }
  },
  methods: {
    // debounce? https://alligator.io/vuejs/lodash-throttle-debounce/
    updateSpaceSize () {
      console.log('updateSpaceSize space')
      const body = document.body
      const html = document.documentElement
      this.pageWidth = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth)
      this.pageHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
      viewportWidth = document.documentElement.clientWidth
      viewportHeight = document.documentElement.clientHeight
      scrollAreaWidth = viewportWidth / 3
      scrollAreaHeight = viewportHeight / 3
    },

    initInteractions (event) {
      startCursor = utils.cursorPositionInViewport(event)
      if (this.$store.getters.viewportIsLocked && !scrollTimer) {
        scrollTimer = window.requestAnimationFrame(this.scrollFrame)
      }
    },

    interact (event) {
      if (this.$store.state.currentUserIsDraggingBlock) {
        this.dragBlock(event)
      }
      if (this.$store.state.currentUserIsDrawingConnection) {
        this.drawConnection(event)
      }
      if (this.$store.getters.viewportIsLocked) {
        this.updateMovementDirection()
      }
      prevCursor = utils.cursorPositionInViewport(event)
    },

    checkShouldShowDetails () {
      if (!utils.cursorsAreClose(startCursor, endCursor)) {
        this.$store.commit('preventDraggedBlockFromShowingDetails', true)
      }
    },

    // ✅ calc scrollAreaWidth and scrollAreaHeight = 33% of current viewport size

    // ✅ calc movementDirection
    // ✅ 1 speed for now

    // ✅ do the window.scrollBy
    // ✅ change to multi speed calc

    // last stage: experiment with debouncing to improve CPU/repaint perf

    scrollBy (delta) {
      delta.left = delta.x
      delta.top = delta.y
      if (this.$store.state.currentUserIsDraggingBlock) {
        this.$store.dispatch('currentSpace/dragBlocks', { delta })
      }
      window.scrollBy(delta)
    },

    speed (cursor, direction) {
      let multiplier
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
      console.log(multiplier)

      return 5 // temp, 1 speed for now
    },

    scrollFrame () {
      let delta, speed
      const cursor = this.cursor()
      const cursorIsTopSide = cursor.y <= scrollAreaHeight
      const cursorIsBottomSide = cursor.y >= viewportHeight - scrollAreaHeight
      const cursorIsLeftSide = cursor.x <= scrollAreaWidth
      const cursorIsRightSide = cursor.x >= viewportWidth - scrollAreaWidth
      const hasRoomToScrollUp = window.scrollY > 0
      const hasRoomToScrollLeft = window.scrollX > 0
      // const hasRoomToScrollDown = viewportHeight + window.scrollX > this.pageHeight

      // 🔼
      if (cursorIsTopSide && hasRoomToScrollUp && movementDirection.y === 'up') {
        // console.log('📮move up')// window.scrollBy(x, y)
        speed = this.speed(cursor, 'up')
        delta = {
          x: 0,
          y: -speed
        }
        this.scrollBy(delta)
      // 🔽
      } else if (cursorIsBottomSide && movementDirection.y === 'down') {
        // console.log('📮move down', hasRoomToScrollDown)
        // if (!hasRoomToScrollDown) {
        //   console.log('🐸🐸🐸🐸at end')
        // }
        // this.height += speed
        speed = this.speed(cursor, 'down')
        delta = {
          x: 0,
          y: speed
        }
        this.scrollBy(delta)
      }
      // ◀️
      if (cursorIsLeftSide && hasRoomToScrollLeft && movementDirection.x === 'left') {
        // console.log('📮move left')
        speed = this.speed(cursor, 'left')
        delta = {
          x: -speed,
          y: 0
        }
        this.scrollBy(delta)
      // ▶️
      } else if (cursorIsRightSide && movementDirection.x === 'right') {
        // console.log('📮move right')
        speed = this.speed(cursor, 'right')
        delta = {
          x: speed,
          y: 0
        }
        this.scrollBy(delta)
      }

      if (scrollTimer) {
        window.requestAnimationFrame(this.scrollFrame)
      }
    },

    updateMovementDirection () {
      const cursor = this.cursor()
      const xMove = endCursor.x - cursor.x
      const yMove = endCursor.y - cursor.y
      if (Math.sign(yMove) === -1) {
        movementDirection.y = 'up'
      } else if (Math.sign(yMove) === 1) {
        movementDirection.y = 'down'
      }
      if (Math.sign(xMove) === -1) {
        movementDirection.x = 'left'
      } else if (Math.sign(xMove) === 1) {
        movementDirection.x = 'right'
      }
    },

    cursor () {
      if (utils.objectHasProperties(prevCursor)) {
        return prevCursor
      } else {
        return startCursor
      }
    },

    dragBlock (event) {
      const cursor = this.cursor()
      endCursor = utils.cursorPositionInViewport(event)

      this.$store.dispatch('currentSpace/dragBlocks', {
        endCursor,
        prevCursor: cursor
      })

      this.checkShouldShowDetails()
    },

    drawConnection (event) {
      const startBlockId = this.$store.state.currentConnection.startBlockId
      const start = utils.connectorCoords(startBlockId)
      const current = utils.cursorPositionInViewport(event)
      const path = utils.connectionPathBetweenCoords(start, current)
      this.checkCurrentConnectionSuccess(event)
      this.currentConnectionPath = path
      this.$store.dispatch('broadcast/connectingPaths', path)
    },

    connectors () {
      const connectorElements = document.querySelectorAll('.connector')
      const connectors = Array.from(connectorElements)
      return connectors.map(connector => {
        const element = connector.getBoundingClientRect()
        return {
          blockId: connector.dataset.blockId,
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height
        }
      })
    },

    checkCurrentConnectionSuccess (event) {
      const cursor = utils.cursorPositionInViewport(event)
      const connection = this.connectors().find(connector => {
        const xValues = {
          value: cursor.x,
          min: connector.x,
          max: (connector.x + connector.width)
        }
        const yValues = {
          value: cursor.y,
          min: connector.y,
          max: (connector.y + connector.height)
        }
        const inXRange = utils.between(xValues)
        const inYRange = utils.between(yValues)
        return inXRange && inYRange
      })
      if (!connection) {
        this.$store.commit('currentConnectionSuccess', {})
        return
      }
      if (this.$store.state.currentConnection.startBlockId !== connection.blockId) {
        this.$store.commit('currentConnectionSuccess', connection)
      } else {
        this.$store.commit('currentConnectionSuccess', {})
      }
    },

    createConnection () {
      const currentConnectionSuccess = this.$store.state.currentConnectionSuccess
      if (currentConnectionSuccess.blockId) {
        const startBlockId = this.$store.state.currentConnection.startBlockId
        const endBlockId = currentConnectionSuccess.blockId
        const path = utils.connectionBetweenBlocks(startBlockId, endBlockId)
        const connection = { startBlockId, endBlockId, path }
        this.$store.commit('currentSpace/addConnection', connection)
        this.$store.dispatch('broadcast/addConnection', connection)
      }
    },

    shouldContinueConnecting () {
      const cursorStart = this.$store.state.currentConnectionCursorStart
      const cursorEnd = utils.cursorPositionInViewport(event)
      if (!this.$store.state.currentUserIsDrawingConnection) { return }
      if (cursorStart.x === cursorEnd.x && cursorStart.y === cursorEnd.y) {
        return true
      } else {
        return false
      }
    },

    stopInteractions (event) {
      console.log('💣 stopInteractions')
      window.cancelAnimationFrame(scrollTimer)
      scrollTimer = undefined
      if (event.target.closest('dialog')) { return }
      if (this.shouldContinueConnecting()) { return }
      if (this.$store.state.currentUserIsDrawingConnection) {
        this.createConnection()
      }
      this.$store.commit('preventDraggedBlockFromShowingDetails', false)
      this.$store.commit('currentUserIsDrawingConnection', false)
      this.$store.commit('currentUserIsInkingLocked', false)
      this.$store.commit('currentUserIsDraggingBlock', false)
      this.$store.commit('currentConnectionSuccess', {})
      this.$store.commit('currentConnection', {})
      this.currentConnectionPath = undefined
      prevCursor = undefined
      movementDirection = {}
    }
  }

}
</script>

<style lang="stylus">
.space
  pointer-events none // so that inking can receive events
  width 100%
  height 100vh
.is-interacting
  pointer-events all
.is-inking
  *
    pointer-events: none !important

svg.connections
  position absolute
  top 0
  left 0
  width 100%
  height 100%
  path
    pointer-events all
    cursor pointer
    &.current-connection
      pointer-events none
</style>
