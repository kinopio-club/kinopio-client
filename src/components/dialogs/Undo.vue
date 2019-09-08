<template lang="pug">
dialog.undo(v-if="visible" :open="visible" @click.stop)
  section
    p Undo
</template>

<script>
export default {
  name: 'Undo',
  props: {
    visible: Boolean
  },
  methods: {
  }
}
</script>

<style lang="stylus">
</style>
