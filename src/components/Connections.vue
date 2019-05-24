<template lang="pug">
  span
    svg.connections
      // Manipulating the first and last sets of values, M20,50 and 100,50, impacts the positioning of the beginning and end points of the curve. The center set of values, Q40,5, define the control point for the curve, establishing its shape.
      // d = first two x,y = start point
      // last two x,y = end point (but halved?)
      path.id1(fill="none" stroke="#333333" stroke-width="3" d="m10,10 q90,40 200,10")

    svg.draw-connection(
      :class="{'can-draw-connections': isDrawingConnection}"
      @mousemove="drawConnection"
      @touchmove="drawConnection"
    )
      path.id2(fill="none" stroke="#333333" stroke-width="3" :d="currentConnectionPathDefinition") // second point is relative to the first - not absolute x,y of end point
</template>

<script>
export default {
  name: 'Connections',
  data () {
    return {
      currentConnectionPathDefinition: ''
    }
  },
  computed: {
    isDrawingConnection () {
      if (this.$store.state.currentUserIsDrawingConnection) {
        return true
      } else { return false }
    }
  },
  methods: {
    drawConnection (event) {
      if (!this.$store.state.currentUserIsDrawingConnection) { return }
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
      this.currentConnectionPathDefinition = `m${origin.x},${origin.y} ${curveControlPoint} ${delta.x},${delta.y}`

      // ?detect whether current position is atop any connectors (might get for free w :hover)

      // end connection -> app.vue / stopInteractions
      // if a connection is formed on end drawing .. then move the path into .connections
      // update the data model
    }
  }
}
</script>

<style lang="stylus">
.draw-connection
  position absolute
  top 0
  left 0
  width 100%
  height 100vh
.can-draw-connections
  pointer-events all
  z-index: 1
path
  pointer-events all
  cursor pointer
</style>
