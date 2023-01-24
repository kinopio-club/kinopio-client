<template lang="pug">
//- boxes
template(v-for="box in lockedBoxes")
  BoxUnlockButton(:box="box" :position="boxButtonPosition(box)" :shouldInvert="shouldInvert(box)")
//- boxes
template(v-for="card in lockedCards")
  CardUnlockButton(:card="card" :position="cardButtonPosition(card)" :shouldInvert="shouldInvert(card)")

</template>

<script>
import BoxUnlockButton from '@/components/BoxUnlockButton.vue'
import CardUnlockButton from '@/components/CardUnlockButton.vue'
import utils from '@/utils.js'

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
    lockedCards () { return this.$store.getters['currentCards/isLocked'] },
    isThemeDark () { return this.$store.state.currentUser.theme === 'dark' }
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
      const rect = element.getBoundingClientRect()
      return rect
    },
    shouldInvert (item) {
      const color = item.backgroundColor || item.color
      if (!color) { return }
      if (this.isThemeDark) {
        return !utils.colorIsDark(color)
      } else {
        return utils.colorIsDark(color)
      }
    }
  }
}
</script>

<style lang="stylus">
// .component-name
</style>
