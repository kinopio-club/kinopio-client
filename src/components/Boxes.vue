<template lang="pug">
.boxes(:style="zoomScale" :class="{unselectable: isPainting}")
  template(v-for="box in unlockedBoxes")
    Box(:box="box")
</template>

<script>
import Box from '@/components/Box.vue'

export default {
  name: 'Boxes',
  components: {
    Box
  },
  computed: {
    isPainting () { return this.$store.state.currentUserIsPainting },
    unlockedBoxes () { return this.$store.getters['currentBoxes/isNotLocked'] },
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
</style>
