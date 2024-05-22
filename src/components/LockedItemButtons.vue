<template lang="pug">
//- boxes
template(v-for="box in lockedBoxes")
  BoxUnlockButton(:box="box" :position="boxButtonPosition(box)")
//- cards
template(v-for="card in lockedCards")
  CardUnlockButton(:card="card")

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
    }
  }
}
</script>

<style lang="stylus">
// .component-name
</style>
