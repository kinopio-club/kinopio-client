<template lang="pug">
dialog.narrow.tag-picker-style-actions(v-if="visible" :open="visible" ref="dialog" @click.left.stop)
  TagList(:tags="tags" :isLoading="loading" :shouldEmitSelectTag="true" @selectTag="selectTag")
</template>

<script>
import TagList from '@/components/TagList.vue'
import scrollIntoView from '@/scroll-into-view.js'
import cache from '@/cache.js'
// import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

export default {
  name: 'TagPickerStyleActions',
  components: {
    TagList
  },
  props: {
    visible: Boolean,
    cards: Array
  },
  data () {
    return {
      tags: [],
      loading: false
    }
  },
  // computed: {
  //   frames () {
  //     return frames
  //   }
  // },
  methods: {
    scrollIntoView () {
      this.$nextTick(() => {
        const element = this.$refs.dialog
        const isTouchDevice = this.$store.state.isTouchDevice
        scrollIntoView.scroll(element, isTouchDevice)
      })
    },
    selectTag (tag) {
      console.log('🐢', tag)
    },

    // same as TagPicker

    updateTags () {
      const spaceTags = this.$store.getters['currentSpace/spaceTags']()
      this.tags = spaceTags || []
      const cachedTags = cache.allTags()
      const mergedTags = utils.mergeArrays({ previous: spaceTags, updated: cachedTags, key: 'name' })
      this.tags = mergedTags
      this.updateRemoteTags()
    },
    async updateRemoteTags () {
      if (!this.currentUserIsSignedIn) { return }
      const remoteTagsIsFetched = this.$store.state.remoteTagsIsFetched
      let remoteTags
      if (remoteTagsIsFetched) {
        remoteTags = this.$store.state.remoteTags
      } else {
        this.loading = true
        remoteTags = await this.$store.dispatch('api/getUserTags') || []
        this.$store.commit('remoteTags', remoteTags)
        this.$store.commit('remoteTagsIsFetched', true)
        this.loading = false
      }
      const mergedTags = utils.mergeArrays({ previous: this.tags, updated: remoteTags, key: 'name' })
      this.tags = mergedTags
      this.scrollIntoView()
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.scrollIntoView()
        this.updateTags()
      }
    }
  }
}
</script>

<style lang="stylus">
</style>
