<template lang="pug">
.outside-space-background#outside-space-background
  p zzzzzzzz
</template>

<script>
export default {
  name: 'OutsideSpaceBackground',
  components: {
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
.outside-space-background
  position absolute
  top 0
  left 0
  width 100%
  height 100%
  background-color teal
</style>
