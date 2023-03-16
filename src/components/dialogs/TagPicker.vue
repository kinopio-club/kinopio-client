<template lang="pug">
dialog.narrow.tag-picker(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{top: position.top + 'px'}")
  section.info-section(v-if="!search")
    p
      img.icon.search(src="@/assets/search.svg")
      span Type to add or search tags
  section.results-section
    ul.results-list
      li(v-if="search" @click="selectTag(null, true)" @touchend.stop :class="{hover: focusOnName === search}")
        Tag(:tag="searchTag" :tagBadgeLabel="tagBadgeLabel" @clickTag="clickTag")
      li(v-for="tag in filteredTags" @click="selectTag(tag, true)" @touchend.stop :class="{hover: focusOnName === tag.name}")
        Tag(:tag="tag" @clickTag="clickTag")
    Loader(:visible="loading")
</template>

<script>
import cache from '@/cache.js'
import Loader from '@/components/Loader.vue'
import Tag from '@/components/Tag.vue'
import utils from '@/utils.js'

import fuzzy from '@/libs/fuzzy.js'
import last from 'lodash-es/last'
import randomColor from 'randomcolor'

let unsubscribe

export default {
  name: 'TagPicker',
  components: {
    Loader,
    Tag
  },
  mounted () {
    unsubscribe = this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerPickerNavigationKey') {
        if (!this.visible) { return }
        const key = mutation.payload
        const searchTag = [{
          name: this.search,
          color: this.searchTagColor
        }]
        const tags = searchTag.concat(this.filteredTags)
        const currentIndex = tags.findIndex(tag => tag.name === this.focusOnName)
        if (key === 'ArrowUp') {
          this.focusPreviousItem(tags, currentIndex)
        } else if (key === 'ArrowDown') {
          this.focusNextItem(tags, currentIndex)
        }
      }
      if (mutation.type === 'triggerPickerSelect') {
        if (!this.visible) { return }
        let tags = this.filteredTags
        if (this.search) {
          const searchTag = [{
            name: this.search,
            color: this.searchTagColor
          }]
          tags = searchTag.concat(this.filteredTags)
        }
        const currentIndex = tags.findIndex(tag => tag.name === this.focusOnName)
        const currentTag = tags[currentIndex]
        console.log('🎹 triggerPickerSelect', {
          search: this.search,
          focusOnName: this.focusOnName,
          currentTag,
          tags,
          currentIndex
        })
        this.selectTag(currentTag)
      }
    })
  },
  beforeUnmount () {
    unsubscribe()
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
      loading: false,
      focusOnName: '',
      randomColor: ''
    }
  },
  computed: {
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
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
    searchTagMatch () {
      let tag = this.tags.find(tag => {
        return tag.name === this.search
      })
      if (tag) {
        return tag
      } else {
        return null
      }
    },
    searchTagColor () {
      let tag = this.searchTagMatch
      if (tag) {
        return tag.color
      } else {
        return this.randomColor
      }
    },
    searchTag () {
      return {
        name: this.search,
        color: this.searchTagColor
      }
    }
  },
  methods: {
    tagBadgeLabel () {
      if (!this.searchTagMatch) {
        return 'New Tag'
      }
    },
    updateTags () {
      const spaceTags = this.$store.getters['currentSpace/spaceTags']
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
    },
    clickTag (event, tag) {
      this.selectTag(tag, true)
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
      utils.scrollIntoView(element)
    },

    focusPreviousItem (tags, currentIndex) {
      const firstItem = tags[0]
      const previousItem = tags[currentIndex - 1]
      if (previousItem) {
        this.focusOnName = previousItem.name
      } else {
        this.focusOnName = firstItem.name
      }
    },
    focusNextItem (tags, currentIndex) {
      const lastItem = last(tags)
      const nextItem = tags[currentIndex + 1]
      if (nextItem) {
        this.focusOnName = nextItem.name
      } else {
        this.focusOnName = lastItem.name
      }
    },
    closeDialog () {
      this.$emit('closeDialog')
    },
    color () {
      const isThemeDark = this.$store.state.currentUser.theme === 'dark'
      let color = randomColor({ luminosity: 'light' })
      if (isThemeDark) {
        color = randomColor({ luminosity: 'dark' })
      }
      return color
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.randomColor = this.color()
        this.updateTags()
        this.$nextTick(() => {
          this.scrollIntoView()
        })
      }
    },
    search (newSearch) {
      this.focusOnName = newSearch
      const currentTag = { name: newSearch, color: this.searchTagColor }
      this.$emit('currentTag', currentTag)
    },
    randomColor (color) {
      this.$emit('newTagColor', this.randomColor)
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
  .label-badge
    bottom -10px
    min-height 12px
    width max-content
    z-index 1
</style>
