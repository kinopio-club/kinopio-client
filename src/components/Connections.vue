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

</template>

<script>
export default {
  computed: {

    connections () {
      return this.$store.state.currentSpace.connections
    }
    // showConnectionDetailsPop () {
    //   console.log('🌼 showConnectionDetailsPop')
    // }
  }
}
</script>

<style lang="stylus">
</style>
