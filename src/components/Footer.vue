<template lang="pug">
footer
  span(v-if="scrollOnViewportEdges")= "Locked "
  span Prototype
</template>

<script>
export default {
  name: 'Footer',
  computed: {
    scrollOnViewportEdges () {
      return this.$store.state.scrollOnViewportEdges
    }
  }
}
</script>

<style lang="stylus">
footer
  position fixed
  right 0
  bottom 0
</style>
