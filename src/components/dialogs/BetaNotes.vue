<template lang="pug">
dialog.beta-notes(v-if="visible" :open="visible" @click.stop)
  section
    p Beta Notes
      img.icon(src="@/assets/new.gif")
  section
    // https://www.are.na/block/4494653
    img(src="@/assets/photo-convenience-store.jpg")
    p Kinopio is still in beta so there are a couple limitations:
    ul
      li Your data only lives on your current device
      li There's no collaboration features yet
    p The Roadmap includes:
    ul
      li Custom fields for cards
      li Create new spaces
      li Logo and illustrations
      li A server enabling login and collaboration
  section
    p Follow for Updates
    .button-wrap
      a(href="https://www.are.na/kinopio")
        button Are.na →
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
