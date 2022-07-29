<template lang="pug">
.locked-cards(:style="zoomScale")
  template(v-for="card in lockedCards")
    Card(:card="card")
</template>

<script>
import Card from '@/components/Card.vue'

export default {
  name: 'LockedCards',
  components: {
    Card
  },
  computed: {
    spaceZoomDecimal () { return this.$store.getters.spaceZoomDecimal },
    lockedCards () { return this.$store.getters['currentCards/isLocked'] },
    zoomScale () {
      return {
        transform: `scale(${this.spaceZoomDecimal})`
      }
    }
  },
  methods: {
  }
}
</script>

<style lang="stylus">
.locked-cards
  position absolute
  top 0
</style>
