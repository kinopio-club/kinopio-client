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
    // anon user
    template(v-if="!currentUserIsSignedIn")
      p
        span.badge.info json
      button(@click.left="downloadLocalJSON") Download Space
      p
        span Sign Up or In for more export options
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
    // signed in user
    template(v-if="currentUserIsSignedIn")
      p
        span.badge.info json and txt
      button(@click.left="downloadCurrentSpaceRemote" :class="{ active: isLoadingCurrentSpace }")
        span Download Space
        Loader(:visible="isLoadingCurrentSpace")
      button(@click.left="downloadAllSpacesRemote" :class="{ active: isLoadingAllSpaces }")
        span Download All Spaces
        Loader(:visible="isLoadingAllSpaces")
    a#export-downlaod-anchor.hidden
    .error-container(v-if="unknownServerError")
      .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support

</template>

<script>
import scrollIntoView from '@/scroll-into-view.js'
import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'

import join from 'lodash-es/join'

export default {
  name: 'Export',
  components: {
    Loader
  },
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
      dialogHeight: null,
      isLoadingCurrentSpace: false,
      isLoadingAllSpaces: false,
      unknownServerError: false
    }
  },
  computed: {
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
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
    downloadLocalJSON () {
      const json = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.exportData))
      const fileName = this.fileName()
      const downloadAnchor = document.getElementById('export-downlaod-anchor')
      downloadAnchor.setAttribute('href', json)
      downloadAnchor.setAttribute('download', `${fileName}.json`)
      downloadAnchor.click()
    },
    downloadBlob (blob) {
      const blobUrl = window.URL.createObjectURL(blob)
      const fileName = this.fileName()
      const downloadAnchor = document.getElementById('export-downlaod-anchor')
      downloadAnchor.setAttribute('href', blobUrl)
      downloadAnchor.setAttribute('download', `${fileName}.zip`)
      downloadAnchor.click()
    },
    async downloadCurrentSpaceRemote () {
      if (this.isLoadingCurrentSpace) { return }
      this.unknownServerError = false
      this.isLoadingCurrentSpace = true
      try {
        const blob = await this.$store.dispatch('api/downloadCurrentSpace')
        this.downloadBlob(blob)
      } catch (error) {
        console.error('🚒', error)
        this.unknownServerError = true
      }
      this.isLoadingCurrentSpace = false
    },
    async downloadAllSpacesRemote () {
      if (this.isLoadingAllSpaces) { return }
      this.unknownServerError = false
      this.isLoadingAllSpaces = true
      try {
        const blob = await this.$store.dispatch('api/downloadAllSpaces')
        this.downloadBlob(blob)
      } catch (error) {
        console.error('🚒', error)
        this.unknownServerError = true
      }
      this.isLoadingAllSpaces = false
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
    },
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'ShowInExploreButton.triggerSignUpOrInIsVisible')
      this.$store.commit('triggerSignUpOrInIsVisible')
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
  .error-container
    margin-top 10px
</style>
