<template lang="pug">
footer
  span(v-if="viewportIsLocked")= "Locked "
</template>

<script>
export default {
  name: 'Footer',
  computed: {
    viewportIsLocked () {
      return this.$store.state.viewportIsLocked
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
