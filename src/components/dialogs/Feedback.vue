<template lang="pug">
dialog.feedback(v-if="visible" :open="visible" @click.stop :class="{'from-footer': fromFooter}")
  section
    p Feedback
  section
    p During this beta I'd love to know if it's fun to create cards, and connect your thoughts, ideas, and plans together.
    p Your feedback right now is invaluably helpful.
    p Hit me up at hi@pirijan.com
    .button-wrap
      a(href="mailto:hi@pirijan.com?subject=👻 Kinopio Feedback")
        button Email Me
    //a(href="https://www.are.na/block/2577006")
    img(src="@/assets/bom-marido.jpg")

</template>

<script>
export default {
  name: 'Feedback',
  props: {
    visible: Boolean,
    fromFooter: Boolean
  },
  methods: {
  }
}
</script>

<style lang="stylus">
.feedback
  overflow auto
  max-height calc(100vh - 110px)
  img
    margin-top 10px
    border-radius 3px
  @media(max-width 340px)
    max-height calc(100vh - 200px)
  &.from-footer
    max-height calc(100vh - 75px)
    @media(max-width 340px)
      max-height calc(100vh - 150px)

</style>
