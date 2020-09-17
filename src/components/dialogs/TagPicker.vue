<template lang="pug">
dialog.narrow.tag-picker(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{top: position.top + 'px'}")
  section.info-section(v-if="!search")
    p
      img.icon.search(src="@/assets/search.svg")
      span Type to add or search tags
  section.results-section
    ul.results-list
      li(v-if="search")
        .badge.tag-badge(:style="{backgroundColor: currentUserColor}")
          img.icon.add(v-if="!tagExists" src="@/assets/add.svg")
          span {{search}}
      li(v-for="tag in tags")
        .badge.tag-badge(:style="{backgroundColor: tag.color}")
          span {{tag.name}}

    Loader(:visible="loading")
</template>

<script>
// import scrollIntoView from '@/scroll-into-view.js'
import cache from '@/cache.js'
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
    // loading: Boolean,
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
    tagExists () {
      const currentCardId = this.$store.state.cardDetailsIsVisibleForCardId
      console.log('🍄', this.tags)
      const tags = this.tags.filter(tag => {
        const isName = tag.name === this.search
        const isOtherCard = tag.cardId !== currentCardId
        return isName && isOtherCard
      })
      if (tags.length) {
        return true
      } else {
        return false
      }
    }
  },
  methods: {
    updateTags () {
      const spaceTags = this.$store.getters['currentSpace/spaceTags']()
      this.tags = spaceTags

      const cachedTags = cache.allTags()
      console.log('🌲', spaceTags, cachedTags)
      // merge
      // this.tags = mergedTags

      // x most recently added = first in each array
    },
    mergeTags (spaceTags, cachedTags) {
      // move to util
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateTags()
      }
    }
  }
}
</script>

<style lang="stylus">
.tag-picker
  .loader
    margin-left 6px
  .info-section
    padding-bottom 4px
  .results-section
    &:first-child
      padding-top 4px
</style>
