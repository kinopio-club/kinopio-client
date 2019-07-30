<template lang="pug">
dialog(v-if="visible" :open="visible")
  section
    p Feedback
  section
    p blah blah blah
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
