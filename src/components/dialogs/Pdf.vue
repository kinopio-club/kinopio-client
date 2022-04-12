<template lang="pug">
dialog.narrow.pdf(v-if="visible" :open="visible" @click.left.stop)
  section
    p asldkfj
    //- p Download space PDF

    // Generating... PDF for {{soaceName}}

  //- section

  // handle upgraded users only

    //- .row
    //-   .segmented-buttons
    //-     button(@click="toggleIframeIsVisible" :class="{ active: iframeIsVisible }")
    //-       span iFrame
    //-     button(@click="toggleUrlIsVisible" :class="{ active: !iframeIsVisible }")
    //-       span Url

    //- template(v-if="iframeIsVisible")
    //-   textarea(ref="iframe") {{iframe}}
    //-   button(@click="copy") Copy Code
    //-   .row(v-if="isCopied")
    //-     .badge.success.success-message Code Copied

    //- template(v-if="!iframeIsVisible")
    //-   input.url-textarea(ref="url" v-model="url")
    //-   button(@click="copy") Copy Url
    //-   .row(v-if="isCopied")
    //-     .badge.success.success-message Url Copied
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
      // iframeIsVisible: true,
      isLoading: false,
      isDownloaded: false
    }
  },
  computed: {
    // url () {
    //   const spaceId = this.$store.state.currentSpace.id
    //   return `${utils.kinopioDomain()}/embed/?spaceId=${spaceId}&zoom=100`
    // },
  },
  methods: {
    // toggleIframeIsVisible () {
    //   this.iframeIsVisible = true
    //   this.isCopied = false
    // },
    // toggleUrlIsVisible () {
    //   this.iframeIsVisible = false
    //   this.isCopied = false
    // },
    // copy () {
    //   let element
    //   if (this.iframeIsVisible) {
    //     element = this.$refs.iframe
    //   } else {
    //     element = this.$refs.url
    //   }
    //   element.select()
    //   element.setSelectionRange(0, 99999) // for mobile
    //   document.execCommand('copy')
    //   this.isCopied = true
    // }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.isDownloaded = false
        // this.isLoading = true
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
