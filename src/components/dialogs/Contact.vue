<template lang="pug">
dialog.contact.narrow(v-if="visible" :open="visible" @click.stop)
  section
    p Contact
  section
    img.froggo(src="@/assets/froggo.png" width=100)

    p I made Kinopio to help you connect your thoughts, ideas, and plans together.
    p Please send questions, comments, or requests to hi@kinopio.club
    .button-wrap
      a(href="mailto:hi@kinopio.club")
        button Email Me
    .button-wrap
      a(href="https://twitter.com/KinopioClub")
        button Twitter →
    .row
      .button-wrap
        a(href="https://www.are.na/kinopio")
          button Are.na →

</template>

<script>
export default {
  name: 'Contact',
  props: {
    visible: Boolean
  }
}
</script>

<style lang="stylus">
.contact
  overflow auto
  max-height calc(100vh - 175px)
  img
    border-radius 3px
  @media(max-width 340px)
    max-height calc(100vh - 220px)
  .froggo
    width 100px
  .row
    margin-top 10px
</style>
