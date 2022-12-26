<template lang="pug">
dialog.narrow.card-list-item-options(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    .row
      button
        //- img.icon.visit(src="@/assets/visit.svg")
        span Move / copy?
    .row
      button
        //- img.icon.inbox(src="@/assets/inbox.svg")
        span GoTo Card
</template>

<script>
// import utils from '@/utils.js'

import { mapState, mapGetters } from 'vuex'

export default {
  name: 'cardListItemOptions',
  components: {
  },
  props: {
    visible: Boolean,
    card: Object
  },
  created () {
  //   this.$store.subscribe((mutation, state) => {
  //     if (mutation.type === 'closeAllDialogs') {
  //       this.closeAllDialogs()
  //     }
  //   })
  },
  mounted () {
  },
  beforeUnmount () {
  },
  data () {
    return {
    }
  },
  computed: {
    ...mapState([
    ]),
    ...mapGetters([
    ])
    // kinopioDomain () { return utils.kinopioDomain() },
  },
  methods: {
  },
  watch: {
    // visible (visible) {
    //   if (visible) {
    //     this.updateResultsSectionHeight()
    //   }
    // }
  }
}
</script>

<style lang="stylus">
dialog.card-list-item-options
  position absolute
  top 130px !important
  width 190px !important
</style>
