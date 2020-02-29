<template lang="pug">
dialog.contact(v-if="visible" :open="visible" @click.stop)
  section
    p Contact
  section
    .row
      img.froggo(src="@/assets/froggo.png")
      //- p I made Kinopio to help you connect your thoughts, ideas, and plans together.
      p Please send questions, comments, and requests to hi@kinopio.club
        //- a(href="mailto:hi@kinopio.club") hi@kinopio.club
        a(href="mailto:hi@kinopio.club")
          button hi@kinopio.club

    //- .button-wrap
    //-   a(href="mailto:hi@kinopio.club")
    //-     button Email
    //- .button-wrap
    //-   a(href="https://twitter.com/KinopioClub")
    //-     button Twitter →

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
  max-height calc(100vh - 250px)
  .row
    margin-top 0
    align-items flex-start
    p
      margin-top 0
  img
    border-radius 3px
  .froggo
    width 60px
    margin-right 6px
  button
    margin-top 10px
    // &:hover
    //   text-decoration none
</style>
