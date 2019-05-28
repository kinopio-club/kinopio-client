<template lang="pug">
.connections
  svg(v-for="connection in connections")
    path(fill="none" stroke="#333333" stroke-width="3" :d="connection.path")

  svg.current(:class="{'can-draw-connections': isDrawingConnection}")
    path.id2(fill="none" stroke="#333333" stroke-width="3" :d="currentConnectionPath")
</template>

<script>
export default {
  computed: {
    isDrawingConnection () {
      if (this.$store.state.currentUserIsDrawingConnection) {
        return true
      } else { return false }
    },
    currentConnectionPath () {
      return this.$store.state.currentConnectionPath
    },
    connections () {
      let connections = this.$store.state.currentSpace.connections
      console.log('🚙', connections)
      // connections = connections.map(connection => {
      //   connection.path = 'm10,10 q90,40 200,10'
      // })
      // console.log ('🚒',connections)
      return connections
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
.can-draw-connections
  pointer-events all
  z-index: 1
path
  pointer-events all
  cursor pointer
</style>
