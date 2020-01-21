<template lang="pug">
dialog.support(v-if="visible" :open="visible" @click.stop :class="{'from-footer': fromFooter}")
  section
    p Contact
  section
    img.froggo(src="@/assets/froggo.png")
    p Please send questions, comments, and requests to
      a(href="mailto:hi@kinopio.club") hi@kinopio.club
    .button-wrap
      a(href="mailto:hi@kinopio.club")
        button Email
    .button-wrap
      a(href="https://twitter.com/KinopioClub")
        button Twitter →
    .button-wrap
      a(href="https://www.are.na/kinopio")
        button Are.na →

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
  .froggo
    width 100px
</style>
