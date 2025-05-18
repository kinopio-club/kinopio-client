<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useUserStore } from '@/stores/useUserStore'

import TagList from '@/components/TagList.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'

import uniqBy from 'lodash-es/uniqBy'
import debounce from 'lodash-es/debounce'

const store = useStore()
const userStore = useUserStore()

let unsubscribe

const resultsElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateResultsSectionHeight)
  init()
  const tagMutations = [
    'currentSpace/addTag',
    'currentSpace/removeTag',
    'currentSpace/removeTags',
    'currentSpace/removeTagsFromCard',
    'currentSpace/deleteTagsFromAllRemovedCardsPermanent'
  ]
  unsubscribe = store.subscribe(mutation => {
    if (mutation.type === 'currentSpace/removeTags') {
      removeTag(mutation.payload)
    } else if (mutation.type === 'currentSpace/updateTagNameColor') {
      updateTagColor(mutation.payload)
    } else if (tagMutations.includes(mutation.type) && props.visible) {
      updateTags()
    } else if (mutation.type === 'shouldHideFooter' && props.visible) {
      updateTags()
    }
  })
})
onBeforeUnmount(() => {
  unsubscribe()
})

const props = defineProps({
  visible: Boolean,
  parentIsPinned: Boolean
})

const state = reactive({
  resultsSectionHeight: null,
  tags: [],
  isLoadingRemoteTags: false
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    init()
  }
})
const init = () => {
  updateTags()
  updateResultsSectionHeight()
}

watch(() => state.isLoadingRemoteTags, (value, prevValue) => {
  updateResultsSectionHeight()
})

const updateResultsSectionHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = resultsElement.value
  state.resultsSectionHeight = utils.elementHeight(element, true)
}
const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const filteredTags = computed(() => {
  let tags = state.tags
  if (shouldShowCurrentSpaceTags.value) {
    tags = store.getters['currentSpace/spaceTags']
  }
  console.info('♠︎ filteredTags', tags)
  return tags
})

const shouldShowCurrentSpaceTags = computed(() => userStore.shouldShowCurrentSpaceTags)
const toggleShouldShowCurrentSpaceTags = () => {
  const value = !shouldShowCurrentSpaceTags.value
  store.dispatch('currentUser/update', { shouldShowCurrentSpaceTags: value })
}

// update tag

const removeTag = (tagToRemove) => {
  store.commit('tagDetailsIsVisible', false)
  let tags = utils.clone(state.tags)
  tags = tags.filter(tag => {
    return tag.name !== tagToRemove.name
  })
  state.tags = tags
  store.commit('remoteTagsIsFetched', false)
}
const updateTagColor = (updated) => {
  let tags = utils.clone(state.tags)
  tags = tags.map(tag => {
    if (tag.name === updated.name) {
      tag.color = updated.color
    }
    return tag
  })
  state.tags = tags
  store.commit('remoteTagsIsFetched', false)
}

// tags list

const updateTags = async () => {
  const spaceTags = store.getters['currentSpace/spaceTags']
  state.tags = spaceTags || []
  const cachedTags = await cache.allTags()
  const mergedTags = utils.mergeArrays({ previous: spaceTags, updated: cachedTags, key: 'name' })
  state.tags = mergedTags
  debouncedUpdateRemoteTags()
}
const debouncedUpdateRemoteTags = debounce(async () => {
  if (!currentUserIsSignedIn.value) { return }
  const remoteTagsIsFetched = store.state.remoteTagsIsFetched
  let remoteTags
  if (remoteTagsIsFetched) {
    remoteTags = store.state.remoteTags
  } else {
    state.isLoadingRemoteTags = true
    remoteTags = await store.dispatch('api/getUserTags', true) || []
    store.commit('remoteTags', remoteTags)
    store.commit('remoteTagsIsFetched', true)
    state.isLoadingRemoteTags = false
  }
  remoteTags = uniqBy(remoteTags, 'name')
  state.tags = remoteTags
}, 350, { leading: true })
</script>

<template lang="pug">
.tags(v-if="props.visible")
  section.results-section(v-if="state.tags.length" ref="resultsElement" :style="{'max-height': state.resultsSectionHeight + 'px'}")
    .button-wrap(@click.left.prevent="toggleShouldShowCurrentSpaceTags" @keydown.stop.enter="toggleShouldShowCurrentSpaceTags")
      label(:class="{ active: shouldShowCurrentSpaceTags }")
        input(type="checkbox" v-model="shouldShowCurrentSpaceTags")
        span In Current Space
    TagList(:tags="filteredTags" :isLoading="state.isLoadingRemoteTags" :parentIsPinned="props.parentIsPinned" :positionTagsOnLeftSide="true")
  section(v-else)
    p Use tags to help cards stand out, and to connect ideas across spaces.
    p Type
      span {{' '}}
      span.badge.secondary [[
      span when editing a card to create tags
</template>

<style lang="stylus">
.tags
  > .results-section
    border-top 1px solid var(--primary-border)
    padding-top 4px
    > .button-wrap
      padding 4px
</style>
