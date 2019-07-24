<template lang="pug">
dialog.narrow.about(v-if="visible" :open="visible")
  section
    button(@click="exportToJSON") Export to JSON
</template>

<script>
export default {
  name: 'About',
  props: {
    visible: Boolean
  },
  methods: {
    exportToJSON () {
      return 'yo'
    }
  }
}
</script>

<style lang="stylus">
</style>
