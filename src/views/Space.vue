<template lang="pug">
main.space(
  @mousemove="interact"
  @touchmove="interact"
  @mouseup="stopInteractions"
  @touchend="stopInteractions"
  :class="{'is-interacting': isInteracting, 'is-inking': isInking}"
)
  svg.connections
    path(
      v-if="isDrawingConnection"
      fill="none"
      stroke="#333333"
      stroke-width="3"
      :d="currentConnectionPath"
    )
    template(v-for="connection in connections")
      Connection(
        :id="connection.id"
        :connectionType="connection.connectionType"
        :startBlockId="connection.startBlockId",
        :endBlockId="connection.endBlockId",
        :path="connection.path"
      )
  .blocks
    template(v-for="block in blocks")
      Block(
        :id="block.id"
        :x="block.x"
        :y="block.y"
        :z="block.z"
        :name="block.name"
      )
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
      if (this.$store.state.currentUserIsDrawingConnection) {
        return true
      } else { return false }
    },

    currentConnectionPath () {
      return this.$store.state.currentConnectionPath
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
      this.$store.commit('preventDraggedBlockFromClicking', true)
      this.$store.commit('currentDragBlockStartPosition', { x: endPosition.x, y: endPosition.y })
    },

    drawConnection (event) {
      const start = utils.elementCenter(this.$store.state.currentConnectionStart)
      const current = utils.cursorPosition(event)
      const path = utils.connectionPathBetweenCoords(start, current)
      this.getCurrentConnection(event)
      this.$store.commit('currentConnectionPath', path)
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

    isConnectedToSameConnector (currentConnection) {
      if (currentConnection) {
        return this.$store.state.currentConnectionStart.blockId === currentConnection.blockId
      }
    },

    getCurrentConnection (event) {
      const cursor = utils.cursorPosition(event)
      const currentConnection = this.connectors().find(connector => {
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
      if (currentConnection && !this.isConnectedToSameConnector(currentConnection)) {
        this.$store.commit('currentConnection', currentConnection)
      } else {
        this.$store.commit('currentConnection', undefined)
      }
    },

    createConnection () {
      const currentConnection = this.$store.state.currentConnection
      if (currentConnection) {
        let connection = {}
        connection.startBlockId = this.$store.state.currentConnectionStart.blockId
        connection.endBlockId = currentConnection.blockId
        connection.path = utils.connectionBetweenBlocks(connection.startBlockId, connection.endBlockId)
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
      this.$store.commit('currentConnectionPath', undefined)
      this.$store.commit('currentConnection', undefined)
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

svg
  position absolute
  top 0
  left 0
  width 100%
  height 100%
svg.current
  z-index 1
path
  pointer-events all
  cursor pointer

</style>
