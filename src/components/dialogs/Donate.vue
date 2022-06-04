<template lang="pug">
dialog.donate(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p donate donate donate donate
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
// .donate
</style>
