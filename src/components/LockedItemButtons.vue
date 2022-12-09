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
    lockedBoxes () { return this.$store.getters['currentBoxes/isLocked'] },
    lockedCards () { return this.$store.getters['currentCards/isLocked'] }
  },
  methods: {
    boxButtonPosition (box) {
      const element = document.querySelector(`.box[data-box-id="${box.id}"] .lock-button-wrap`)
      if (!element) { return }
      const scroll = this.$store.getters.currentScrollPosition()
      let rect = element.getBoundingClientRect()
      rect = {
        x: rect.x + scroll.x,
        y: rect.y + scroll.y
      }
      return rect
    },
    cardButtonPosition (card) {
      const element = document.querySelector(`article[data-card-id="${card.id}"] .lock-button-wrap`)
      if (!element) { return }
      const scroll = this.$store.getters.currentScrollPosition()
      let rect = element.getBoundingClientRect()
      rect = {
        x: rect.x + scroll.x,
        y: rect.y + scroll.y
      }
      return rect
    }
  }
}
</script>

<style lang="stylus">
// .component-name
</style>
