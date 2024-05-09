<template lang="pug">
.tags(v-if="visible")
  section.results-section(v-if="tags.length" ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    .button-wrap(@click.left.prevent="toggleShouldShowCurrentSpaceTags" @keydown.stop.enter="toggleShouldShowCurrentSpaceTags")
      label(:class="{ active: shouldShowCurrentSpaceTags }")
        input(type="checkbox" v-model="shouldShowCurrentSpaceTags")
        span In Current Space
    TagList(:tags="filteredTags" :isLoading="isLoadingRemoteTags" :parentIsPinned="parentIsPinned" :positionTagsOnLeftSide="true")
  section(v-else)
    p Use tags to help cards stand out, and to connect ideas across spaces.
    p Type
      span {{' '}}
      span.badge.secondary [[
      span when editing a card to create tags
</template>

<script>
import TagList from '@/components/TagList.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'

import uniqBy from 'lodash-es/uniqBy'
import debounce from 'lodash-es/debounce'

export default {
  name: 'Links',
  components: {
    TagList
  },
  props: {
    visible: Boolean,
    parentIsPinned: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      const tagMutations = [
        'currentSpace/addTag',
        'currentSpace/removeTag',
        'currentSpace/removeTags',
        'currentSpace/removeTagsFromCard',
        'currentSpace/deleteTagsFromAllRemovedCardsPermanent'
      ]

      if (mutation.type === 'updatePageSizes') {
        this.updateResultsSectionHeight()
      } else if (mutation.type === 'currentSpace/removeTags') {
        this.removeTag(mutation.payload)
      } else if (mutation.type === 'currentSpace/updateTagNameColor') {
        this.updateTagColor(mutation.payload)
      } else if (tagMutations.includes(mutation.type) && this.visible) {
        this.updateTags()
      } else if (mutation.type === 'shouldHideFooter' && this.visible) {
        this.updateTags()
      }
    })
  },
  mounted () {
    this.updateTags()
    this.updateResultsSectionHeight()
  },
  data () {
    return {
      resultsSectionHeight: null,
      tags: [],
      isLoadingRemoteTags: false
    }
  },
  computed: {
    shouldShowCurrentSpaceTags () { return this.$store.state.currentUser.shouldShowCurrentSpaceTags },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    filteredTags () {
      if (this.shouldShowCurrentSpaceTags) {
        return this.$store.getters['currentSpace/spaceTags']
      } else {
        return this.tags
      }
    }
  },
  methods: {
    toggleShouldShowCurrentSpaceTags () {
      const value = !this.shouldShowCurrentSpaceTags
      this.$store.dispatch('currentUser/update', { shouldShowCurrentSpaceTags: value })
    },
    removeTag (tagToRemove) {
      this.$store.commit('tagDetailsIsVisible', false)
      let tags = utils.clone(this.tags)
      tags = tags.filter(tag => {
        return tag.name !== tagToRemove.name
      })
      this.tags = tags
      this.$store.commit('remoteTagsIsFetched', false)
    },
    updateTagColor (updated) {
      let tags = utils.clone(this.tags)
      tags = tags.map(tag => {
        if (tag.name === updated.name) {
          tag.color = updated.color
        }
        return tag
      })
      this.tags = tags
      this.$store.commit('remoteTagsIsFetched', false)
    },
    updateTags () {
      const spaceTags = this.$store.getters['currentSpace/spaceTags']
      this.tags = spaceTags || []
      const cachedTags = cache.allTags()
      const mergedTags = utils.mergeArrays({ previous: spaceTags, updated: cachedTags, key: 'name' })
      this.tags = mergedTags
      this.debouncedUpdateRemoteTags()
    },
    debouncedUpdateRemoteTags: debounce(async function () {
      if (!this.currentUserIsSignedIn) { return }
      const remoteTagsIsFetched = this.$store.state.remoteTagsIsFetched
      let remoteTags
      if (remoteTagsIsFetched) {
        remoteTags = this.$store.state.remoteTags
      } else {
        this.isLoadingRemoteTags = true
        remoteTags = await this.$store.dispatch('api/getUserTags', true) || []
        this.$store.commit('remoteTags', remoteTags)
        this.$store.commit('remoteTagsIsFetched', true)
        this.isLoadingRemoteTags = false
      }
      remoteTags = uniqBy(remoteTags, 'name')
      this.tags = remoteTags
    }, 350, { leading: true }),
    updateResultsSectionHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeight(element, true)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateTags()
        this.updateResultsSectionHeight()
      }
    },
    isLoadingRemoteTags (value) {
      this.updateResultsSectionHeight()
    }
  }
}
</script>

<style lang="stylus">
.tags
  > .results-section
    border-top 1px solid var(--primary-border)
    padding-top 4px
    > .button-wrap
      padding 4px
</style>
