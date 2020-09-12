<template lang="pug">
dialog.narrow.label-picker(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{top: position.top + 'px'}")
  section
    p
      //- ^ vif !currentLabelName
      img.icon.search(src="@/assets/search.svg")
      span Type to add label
  section.results-section
    p {{search}}
    //- ^ temp
    Loader(:visible="loading")
    //- ul.results-list 👀 spacelist
</template>

<script>
// import scrollIntoView from '@/scroll-into-view.js'
// import cache from '@/cache.js'
import Loader from '@/components/Loader.vue'

export default {
  name: 'LabelPicker',
  components: {
    Loader
  },
  props: {
    visible: Boolean,
    position: Object,
    search: String
    // selectedSpace: Object,
    // shouldExcludeCurrentSpace: Boolean,
    // userSpaces: Array,
    // user: Object,
    // loading: Boolean,
    // showUserIfCurrentUserIsCollaborator: Boolean
  },
  data () {
    return {
      labels: [],
      loading: true
    }
  },
  computed: {
    // activeUser () {
    //   const currentUser = this.$store.state.currentUser
    //   return this.user || currentUser
    // }
  }
  // methods: {
  // },
  // watch: {
  //   visible (visible) {
  //     this.$nextTick(() => {
  //       if (visible) {
  //         this.updateSpaces()
  //         this.scrollIntoView()
  //       }
  //     })
  //   },
  // }
}
</script>

<style lang="stylus">
</style>
