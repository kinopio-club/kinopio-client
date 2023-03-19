<template lang="pug">
.preload
  //-   .logo-hover
  //-   .logo-active

  template(v-for="url in imageUrls")
    img.hidden(:src="url")

  .icons.hidden
    img.icon(src="@/assets/offline.svg")
    img.icon(src="@/assets/center-horizontally.svg")
    img.icon(src="@/assets/distribute-horizontally.svg")

    //- logo
    img.icon(src="@/assets/logo-hover.png")
    img.icon(src="@/assets/logo-active.png")

</template>

<script>
// import utils from '@/utils.js'

import { mapState, mapGetters } from 'vuex'

export default {
  name: 'Preload',
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'isLoadingSpace') {
        this.updateImageUrls()
      }
    })
  },
  data () {
    return {
      imageUrls: []
    }
  },
  computed: {
    ...mapState([
    ]),
    ...mapGetters([
      'currentCards/all'
    ])
  },
  methods: {
    updateImageUrls () {
      const cards = this['currentCards/all']
      let imageUrls = cards.map(card => card.urlPreviewImage)
      imageUrls = imageUrls.filter(url => Boolean(url))
      this.imageUrls = imageUrls
    }
  }
}
</script>

<style lang="stylus">
</style>
