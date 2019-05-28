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
    curveControlPoint (origin, delta) {
      // TODO: as you're drawing, manipulate the curvecontrolpoint to be more pleasing
      return 'q90,40'
    },

    drawConnection (event) {
      if (!this.$store.state.currentUserIsDrawingConnection) { return }
      const current = utils.cursorPosition(event)
      const origin = utils.elementCenter(this.$store.state.drawingConnectionOrigin)
      const delta = {
        x: current.x - origin.x,
        y: current.y - origin.y
      }
      let curve = this.curveControlPoint(origin, delta)
      const path = `m${origin.x},${origin.y} ${curve} ${delta.x},${delta.y}`
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

    connectedConnector (event) {
      const cursor = utils.cursorPosition(event)
      const connectedConnector = this.connectors().find(connector => {
        const inXRange = utils.between(cursor.x, connector.x, connector.x + connector.width)
        const inYRange = utils.between(cursor.y, connector.y, connector.y + connector.height)
        const connectedToNewCard = connector.cardId !== this.$store.state.drawingConnectionOrigin.cardId
        return inXRange && inYRange && connectedToNewCard
      })
      return connectedConnector
    },

    stopConnecting (event) {
      const connectedConnector = (this.connectedConnector(event))
      console.log('🌹', connectedConnector)

      // if associated connector do ... connection

      // else kill line and do nothing (default, implicit)
      this.$store.commit('currentConnectionPath', '')

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
