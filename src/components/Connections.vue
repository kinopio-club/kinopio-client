<template lang="pug">
.connections
  svg.existing
    // Manipulating the first and last sets of values, M20,50 and 100,50, impacts the positioning of the beginning and end points of the curve. The center set of values, Q40,5, define the control point for the curve, establishing its shape.
    // d = first two x,y = start point
    // last two x,y = end point (but halved?)
    path.id1(fill="none" stroke="#333333" stroke-width="3" d="m10,10 q90,40 200,10")

  svg.new(:class="{'can-draw-connections': isDrawingConnection}")
    path.id2(fill="none" stroke="#333333" stroke-width="3" :d="currentConnectionPath") // second point is relative to the first - not absolute x,y of end point
</template>

<script>
export default {
  name: 'Connections',
  data () {
    return {
      currentConnectionPath: '',
      currentUserIsPainting: this.$store.state.currentUserIsPainting
    }
  },
  computed: {
    isDrawingConnection () {
      if (this.$store.state.currentUserIsDrawingConnection) {
        return true
      } else { return false }
    }
  }
}
</script>

<style lang="stylus">
.connections
  .new
    position absolute
    top 0
    left 0
    width 100%
    height 100vh
// .no-events-while-painting
//   pointer-events none
.can-draw-connections
  pointer-events all
  z-index: 1
path
  pointer-events all
  cursor pointer
</style>
