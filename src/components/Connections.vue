<template lang="pug">
  svg.connections(
    :class="{interactable: isDrawing}"
    @mousemove="drawConnection"
    @touchmove="drawConnection"
  )
    // Manipulating the first and last sets of values, M20,50 and 100,50, impacts the positioning of the beginning and end points of the curve. The center set of values, Q40,5, define the control point for the curve, establishing its shape.
    // d = first two x,y = start point
    // last two x,y = end point (but halved?)
    path.id1(fill="none" stroke="#333333" stroke-width="3" d="m10,10 q90,40 200,10")

    path.id2(fill="none" stroke="#333333" stroke-width="3" d="M100,100 q90,40 200,400") // second point is relative to the first - not absolute x,y of end point
</template>

<script>
export default {
  name: 'Connections',
  // data () {
  //   return {
  //     test: true
  //   }
  // },
  computed: {
    isDrawing () {
      if (this.$store.state.currentUserIsDrawingConnection) {
        return true
      } else { return false }
    }
  },
  methods: {
    drawConnection (event) {
      if (this.$store.state.currentUserIsDrawingConnection) {
        console.log('drawConnection')
      }
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
