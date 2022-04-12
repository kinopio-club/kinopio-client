<template lang="pug">
dialog.narrow.pdf(v-if="visible" :open="visible" @click.left.stop)
  a#pdf-downlaod-anchor.hidden
  section
    p asldkfj
    //- p Download space PDF

    // Generating... PDF for {{soaceName}}

  //- section

  // handle upgraded users only

</template>

<script>
// import utils from '@/utils.js'

export default {
  name: 'Pdf',
  props: {
    visible: Boolean
  },
  data () {
    return {
      isLoading: false,
      isDownloaded: false
    }
  },
  computed: {
    userIsUpgraded () { return this.$store.state.currentUser.isUpgraded }
    // url () {
    //   const spaceId = this.$store.state.currentSpace.id
    //   return `${utils.kinopioDomain()}/embed/?spaceId=${spaceId}&zoom=100`
    // },
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
        this.isDownloaded = false
        this.isLoading = false
        this.pdf()
      }
    }
  }
}
</script>

<style lang="stylus">
// .pdf
//   cursor initial
  // .success-message
  //   margin-top 10px
</style>
