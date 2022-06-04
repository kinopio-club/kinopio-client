<template lang="pug">
dialog.donate.narrow(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p donate donate donate donate
  section
    .row
      .segmented-buttons
        button $5
        button $20
        button $100

</template>

<script>
export default {
  name: 'Donate',
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
  }
}
</script>

<style lang="stylus">
dialog.donate
  overflow auto
  max-height calc(100vh - 210px)
  left initial
  right 8px

</style>
