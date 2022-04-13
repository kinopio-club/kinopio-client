<template lang="pug">
dialog.narrow.pdf(v-if="visible" :open="visible" @click.left.stop)
  a#pdf-downlaod-anchor.hidden
  section
    template(v-if="isLoading")
      Loader(:visible="true")
      p Creating space PDF
    template(v-if="!isLoading")
      p {{fileName()}}.pdf
      p
        .badge.success Downloaded

  // TODO handle upgraded users only

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
  data () {
    return {
      isLoading: false
    }
  },
  computed: {
    userIsUpgraded () { return this.$store.state.currentUser.isUpgraded },
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
      if (!this.userIsUpgraded) { return }
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
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.isLoading = false
        this.pdf()
      }
    }
  }
}
</script>

<style lang="stylus">
</style>
