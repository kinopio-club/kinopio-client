<template lang="pug">
main.space(
  @mousemove="drawConnection"
  @touchmove="drawConnection"
  @mouseup="stopConnecting"
  @touchend="stopConnecting"
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
    }
  },

  methods: {

    drawConnection (event) {
      if (!this.$store.state.currentUserIsDrawingConnection) { return }
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

    isNewConnection (connector) {
      const connections = this.$store.state.currentSpace.connections
      const startId = this.$store.state.currentConnectionStart.cardId
      const endId = connector.cardId
      const connectedToSelf = startId === endId
      const connectionAlreadyExists = connections.find(connection => {
        let forwardMatch, backwardsMatch
        if (connection.startCardId === startId && connection.endCardId === endId) {
          forwardMatch = true
        }
        if (connection.startCardId === endId && connection.endCardId === startId) {
          backwardsMatch = true
        }
        if (forwardMatch || backwardsMatch) {
          return true
        }
      })
      if (!connectedToSelf && !connectionAlreadyExists) {
        return true
      }
    },

    getCurrentConnection (event) {
      const cursor = utils.cursorPosition(event)
      const currentConnection = this.connectors().find(connector => {
        const inXRange = utils.between(cursor.x, connector.x, connector.x + connector.width)
        const inYRange = utils.between(cursor.y, connector.y, connector.y + connector.height)
        const isNewConnection = this.isNewConnection(connector)
        return inXRange && inYRange && isNewConnection
      })
      if (currentConnection) {
        this.$store.commit('currentConnection', currentConnection)
      } else {
        this.$store.commit('currentConnection', undefined)
      }
    },

    clearConnection () {
      this.$store.commit('currentConnectionPath', '')
      this.$store.commit('currentConnection', undefined)
    },

    stopConnecting () {
      const currentConnection = this.$store.state.currentConnection
      if (currentConnection) {
        let connection = {}
        connection.startCardId = this.$store.state.currentConnectionStart.cardId
        connection.endCardId = currentConnection.cardId
        this.$store.commit('currentSpace/addConnection', connection)
        this.$store.dispatch('broadcast/addConnection', connection)
      }
      this.clearConnection()
      // if a connection is formed on end drawing .. then move the path into .connections
      // update the data model
      // broadcast stopconnecting
    }
  }

}
</script>

<style lang="stylus">
.space
  position absolute
  top 0
  left 0
  width: 100%
  height: 100%
  pointer-events none // so that painting can receive events
</style>
