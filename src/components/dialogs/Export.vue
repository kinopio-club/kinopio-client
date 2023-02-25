<template lang="pug">
dialog.narrow.export(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Export
  section
    //- Card Names
    .row
      button(@click.left="copyText")
        img.icon.copy(src="@/assets/copy.svg")
        span Copy All Card Names
    //- PDF
    .row(v-if="currentUserIsSignedIn")
      .button-wrap
        button(@click.left.stop="togglePdfIsVisible" :class="{ active: pdfIsVisible }")
          span PDF
    Pdf(:visible="pdfIsVisible")
    //- Duplicate
    button(@click.left="duplicateSpace")
      img.icon(src="@/assets/add.svg")
      span Make a Copy
    .row(v-if="spaceIsDuplicated")
      span.badge.success Space copied

  section
    // anon user
    template(v-if="!currentUserIsSignedIn")
      p
        span Backup {{' '}}
        span.badge.info JSON
      button(@click.left="downloadLocalJSON") Download Space
      p
        span Sign Up or In for more export options
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
    // signed in user
    template(v-if="currentUserIsSignedIn")
      p
        span Backup {{' '}}
        span.badge.info JSON and TXT
      button(@click.left="downloadCurrentSpaceRemote" :class="{ active: isLoadingCurrentSpace }")
        span Download Space
        Loader(:visible="isLoadingCurrentSpace")
      button(@click.left="downloadAllSpacesRemote" :class="{ active: isLoadingAllSpaces }")
        span Download All Spaces
        Loader(:visible="isLoadingAllSpaces")
    a#export-downlaod-anchor.hidden
    .info-container(v-if="isLoadingAllSpaces")
      .badge.info This will take a minute or so…
    .info-container(v-if="unknownServerError")
      .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support

</template>

<script>
import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'
import Pdf from '@/components/subsections/Pdf.vue'

export default {
  name: 'Export',
  components: {
    Loader,
    Pdf
  },
  props: {
    visible: Boolean
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
      spaceIsDuplicated: false,
      dialogHeight: null,
      isLoadingCurrentSpace: false,
      isLoadingAllSpaces: false,
      unknownServerError: false,
      pdfIsVisible: false
    }
  },
  computed: {
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    text () { return utils.textFromCardNames(this.currentSpace.cards) },
    currentSpace () { return this.$store.getters['currentSpace/all'] }
  },
  methods: {
    fileName () {
      const spaceName = this.$store.state.currentSpace.name
      const spaceId = this.$store.state.currentSpace.id
      let fileName = spaceName || `kinopio-space-${spaceId}`
      return fileName
    },
    async copyText (event) {
      this.$store.commit('clearNotificationsWithPosition')
      const position = utils.cursorPositionInPage(event)
      try {
        await navigator.clipboard.writeText(this.text)
        this.$store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
      } catch (error) {
        console.warn('🚑 copyText', error)
        this.$store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
      }
    },
    downloadLocalJSON () {
      const json = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.currentSpace))
      const fileName = this.fileName()
      const downloadAnchor = document.getElementById('export-downlaod-anchor')
      downloadAnchor.setAttribute('href', json)
      downloadAnchor.setAttribute('download', `${fileName}.json`)
      downloadAnchor.click()
    },
    downloadBlob (blob, fileName) {
      const blobUrl = window.URL.createObjectURL(blob)
      fileName = fileName || this.fileName()
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
        this.downloadBlob(blob, 'kinopio-spaces')
      } catch (error) {
        console.error('🚒', error)
        this.unknownServerError = true
      }
      this.isLoadingAllSpaces = false
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      utils.scrollIntoView(element)
    },
    duplicateSpace () {
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
    },
    togglePdfIsVisible () {
      const isVisible = this.pdfIsVisible
      this.pdfIsVisible = !isVisible
    }
  },
  watch: {
    visible (visible) {
      this.$store.commit('clearNotificationsWithPosition')
      this.$nextTick(() => {
        if (visible) {
          this.pdfIsVisible = false
          this.scrollIntoView()
          this.spaceIsDuplicated = false
          this.updateDialogHeight()
        }
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
.export
  top calc(100% - 8px)
  left initial
  right 8px
  overflow scroll
  max-height calc(100vh - 100px)
  textarea
    background-color var(--secondary-background)
    border 0
    border-radius var(--small-entity-radius)
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
  .info-container
    margin-top 10px
  .url-textarea
    max-height 100px
</style>
