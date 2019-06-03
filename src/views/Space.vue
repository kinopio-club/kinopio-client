<template lang="pug">
main.space(
  @mousemove="interact"
  @touchmove="interact"
  @mouseup="stopInteractions"
  @touchend="stopInteractions"
  :class="{interacting: isInteracting}"
)
  svg.current(v-if="isDrawingConnection")
    path(
      fill="none"
      stroke="#333333"
      stroke-width="3"
      :d="currentConnectionPath"
    )
  Connections
  article(v-for="card in cards")
    Card(
      :id="card.id"
      :x="card.x"
      :y="card.y"
      :name="card.name"
    )
  Footer
</template>

<script>
import utils from '@/utils.js'
import Connections from '@/components/Connections.vue'
import Card from '@/components/Card.vue'
import Footer from '@/components/Footer.vue'

export default {
  components: {
    Connections,
    Card,
    Footer
  },
  computed: {
    cards () {
      return this.$store.state.currentSpace.cards
    },
    isInteracting () {
      const draggingCard = this.$store.state.currentUserIsDraggingCard
      const drawingConnection = this.$store.state.currentUserIsDrawingConnection
      if (draggingCard || drawingConnection) {
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
    }

  },

  methods: {
    interact (event) {
      if (this.$store.state.currentUserIsDraggingCard) {
        this.dragCard(event)
      }
      if (this.$store.state.currentUserIsDrawingConnection) {
        this.drawConnection(event)
      }
    },

    dragCard (event) {
      const endPosition = utils.cursorPosition(event)
      this.$store.dispatch('currentSpace/dragCard', endPosition)
      this.$store.commit('preventDraggedCardFromClicking', true)
      // ?create offset based on scrollto position

      this.$store.commit('currentDragCardStartPosition', { x: endPosition.x, y: endPosition.y })
    },

    drawConnection (event) {
      console.log('draw connection')
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
          cardId: connector.dataset.cardId,
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height
        }
      })
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
      if (currentConnection) {
        this.$store.commit('currentConnection', currentConnection)
      } else {
        this.$store.commit('currentConnection', undefined)
      }
    },

    createConnection () {
      const currentConnection = this.$store.state.currentConnection
      if (currentConnection) {
        let connection = {}
        connection.startCardId = this.$store.state.currentConnectionStart.cardId
        connection.endCardId = parseInt(currentConnection.cardId)
        connection.path = utils.connectionBetweenCards(connection.startCardId, connection.endCardId)
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
      this.$store.commit('scrollOnViewportEdges', false)
      this.$store.commit('currentUserIsDraggingCard', false)
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
.interacting
  pointer-events all
// TODO space not-interactable !important if inking

svg
  position absolute
  top 0
  left 0
  width 100%
  height 100vh
svg.current
  z-index: 1
path
  pointer-events all
  cursor pointer

</style>
