<template lang="pug">
//- boxes
template(v-for="box in lockedBoxes")
  BoxUnlockButton(:box="box" :position="boxButtonPosition(box)")
//- boxes
template(v-for="card in lockedCards")
  CardUnlockButton(:card="card" :position="cardButtonPosition(card)")

</template>

<script>
import BoxUnlockButton from '@/components/BoxUnlockButton.vue'
import CardUnlockButton from '@/components/CardUnlockButton.vue'

import { mapState, mapGetters } from 'vuex'

export default {
  name: 'LockedItemButtons',
  components: {
    BoxUnlockButton,
    CardUnlockButton
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerUpdateLockedItemButtonsPositions') {
        this.$forceUpdate()
      }
    })
  },
  props: {
    visible: Boolean
  },
  computed: {
    ...mapState([
    ]),
    ...mapGetters([
      'currentScrollPosition',
      'spaceZoomDecimal'
    ]),
    lockedBoxes () { return this.$store.getters['currentBoxes/isLocked'] },
    lockedCards () { return this.$store.getters['currentCards/isLocked'] }
  },
  methods: {
    boxButtonPosition (box) {
      const element = document.querySelector(`.box[data-box-id="${box.id}"] .lock-button-wrap`)
      if (!element) { return }
      const rect = element.getBoundingClientRect()
      return rect
    },
    cardButtonPosition (card) {
      const element = document.querySelector(`article[data-card-id="${card.id}"] .lock-button-wrap`)
      if (!element) { return }
      const zoom = this.spaceZoomDecimal
      const offset = {
        x: this.currentScrollPosition.x * zoom,
        y: this.currentScrollPosition.y * zoom
      }
      let rect = element.getBoundingClientRect()
      rect = {
        x: rect.x + offset.x,
        y: rect.y + offset.y
      }
      return rect
    }
  }
}
</script>

<style lang="stylus">
// .component-name
</style>
