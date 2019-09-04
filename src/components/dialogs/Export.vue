<template lang="pug">
dialog.narrow(v-if="visible" :open="visible" @click.stop)
  section
    p Export {{exportName}}
    a#export-downlaod-anchor.hidden
  section
    p To paste into other apps
    button
      span.badge txt
      span Card Names
    p For backups
    button(@click="exportToJSON")
      span.badge json
      span All Data

</template>

<script>

export default {
  name: 'Export',
  props: {
    visible: Boolean,
    exportName: String,
    exportData: Object,
    exportType: String
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
      const json = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.exportData))
      const downloadAnchor = document.getElementById('export-downlaod-anchor')

      // temp condition . move naming for txt and json to seperate funcs
      // if (this.exportType === 'space') {
      const spaceName = this.$store.state.currentSpace.name
      const spaceId = this.$store.state.currentSpace.id
      const fileName = spaceName || `kinopio-space-${spaceId}`
      // }
      // what should the json file name be for cards , hello-kinopio-3-cards?

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
