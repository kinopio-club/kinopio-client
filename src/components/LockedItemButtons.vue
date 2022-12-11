<template lang="pug">
//- boxes
template(v-for="box in lockedBoxes")
  BoxUnlockButton(:box="box")
//- boxes
template(v-for="card in lockedCards")
  CardUnlockButton(:card="card")

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
    ]),
    lockedBoxes () { return this.$store.getters['currentBoxes/isLocked'] },
    lockedCards () { return this.$store.getters['currentCards/isLocked'] }
  }
}
</script>

<style lang="stylus">
// .component-name
</style>
