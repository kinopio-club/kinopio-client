<template lang="pug">
dialog.narrow.space-status(v-if="visible" :open="visible" @click.left="closeDialogs" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    Loader(:visible="true")
    p Space Status

</template>

<script>
import Loader from '@/components/Loader.vue'
// import cache from '@/cache.js'
// import Export from '@/components/dialogs/Export.vue'
// import Import from '@/components/dialogs/Import.vue'
// import AddSpace from '@/components/dialogs/AddSpace.vue'
// import SpaceList from '@/components/SpaceList.vue'
// import PrivacyButton from '@/components/PrivacyButton.vue'
// import ShowInExploreButton from '@/components/ShowInExploreButton.vue'
// import templates from '@/data/templates.js'
// import utils from '@/utils.js'

export default {
  name: 'SpaceStatus',
  components: {
    Loader
  },
  props: {
    visible: Boolean
  }
  // created () {
  //   this.$store.subscribe((mutation, state) => {
  //     if (mutation.type === 'updatePageSizes') {
  //       this.updateHeights()
  //     }
  //   })
  // },
  // data () {
  //   return {
  //     dialogHeight: null
  //   }
  // },
  // computed: {
  //   currentSpace () { return this.$store.state.currentSpace },
  // },
  // methods: {
  //   addSpace () {
  //     window.scrollTo(0, 0)
  //     this.$store.dispatch('currentSpace/addSpace')
  //     this.updateSpaces()
  //   },
  // },
  // watch: {
  //   visible (visible) {
  //     if (visible) {
  //       this.updateHeights()
  //     }
  //   }
  // }
}
</script>

<style lang="stylus">
</style>
