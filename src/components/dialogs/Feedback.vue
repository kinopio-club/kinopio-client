<template lang="pug">
dialog.narrow(v-if="visible" :open="visible" @click.stop)
  section
    p Feedback
  section
    p During the beta I really want to know if it's fun to create, and connect your thoughts, ideas, and plans with Kinopio
    p Your feedback right now is invaluably helpful.
    p Hit me up at hi@pirijan.com
    .button-wrap
      a(href="mailto:hi@pirijan.com?subject=👻 Kinopio Feedback")
        button Email

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
</style>
