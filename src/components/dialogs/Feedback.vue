<template lang="pug">
dialog.feedback(v-if="visible" :open="visible" @click.stop)
  section
    p Feedback
  section
    p During the beta I need to know if it's fun to create, and connect your thoughts, ideas, and plans with Kinopio
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
    visible: Boolean
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
</style>
