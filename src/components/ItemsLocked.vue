<template lang="pug">
//- boxes
.locked-boxes(:style="positionStyles")
  template(v-for="box in lockedBoxes")
    Box(:box="box")
//- cards
.locked-cards(:style="positionStyles")
  template(v-for="card in lockedCards")
    Card(:card="card")
</template>

<script>
import Card from '@/components/Card.vue'
import Box from '@/components/Box.vue'

export default {
  name: 'ItemsLocked',
  components: {
    Card,
    Box
  },
  computed: {
    spaceZoomDecimal () { return this.$store.getters.spaceZoomDecimal },
    lockedCards () { return this.$store.getters['currentCards/isLocked'] },
    lockedBoxes () { return this.$store.getters['currentBoxes/isLocked'] },
    positionStyles () {
      return {
        transform: this.$store.getters.zoomTransform
      }
    }
  }
}
</script>

<style lang="stylus">
.locked-boxes,
.locked-cards
  transform-origin top left
</style>
