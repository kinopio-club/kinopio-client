<template lang="pug">
dialog.narrow.tag-picker(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{top: position.top + 'px'}")
  section(v-if="!search")
    p
      img.icon.search(src="@/assets/search.svg")
      span Type to add or search tags
  section.results-section
    ul.results-list
      li(v-if="search")
        .badge.info.tag-badge(:style="{backgroundColor: currentUserColor}")
          img.icon.add(v-if="!existingSpaceTag" src="@/assets/add.svg")
          span {{search}}
    Loader(:visible="loading")
</template>

<script>
// import scrollIntoView from '@/scroll-into-view.js'
// import cache from '@/cache.js'
import Loader from '@/components/Loader.vue'

export default {
  name: 'TagPicker',
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
      tags: [],
      loading: true
    }
  },
  computed: {
    currentUserColor () {
      return this.$store.state.currentUser.color
    },
    existingSpaceTag () {
      const currentCardId = this.$store.state.cardDetailsIsVisibleForCardId
      return this.$store.getters['currentSpace/tagByNameInOtherCard']({
        name: this.search,
        cardId: currentCardId
      })
    }
    // spaceTags () {
    //   return this.$store.currentSpace.tags
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
.tag-picker
  .loader
    margin-left 6px
  .results-section
    margin-top 2px
</style>
