<template lang="pug">
dialog.undo(v-if="visible" :open="visible" @click.stop)
  section
    p Undo
  section
    p - results list of deleted cards in currentspace
    p - each has action to restore or permanently delete (like notion)

  // blank slate for when nothing has been deleted yet
  // top level toggle for cards / spaces?
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
