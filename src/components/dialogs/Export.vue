<template lang="pug">
dialog.narrow.export(v-if="visible" :open="visible" @click.stop ref="dialog")
  section
    p Export {{exportTitle}}
  section
    textarea(ref="text") {{text()}}
    button(@click="copyText")
      span Copy Card Names
    .row
      .badge.success(v-if="textIsCopied") Card Names Copied

  section
    p Download
    button(@click="downloadTxt")
      span.badge.info txt
      span Card Names
    button(@click="downloadJSON")
      span.badge.info json
      span All Data
    a#export-downlaod-anchor.hidden

</template>

<script>
import join from 'lodash-es/join'
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
  data () {
    return {
      textIsCopied: false
    }
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
    text () {
      const data = this.exportData.cards.map(card => { return card.name })
      return join(data, '\n')
    },
    copyText () {
      const element = this.$refs.text
      element.select()
      element.setSelectionRange(0, 99999) // for mobile
      document.execCommand('copy')
      this.textIsCopied = true
    },
    downloadJSON () {
      const json = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.exportData))
      const downloadAnchor = document.getElementById('export-downlaod-anchor')
      const fileName = this.fileName()
      downloadAnchor.setAttribute('href', json)
      downloadAnchor.setAttribute('download', `${fileName}.json`)
      downloadAnchor.click()
    },
    downloadTxt () {
      const data = this.text()
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
          this.textIsCopied = false
          this.scrollIntoView()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
.export
  overflow scroll
  max-height calc(100vh - 100px)
  textarea
    background-color var(--secondary-background)
    border 0
    border-radius 3px
    padding 4px
    margin-bottom 4px
    height 100px
  button
    display block
    margin-left 0
  button + button
    margin-top 10px
  .badge.success
    margin-top 10px
</style>
