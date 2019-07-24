<template lang="pug">
dialog.narrow.about(v-if="visible" :open="visible")
  section
    button(@click="exportToJSON") Export to JSON
    a#downlaod-anchor.hidden
</template>

<script>
export default {
  name: 'About',
  props: {
    visible: Boolean
  },
  methods: {
    exportToJSON () {
      const json = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.$store.state.currentSpace))
      const downloadAnchor = document.getElementById('downlaod-anchor')
      const spaceId = this.$store.state.currentSpace.id
      downloadAnchor.setAttribute('href', json)
      downloadAnchor.setAttribute('download', `kinopio-space-${spaceId}.json`)
      downloadAnchor.click()
    }
  }
}
</script>

<style lang="stylus">
.hidden
  display none
</style>
