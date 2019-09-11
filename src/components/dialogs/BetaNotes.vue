<template lang="pug">
dialog.beta-notes(v-if="visible" :open="visible" @click.stop)
  section
    p Beta Notes
      //img.icon(src="@/assets/updated.gif")
  section
    // https://www.are.na/block/4494653
    img(src="@/assets/photo-convenience-store.jpg")
    p Kinopio is still in beta so there are a couple limitations:
    ul
      li There's no collaboration features yet
      li Your data only lives on your current device
      li If you clear your browser's data you'll wipe out your kinopio data
    p The Roadmap includes:
    ul
      li More options for cards
      li
        del Create new spaces
      li Updated Logo and illustrations
      li Login and collaboration
      li Data also stored on a server for safety
  section
    .button-wrap
      a(href="http://pketh.org/hello-kinopio")
        button About →
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
  ul
    margin 0
    margin-top 2px
    padding-left 15px
    list-style-type square
    li
      padding-top 10px
      margin-left 5px
      user-select text
  @media(max-width 340px)
    left calc(-100% + 16px)
    max-height calc(100vh - 200px)

</style>
