<template lang="pug">
dialog.narrow.about(v-if="visible" :open="visible")
  section
    p {{kaomoji}}
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
  data () {
    return {
      kaomoji: '༼ つ ◕_◕ ༽つ'
    }
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
.about
  top calc(100% - 8px)
</style>
