<template lang="pug">
dialog.narrow.stats(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p Stats for {{currentSpace.name}}
  section
    p {{currentSpace.cards.length}} cards
</template>

<script>
// import utils from '@/utils.js'

export default {
  name: 'Stats',
  components: {
  },
  props: {
    visible: Boolean
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
    currentSpace () { return this.$store.state.currentSpace }
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
// dialog.dialog-name
</style>
