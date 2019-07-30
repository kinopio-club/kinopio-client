<template lang="pug">
dialog(v-if="visible" :open="visible" @click.stop)
  section
    p Beta Notes
  section
    p vision
    p limitations
    p data loss
    p roadmap
    p principles
  section
    p Follow @KinopioClub for Updates
    .button-wrap
      a(href="https://twitter.com/KinopioClub")
        button Twitter →
</template>

<script>
export default {
  name: 'BetaNotes',
  props: {
    visible: Boolean
  },
  methods: {
  }
}
</script>

<style lang="stylus">
</style>
