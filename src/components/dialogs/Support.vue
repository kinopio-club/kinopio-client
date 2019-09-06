<template lang="pug">
dialog.support(v-if="visible" :open="visible" @click.stop :class="{'from-footer': fromFooter}")
  section
    p Support
  section
    img(src="@/assets/froggo.png")
    p I made Kinopio to be fun to create cards, and connect your thoughts, ideas, and plans together.
    p Hit me up with any issues or questions at hi@pirijan.com
    .button-wrap
      a(href="mailto:hi@pirijan.com?subject=👻 Kinopio Support")
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
  max-height calc(100vh - 110px)
  img
    // margin-top 10px
    border-radius 3px
  @media(max-width 340px)
    max-height calc(100vh - 200px)
  &.from-footer
    max-height calc(100vh - 75px)
    @media(max-width 340px)
      max-height calc(100vh - 150px)

</style>
