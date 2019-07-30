<template lang="pug">
dialog.beta-notes(v-if="visible" :open="visible" @click.stop)
  section
    p Beta Notes
  section
    // https://www.are.na/block/4494653
    img(src="@/assets/photo-convenience-store.jpg")
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
.beta-notes
  overflow auto
  max-height calc(100vh - 110px)
  img
    border-radius 3px
</style>
