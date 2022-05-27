<template lang="pug">
.component-name(v-if="isVisible")
  p blank template, please duplicate
</template>

<script>
export default {
  name: 'ComponentName',
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
// .component-name
</style>
