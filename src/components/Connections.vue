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

  svg.current(v-if="isDrawingConnection")
    path(
      fill="none"
      stroke="#333333"
      stroke-width="3"
      :d="currentConnectionPath"
    )
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
      return this.$store.state.currentSpace.connections
    }
  }
}
</script>

<style lang="stylus">
// .connections
//   background-color: pink
//   position: relative
// .space
//   background yellow
// .app
//   background grey
// .painting
//   background-color cyan
svg
  position absolute
  top 0
  left 0
  width 100%
  height 100vh
svg.current
  z-index: 1
path
  pointer-events all
  cursor pointer
</style>
