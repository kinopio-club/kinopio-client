<template lang="pug">
main.space(
  @mousedown="initInteractions"
  @touchstart="initInteractions"
  @mouseup="stopInteractions"
  @touchend="stopInteractions"
  @mousemove="interact"
  @touchmove="interact"
  :class="{'is-interacting': isInteracting, 'is-inking': isInking}"
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

let startCursor, prevCursor, endCursor

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
      currentConnectionPath: undefined
    }
  },
  computed: {
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
    initInteractions (event) {
      startCursor = utils.cursorPositionInViewport(event)
    },

    interact (event) {
      if (this.$store.state.currentUserIsDraggingBlock) {
        this.dragBlock(event)
      }
      if (this.$store.state.currentUserIsDrawingConnection) {
        this.drawConnection(event)
      }
    },

    checkShouldShowDetails () {
      if (!utils.cursorsAreClose(startCursor, endCursor)) {
        this.$store.commit('preventDraggedBlockFromShowingDetails', true)
      }
    },

    dragBlock (event) {
      endCursor = utils.cursorPositionInViewport(event)
      const prev = prevCursor || startCursor
      this.$store.dispatch('currentSpace/dragBlocks', {
        endCursor,
        prevCursor: prev
      })
      prevCursor = utils.cursorPositionInViewport(event)
      this.checkShouldShowDetails()
    },

    drawConnection (event) {
      const startRect = this.$store.state.currentConnection.startConnectorRect
      const start = utils.elementCenter(startRect)
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
      if (event.target.closest('dialog')) { return }
      if (this.shouldContinueConnecting()) { return }
      if (this.$store.state.currentUserIsDrawingConnection) {
        this.createConnection()
      }
      this.$store.commit('currentUserIsDrawingConnection', false)
      this.$store.commit('currentUserIsInkingLocked', false)
      this.$store.commit('currentUserIsDraggingBlock', false)
      this.$store.commit('currentConnectionSuccess', {})
      this.$store.commit('currentConnection', {})
      this.$store.commit('multipleBlocksSelected', [])
      this.currentConnectionPath = undefined
      prevCursor = undefined
    }
  }

}
</script>

<style lang="stylus">
.space
  position absolute
  pointer-events none // so that inking can receive events
  width 100%
  height 100%
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
