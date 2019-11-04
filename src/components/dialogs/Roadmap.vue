<template lang="pug">
dialog.roadmap(v-if="visible" :open="visible" @click.stop)
  section
    p Roadmap
    p
      img.updated.icon(src="@/assets/updated.gif")
      // manually update me whenever this is updated
      span oct 25, 2019
  section
    ul
      li
        del Frames for cards
      li
        del Create new spaces
      li
        del Cards and spaces are safe to remove because they can be restored
      li
        del Export spaces and cards
      li
        del Import spaces
      li
        del Sign in to access your spaces everywhere
      li Share your spaces with other people (spaces have urls)
      li Real time collaboration
      li Updated Logo and illustrations
      li Build Billing and Payments (4$/month)
      li Dark mode 🌙
      li More frames 🌷
      li Keyboard Shortcuts
  //- section
  //-   .button-wrap
  //-     a(href="https://www.are.na/kinopio")
  //-       button Previously Completed →

</template>

<script>
export default {
  name: 'Roadmap',
  props: {
    visible: Boolean
  },
  methods: {
  }
}
</script>

<style lang="stylus">
.roadmap
  overflow auto
  max-height calc(100vh - 150px)
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
      &:first-child
        padding-top 0
  @media(max-width 340px)
    max-height calc(100vh - 250px)
</style>
