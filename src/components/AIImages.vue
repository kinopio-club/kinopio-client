<template lang="pug">
.ai-images(v-if="visible")
  section
    p ai images go here, grouped by prompt, in img picker style 2-col grid
    p or is prompt only revealed on img click?
    p img action is small btn 'copy' (w notification 'copied url')
</template>

<script>
export default {
  name: 'AIImages',
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
.ai-images
  overflow auto
  border-top 1px solid var(--primary)
</style>
