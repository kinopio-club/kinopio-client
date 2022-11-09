<template lang="pug">
dialog.narrow.dialog-name(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p blank dialog, please duplicate
</template>

<script>
// import utils from '@/utils.js'

export default {
  name: 'DialogName',
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
// dialog.dialog-name
</style>
