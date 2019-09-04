<template lang="pug">
dialog.narrow(v-if="visible" :open="visible" @click.stop)
  section
    p Export {{exportName}}
  section
    p to export all data
    button(@click="exportToJSON")
      span Full JSON
    p for writing and pasting into other systems
    button Plain Text Card Names

  a#export-downlaod-anchor.hidden
</template>

<script>

export default {
  name: 'Export',
  props: {
    visible: Boolean,
    exportName: String
  },
  // data () {
  //   return {
  //     spaces: []
  //   }
  // },
  // computed: {
  // },
  methods: {
    exportToJSON () {
      const json = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.$store.state.currentSpace))
      const downloadAnchor = document.getElementById('export-downlaod-anchor')
      const spaceName = this.$store.state.currentSpace.name
      const spaceId = this.$store.state.currentSpace.id
      const fileName = spaceName || `kinopio-space-${spaceId}`
      downloadAnchor.setAttribute('href', json)
      downloadAnchor.setAttribute('download', `${fileName}.json`)
      downloadAnchor.click()
    }

  }
  // watch: {
  //   visible (visible) {
  //     if (visible) {
  //       this.updateSpaces()
  //     }
  //   }
  // }
}
</script>

<style lang="stylus">
</style>
