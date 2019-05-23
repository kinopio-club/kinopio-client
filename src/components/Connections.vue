<template lang="pug">
  svg.connections(
    :class="{interactable: isDrawingConnection}"
    @mousemove="drawConnection"
    @touchmove="drawConnection"
  )
    // Manipulating the first and last sets of values, M20,50 and 100,50, impacts the positioning of the beginning and end points of the curve. The center set of values, Q40,5, define the control point for the curve, establishing its shape.
    // d = first two x,y = start point
    // last two x,y = end point (but halved?)
    path.id1(fill="none" stroke="#333333" stroke-width="3" d="m10,10 q90,40 200,10")

    path.id2(fill="none" stroke="#333333" stroke-width="3" :d="currentConnectionPathDefinition") // second point is relative to the first - not absolute x,y of end point
</template>

<script>
export default {
  name: 'Connections',
  data () {
    return {
      // drawingConnectionDelta: {}
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
      const curveControlPoint = 'q90,40'
      this.currentConnectionPathDefinition = `m${origin.x},${origin.y} ${curveControlPoint} ${delta.x},${delta.y}`
    }
  }
}
</script>

<style lang="stylus">
svg
  position absolute
  top 0
  left 0
  width 100%
  height 100vh
path
  pointer-events all
  cursor pointer
</style>
