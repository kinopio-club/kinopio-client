<template lang="pug">
.boxes(:style="zoomScale")
  //- template(v-for="box in boxes")
  p BOX NAME
</template>

<script>
export default {
  name: 'Boxes',
  computed: {
    boxes () { return this.$store.getters['currentBoxes/all'] },
    spaceZoomDecimal () { return this.$store.getters.spaceZoomDecimal },
    zoomScale () {
      return {
        transform: `scale(${this.spaceZoomDecimal})`
      }
    }
  }
}
</script>

<style lang="stylus">
.boxes
  position absolute
  top 0
  // temp
  p
    position absolute
    background-color pink
    left 300px
    top 300px
</style>
