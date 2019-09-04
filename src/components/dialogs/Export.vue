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
import utils from '@/utils.js'

export default {
  name: 'Export',
  props: {
    visible: Boolean,
    exportName: String, // space-name, 3 Cards
    exportData: Object,
    exportScope: String // space, cards
  },
  methods: {
    fileName () {
      const spaceName = this.$store.state.currentSpace.name
      const spaceId = this.$store.state.currentSpace.id
      let fileName = spaceName || `kinopio-space-${spaceId}`
      if (this.exportScope === 'cards') {
        const cardsCount = utils.normalizeString(this.exportName) // '3 Cards' to '3-cards'
        fileName = `${fileName}-${cardsCount}`
      }
      return fileName
    },
    exportToJSON () {
      const json = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.exportData))
      const downloadAnchor = document.getElementById('export-downlaod-anchor')
      const fileName = this.fileName()
      downloadAnchor.setAttribute('href', json)
      downloadAnchor.setAttribute('download', `${fileName}.json`)
      downloadAnchor.click()
    }
  }
}
</script>

<style lang="stylus">
</style>
