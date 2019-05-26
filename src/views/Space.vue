<template lang="pug">
main.space(
  @mousemove="drawConnection"
  @touchmove="drawConnection"
)
  Connections
  article(v-for="card in cards")
    Card(
      :id="card.id"
      :x="card.x"
      :y="card.y"
      :name="card.name"
    )
  footer
    .badge.beta Engineering Prototype
</template>

<script>
import Connections from '@/components/Connections.vue'
import Card from '@/components/Card.vue'

export default {
  name: 'Space',
  components: {
    Connections,
    Card
  },
  computed: {
    cards () {
      return this.$store.state.currentSpace.cards
    }
  },

  methods: {
    drawConnection (event) {
      if (!this.$store.state.currentUserIsDrawingConnection) { return }
      console.log('drawConnection')
      const current = {
        x: event.clientX,
        y: event.clientY
      }
      const origin = {
        x: this.$store.state.drawingConnectionOrigin.x,
        y: this.$store.state.drawingConnectionOrigin.y
      }
      const delta = {
        x: current.x - origin.x,
        y: current.y - origin.y
      }
      let curveControlPoint = 'q90,40' // TODO: as you're drawing, manipulate the curvecontrolpoint to be more pleasing
      this.currentConnectionPath = `m${origin.x},${origin.y} ${curveControlPoint} ${delta.x},${delta.y}`
      this.$store.dispatch('broadcast/connectingPaths', this.currentConnectionPath)

      // ?detect whether current position is atop any connectors (might get for free w :hover)

      // end connection -> app.vue / stopInteractions
      // if a connection is formed on end drawing .. then move the path into .connections
      // update the data model
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
  pointer-events none
</style>
