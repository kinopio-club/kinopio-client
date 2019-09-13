<template lang="pug">
dialog.roadmap(v-if="visible" :open="visible" @click.stop)
  section
    p Roadmap
    p
      img.updated.icon(src="@/assets/updated.gif")
      // manually update me whenever this is updated
      span Sept 13, 2019
  section
    ul
      li
        del Frames for cards
      li
        del Create new spaces
      li
        del Cards and spaces are safe to remove because they can be restored
      li
        del Import spaces
      li Login and collaboration
      li Data also stored on a server for safety
      li Updated Logo and illustrations
      li Build Billing and Payments (4$/month)
      li Dark mode 🌙
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
