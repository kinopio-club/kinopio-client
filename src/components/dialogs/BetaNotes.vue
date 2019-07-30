<template lang="pug">
dialog(v-if="visible" :open="visible" @click.stop)
  section
    p Beta Notes
  section
    p blah blah
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
</style>
