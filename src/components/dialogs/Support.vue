<template lang="pug">
dialog.support(v-if="visible" :open="visible" @click.stop :class="{'from-footer': fromFooter}")
  section
    p Support
  section
    img(src="@/assets/froggo.png")
    p I made Kinopio to be fun to create cards, and connect your thoughts, ideas, and plans together.
    p Hit me up with any issues or questions at hi@kinopio.club
    .button-wrap
      a(href="mailto:support@kinopio.club?subject=Kinopio Support")
        button Email Me
    .button-wrap
      a(href="https://twitter.com/KinopioClub")
        button Twitter →

</template>

<script>
export default {
  name: 'Support',
  props: {
    visible: Boolean,
    fromFooter: Boolean
  },
  methods: {
  }
}
</script>

<style lang="stylus">
.support
  overflow auto
  max-height calc(100vh - 175px)
  img
    border-radius 3px
  @media(max-width 340px)
    max-height calc(100vh - 220px)
  &.from-footer
    max-height calc(100vh - 75px)
    @media(max-width 340px)
      max-height calc(100vh - 150px)

</style>
