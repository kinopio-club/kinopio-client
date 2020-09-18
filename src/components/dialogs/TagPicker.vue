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
      li(v-for="tag in filteredTags")
        .badge.tag-badge(:style="{backgroundColor: tag.color}")
          span {{tag.name}}

    Loader(:visible="loading")
</template>

<script>
import scrollIntoView from '@/scroll-into-view.js'
import cache from '@/cache.js'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

import fuzzy from 'fuzzy'

export default {
  name: 'TagPicker',
  components: {
    Loader
  },
  props: {
    visible: Boolean,
    position: Object,
    search: String
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
    },
    filteredTags () {
      let tags = this.tags.filter(tag => {
        return tag.name !== this.search
      })
      const options = {
        pre: '',
        post: '',
        extract: (item) => {
          let name = item.name || ''
          return name
        }
      }
      const filtered = fuzzy.filter(this.search, tags, options)
      tags = filtered.map(item => item.original)
      return tags
    }
  },
  methods: {
    updateTags () {
      const spaceTags = this.$store.getters['currentSpace/spaceTags']()
      this.tags = spaceTags || []
      const cachedTags = cache.allTags()
      const mergedTags = utils.mergedTags(spaceTags, cachedTags)
      this.tags = mergedTags.slice(0, 10)
      this.updateRemoteTags()
    },
    async updateRemoteTags () {
      console.log('🌌')
      // this.loading = true
      // await get remoteTags(user/tags) , assign to this.tags
      // mergedTags
      // this.loading false
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      console.log(element)
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateTags()
        this.$nextTick(() => {
          this.scrollIntoView()
        })
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
