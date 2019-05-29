<template lang="pug">
.connections
  svg(v-for="connection in connections")
    path(
      fill="none"
      stroke="#333333"
      stroke-width="3"
      :data-start-card="connection.startCardId"
      :data-end-card="connection.endCardId"
      :d="connection.path"
    )

  svg.current(:class="{'can-draw-connections': isDrawingConnection}")
    path.id2(
      fill="none"
      stroke="#333333"
      stroke-width="3"
      :d="currentConnectionPath"
    )
</template>

<script>
import utils from '@/utils.js'

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
      let connections = utils.clone(this.$store.state.currentSpace.connections)
      connections = connections.map(connection => {
        connection.path = utils.connectionBetweenCards(connection.startCardId, connection.endCardId)
        return connection
      })
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
