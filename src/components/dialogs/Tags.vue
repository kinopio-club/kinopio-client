<template lang="pug">
dialog.tags.narrow(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Tags
  section.results-section(v-if="tags.length" ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    .button-wrap(@click.left.prevent="toggleCurrentSpaceTagsIsVisibleOnly" @keydown.stop.enter="toggleCurrentSpaceTagsIsVisibleOnly")
      label(:class="{ active: currentSpaceTagsIsVisibleOnly }")
        input(type="checkbox" v-model="currentSpaceTagsIsVisibleOnly")
        span In Current Space
    TagList(:tags="filteredTags" :isLoading="isLoadingRemoteTags")
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
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
        this.updateResultsSectionHeight()
      }
      if (mutation.type === 'currentSpace/removeTags') {
        this.removeTag(mutation.payload)
      }
      if (mutation.type === 'currentSpace/updateTagNameColor') {
        this.updateTagColor(mutation.payload)
      }
    })
  },
  data () {
    return {
      resultsSectionHeight: null,
      dialogHeight: null,
      tags: [],
      isLoadingRemoteTags: false,
      currentSpaceTagsIsVisibleOnly: false
    }
  },
  computed: {
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    filteredTags () {
      if (this.currentSpaceTagsIsVisibleOnly) {
        return this.$store.getters['currentSpace/spaceTags']()
      } else {
        return this.tags
      }
    }
  },
  methods: {
    toggleCurrentSpaceTagsIsVisibleOnly () {
      this.currentSpaceTagsIsVisibleOnly = !this.currentSpaceTagsIsVisibleOnly
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
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeightFromHeader(element)
      })
    },
    updateTags () {
      const spaceTags = this.$store.getters['currentSpace/spaceTags']()
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
        remoteTags = await this.$store.dispatch('api/getUserTags') || []
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
        this.resultsSectionHeight = utils.elementHeightFromHeader(element, true)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
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
  @media(max-width 435px)
    left -150px
  > .results-section
    border-top 1px solid var(--primary)
    padding-top 4px
    > .button-wrap
      padding 4px
</style>
