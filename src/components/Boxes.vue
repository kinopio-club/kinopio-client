<template lang="pug">
.boxes(:style="zoomScale" :class="{unselectable: isPainting}")
  template(v-for="box in unlockedBoxes")
    Box(:box="box")
  template(v-for="box in lockedBoxes")
    BoxUnlockButton(:box="box" :position="unlockButtonPosition(box)")
</template>

<script>
import Box from '@/components/Box.vue'
import BoxUnlockButton from '@/components/BoxUnlockButton.vue'

export default {
  name: 'Boxes',
  components: {
    Box,
    BoxUnlockButton
  },
  computed: {
    isPainting () { return this.$store.state.currentUserIsPainting },
    lockedBoxes () { return this.$store.getters['currentBoxes/isLocked'] },
    unlockedBoxes () { return this.$store.getters['currentBoxes/isNotLocked'] },
    spaceZoomDecimal () { return this.$store.getters.spaceZoomDecimal },
    zoomScale () {
      return {
        transform: `scale(${this.spaceZoomDecimal})`
      }
    }
  },
  methods: {
    unlockButtonPosition (box) {
      const element = document.querySelector(`.box[data-box-id="${box.id}"] .lock-button-wrap`)
      const rect = element.getBoundingClientRect()
      return rect
    }
  }
}
</script>

<style lang="stylus">
.boxes
  position absolute
  top 0
</style>
