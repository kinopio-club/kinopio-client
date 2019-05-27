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
      const current = utils.cursorPosition(event)
      const origin = {
        x: this.$store.state.drawingConnectionOrigin.x,
        y: this.$store.state.drawingConnectionOrigin.y
      }
      const delta = {
        x: current.x - origin.x,
        y: current.y - origin.y
      }
      let curveControlPoint = 'q90,40' // TODO: as you're drawing, manipulate the curvecontrolpoint to be more pleasing
      const path = `m${origin.x},${origin.y} ${curveControlPoint} ${delta.x},${delta.y}`
      this.$store.commit('currentConnectionPath', path)
      this.$store.dispatch('broadcast/connectingPaths', path)
    },
    stopConnecting (event) {
      console.log('stopConnecting', event)
      this.$store.commit('currentConnectionPath', '')

      console.log(utils.associatedConnector(event))
      // ?detect whether the event is associated with a connector

      // if associated connector do ... connection

      // else kill line and do nothing (default, implicit)

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
