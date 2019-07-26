<template lang="pug">
dialog.narrow.about(v-if="visible" :open="visible")
  section.kaomoji-section
    p ༼ つ ◕_◕ ༽つ
    button(@click="exportToJSON")
      span Export to JSON
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
.about
  top calc(100% - 8px)
  .hidden
    display none
  .kaomoji-section
    padding-top 12px
</style>
