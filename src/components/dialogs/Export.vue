<template lang="pug">
dialog.narrow.export(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Export {{exportTitle}}
  section
    textarea(ref="text") {{text()}}
    button(@click.left="copyText")
      img.icon.cut(src="@/assets/cut.svg")
      span Copy Content
    .row
      .badge.success(v-if="textIsCopied") Card Content Copied
    button(@click.left="duplicateSpace")
      img.icon(src="@/assets/add.svg")
      span Duplicate Space
    .badge.success(v-if="spaceIsDuplicated") {{duplicatedSpaceName}} duplicated
  section
    p Download
    button(@click.left="downloadTxt")
      span.badge.info txt
      span Card Names
    button(@click.left="downloadJSON")
      span.badge.info json
      span All Data
    a#export-downlaod-anchor.hidden

</template>

<script>
import join from 'lodash-es/join'

import scrollIntoView from '@/scroll-into-view.js'
import utils from '@/utils.js'

export default {
  name: 'Export',
  props: {
    visible: Boolean,
    exportTitle: String, // space-name, 3 Cards
    exportData: Object
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
  },
  data () {
    return {
      textIsCopied: false,
      spaceIsDuplicated: false,
      duplicatedSpaceName: '',
      dialogHeight: null
    }
  },
  methods: {
    fileName () {
      const spaceName = this.$store.state.currentSpace.name
      const spaceId = this.$store.state.currentSpace.id
      let fileName = spaceName || `kinopio-space-${spaceId}`
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
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
    },
    duplicateSpace () {
      this.duplicatedSpaceName = this.$store.state.currentSpace.name
      this.$store.dispatch('currentSpace/duplicateSpace')
      this.spaceIsDuplicated = true
      this.$emit('updateSpaces')
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.textIsCopied = false
          this.scrollIntoView()
          this.spaceIsDuplicated = false
          this.updateDialogHeight()
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
  @media(max-width 400px)
    left calc(-100% - 8px)
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
  .hidden
    display none
</style>
