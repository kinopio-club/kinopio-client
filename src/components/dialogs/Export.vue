<template lang="pug">
dialog.narrow(v-if="visible" :open="visible" @click.stop ref="dialog")
  section
    p Export {{exportTitle}}
    a#export-downlaod-anchor.hidden
  section
    p To paste into other apps
    button(@click="exportToTxt")
      span.badge txt
      span Card Names
    p For backups
    button(@click="exportToJSON")
      span.badge json
      span All Data

</template>

<script>
import _ from 'lodash'
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil

import utils from '@/utils.js'

export default {
  name: 'Export',
  props: {
    visible: Boolean,
    exportTitle: String, // space-name, 3 Cards
    exportData: Object,
    exportScope: String // space, cards
  },
  methods: {
    fileName () {
      const spaceName = this.$store.state.currentSpace.name
      const spaceId = this.$store.state.currentSpace.id
      let fileName = spaceName || `kinopio-space-${spaceId}`
      if (this.exportScope === 'cards') {
        const cardsCount = utils.normalizeString(this.exportTitle) // '3 Cards' to '3-cards'
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
    },
    exportToTxt () {
      let data = this.exportData.cards.map(card => { return card.name })
      data = _.join(data, '\n')
      const text = 'data:text/plain;charset=utf-8,' + encodeURIComponent(data)
      const downloadAnchor = document.getElementById('export-downlaod-anchor')
      const fileName = this.fileName()
      downloadAnchor.setAttribute('href', text)
      downloadAnchor.setAttribute('download', `${fileName}.txt`)
      downloadAnchor.click()
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      scrollIntoView(element, {
        behavior: 'smooth',
        scrollMode: 'if-needed'
      })
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.scrollIntoView()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
</style>
