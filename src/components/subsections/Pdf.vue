<template lang="pug">
a#pdf-downlaod-anchor.hidden
section.subsection.pdf(v-if="visible")
  template(v-if="isLoading")
    .row
      Loader(:visible="true")
      span Creating space PDF…
  template(v-if="unknownServerError")
    .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support
  template(v-if="!isLoading && !unknownServerError")
    p {{fileName()}}.pdf
    .badge.success Downloaded
</template>

<script>
import Loader from '@/components/Loader.vue'

export default {
  name: 'Pdf',
  components: {
    Loader
  },
  props: {
    visible: Boolean
  },
  mounted () {
    if (!this.visible) { return }
    this.init()
  },
  data () {
    return {
      isLoading: false,
      unknownServerError: false
    }
  },
  computed: {
    spaceName () { return this.$store.state.currentSpace.name }
  },
  methods: {
    fileName () {
      const spaceName = this.$store.state.currentSpace.name
      const spaceId = this.$store.state.currentSpace.id
      let fileName = spaceName || `kinopio-space-${spaceId}`
      return fileName
    },
    downloadBlob (blob) {
      const blobUrl = window.URL.createObjectURL(blob)
      const fileName = this.fileName()
      const downloadAnchor = document.getElementById('pdf-downlaod-anchor')
      downloadAnchor.setAttribute('href', blobUrl)
      downloadAnchor.setAttribute('download', `${fileName}.pdf`)
      downloadAnchor.click()
    },
    async pdf () {
      this.isLoading = true
      try {
        const url = await this.$store.dispatch('api/pdf')
        const response = await fetch(url, { method: 'GET' })
        const blob = await response.blob()
        this.downloadBlob(blob)
      } catch (error) {
        console.error('🚒', error)
        this.unknownServerError = true
      }
      this.isLoading = false
    },
    init () {
      this.unknownServerError = false
      this.isLoading = false
      this.pdf()
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.init()
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.pdf
  margin-top 10px
  margin-bottom 10px
  padding-bottom 4px
  .loader
    height 14px
    width 14px
    vertical-align 0px
    margin-right 4px

</style>
