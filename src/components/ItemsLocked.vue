<template lang="pug">
.locked-items(:style="styles")
  //- boxes
  .locked-boxes
    template(v-for="box in lockedBoxes")
      Box(:box="box")
  //- cards
  .locked-cards
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
    styles () {
      const origin = this.$store.state.prevZoomOrigin
      return {
        transform: `scale(${this.spaceZoomDecimal})`,
        transformOrigin: `${origin.x}px ${origin.y}px`
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
