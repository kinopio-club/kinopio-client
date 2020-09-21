<template lang="pug">
dialog.narrow.tag-picker(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{top: position.top + 'px'}")
  section.info-section(v-if="!search")
    p
      img.icon.search(src="@/assets/search.svg")
      span Type to add or search tags
  section.results-section
    ul.results-list
      li(v-if="search" @click="selectTag(null, true)" :class="{hover: focusOnTagName === search}")
        .badge.tag-badge(:style="{backgroundColor: searchTagColor}")
          span {{search}}
      li(v-for="tag in filteredTags" @click="selectTag(tag, true)" :class="{hover: focusOnTagName === tag.name}")
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
import last from 'lodash-es/last'

export default {
  name: 'TagPicker',
  components: {
    Loader
  },
  mounted () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerPickerNavigationKey') {
        const key = mutation.payload
        const searchTag = [{
          name: this.search,
          color: this.currentUserColor
        }]
        const tags = searchTag.concat(this.filteredTags)
        const currentTagIndex = tags.findIndex(tag => tag.name === this.focusOnTagName)
        if (!utils.arrayHasItems(this.filteredTags)) {
          this.closeDialog()
        } else if (key === 'ArrowUp') {
          this.focusPreviousItem(tags, currentTagIndex)
        } else if (key === 'ArrowDown') {
          this.focusNextItem(tags, currentTagIndex)
        }
      }
      if (mutation.type === 'triggerPickerSelect') {
        const searchTag = [{
          name: this.search,
          color: this.searchTagColor
        }]
        const tags = searchTag.concat(this.filteredTags)
        const currentTag = tags.find(tag => tag.name === this.focusOnTagName)
        this.selectTag(currentTag)
      }
    })
  },
  props: {
    visible: Boolean,
    position: Object,
    search: String,
    cursorPosition: Number
  },
  data () {
    return {
      tags: [],
      loading: true,
      focusOnTagName: ''
    }
  },
  computed: {
    currentUserColor () { return this.$store.state.currentUser.color },
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
      return tags.slice(0, 5)
    },
    searchTagColor () {
      let tag = this.tags.find(tag => {
        return tag.name === this.search
      })
      if (tag) {
        return tag.color
      } else {
        return this.currentUserColor
      }
    }
  },
  methods: {
    updateTags () {
      const spaceTags = this.$store.getters['currentSpace/spaceTags']()
      this.tags = spaceTags || []
      const cachedTags = cache.allTags()
      const mergedTags = utils.mergedTags(spaceTags, cachedTags)
      this.tags = mergedTags
      this.updateRemoteTags()
    },
    async updateRemoteTags () {
      console.log('🌌')
      // this.loading = true
      // await get remoteTags(user/tags) , assign to this.tags
      // mergedTags
      // this.loading false
    },
    selectTag (tag, shouldCloseDialog) {
      const searchTag = {
        name: this.search,
        color: this.searchTagColor
      }
      tag = tag || searchTag
      this.$emit('selectTag', tag)
      if (shouldCloseDialog) {
        this.closeDialog()
      }
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      console.log(element)
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
    },

    focusPreviousItem (tags, currentTagIndex) {
      const firstItemIsFocused = this.search === this.focusOnTagName
      const firstItem = tags[0]
      const previousItem = tags[currentTagIndex - 1]
      if (firstItemIsFocused) {
        this.closeDialog()
      } else if (previousItem) {
        this.focusOnTagName = previousItem.name
      } else {
        this.focusOnTagName = firstItem.name
      }
    },
    focusNextItem (tags, currentTagIndex) {
      const lastItem = last(tags)
      const lastItemIsFocused = lastItem.name === this.focusOnTagName
      const nextItem = tags[currentTagIndex + 1]
      if (lastItemIsFocused) {
        this.closeDialog()
      } else if (nextItem) {
        this.focusOnTagName = nextItem.name
      } else {
        this.focusOnTagName = lastItem.name
      }
    },
    closeDialog () {
      this.$emit('closeDialog')
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
    },
    search (newSearch) {
      this.focusOnTagName = newSearch
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
