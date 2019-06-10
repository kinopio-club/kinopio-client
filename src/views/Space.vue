<template lang="pug">
main.space(
  @mousemove="interact"
  @touchmove="interact"
  @mouseup="stopInteractions"
  @touchend="stopInteractions"
  :class="{'is-interacting': isInteracting, 'is-inking': isInking}"
)
  svg.connections
    path.current-connection(
      v-if="isDrawingConnection"
      fill="none"
      stroke="#333333"
      stroke-width="3"
      :d="currentPath"
    )
    template(v-for="connection in connections")
      Connection(:connection="connection")
  .blocks
    template(v-for="block in blocks")
      Block(:block="block")
  Footer
</template>

<script>
import utils from '@/utils.js'
import Connection from '@/components/Connection.vue'
import Block from '@/components/Block.vue'
import Footer from '@/components/Footer.vue'

export default {
  components: {
    Block,
    Connection,
    Footer
  },
  name: 'Space',
  data () {
    return {
      currentPath: undefined
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
    interact (event) {
      if (this.$store.state.currentUserIsDraggingBlock) {
        this.dragBlock(event)
      }
      if (this.$store.state.currentUserIsDrawingConnection) {
        this.drawConnection(event)
      }
    },

    dragBlock (event) {
      const endPosition = utils.cursorPosition(event)
      this.$store.dispatch('currentSpace/dragBlock', endPosition)
      this.$store.commit('preventDraggedBlockFromOpeningAfterDrag', true)
      this.$store.commit('currentDraggingBlock', { x: endPosition.x, y: endPosition.y })
    },

    drawConnection (event) {
      const startRect = this.$store.state.currentConnection.startConnectorRect
      const start = utils.elementCenter(startRect)
      const current = utils.cursorPosition(event)
      const path = utils.connectionPathBetweenCoords(start, current)
      this.checkCurrentConnectionSuccess(event)
      this.currentPath = path
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

    isConnectedToSameConnector (connection) {
      if (connection) {
        return this.$store.state.currentConnection.startBlockId === connection.blockId
      }
    },

    checkCurrentConnectionSuccess (event) {
      const cursor = utils.cursorPosition(event)
      const successfulConnectionToConnector = this.connectors().find(connector => {
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
      if (!this.isConnectedToSameConnector(successfulConnectionToConnector)) {
        this.$store.commit('currentConnectionSuccess', successfulConnectionToConnector)
      }
    },

    createConnection () {
      const currentConnectionSuccess = this.$store.state.currentConnectionSuccess
      if (currentConnectionSuccess) {
        const startBlockId = this.$store.state.currentConnection.startBlockId
        const endBlockId = currentConnectionSuccess.blockId
        const path = utils.connectionBetweenBlocks(startBlockId, endBlockId)
        const connection = { startBlockId, endBlockId, path }
        this.$store.commit('currentSpace/addConnection', connection)
        this.$store.dispatch('broadcast/addConnection', connection)
      }
    },

    stopInteractions () {
      console.log('💣 stopInteractions')
      if (this.$store.state.currentUserIsDrawingConnection) {
        this.createConnection()
      }
      this.$store.commit('currentUserIsDrawingConnection', false)
      this.$store.commit('currentUserIsInkingLocked', false)
      this.$store.commit('currentUserIsDraggingBlock', false)
      this.$store.commit('currentConnectionSuccess', {})
      this.currentPath = undefined
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

dialog
  width: 300px
  left: 8px
  top: 8px
  position: absolute
  margin 0
  padding 0
  user-select auto
  pointer-events all
  section
    padding 8px
  section + section
    border-bottom: 1px solid var(--primary)
</style>
