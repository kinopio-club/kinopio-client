<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import TagList from '@/components/TagList.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

let unsubscribes

const resultsElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateResultsSectionHeight)
  init()

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'shouldHideFooter' && props.visible) {
        updateTags()
      }
    }
  )
  const tagActions = [
    'addTag',
    'removeTag',
    'removeTags',
    'removeTagsFromCard',
    'deleteTagsFromAllRemovedCardsPermanent'
  ]
  const spaceActionUnsubscribe = spaceStore.$onAction(
    ({ name, args }) => {
      if (name === 'removeTags') {
        removeTag(args[0])
      } else if (name === 'updateTagNameColor') {
        updateTagColor(args[0])
      } else if (tagActions.includes(name) && props.visible) {
        updateTags()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
    spaceActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateResultsSectionHeight)
  unsubscribes()
})

const props = defineProps({
  visible: Boolean,
  parentIsPinned: Boolean
})

const state = reactive({
  resultsSectionHeight: null,
  tags: [],
  isLoading: false
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

watch(() => state.isLoading, (value, prevValue) => {
  updateResultsSectionHeight()
})

const updateResultsSectionHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = resultsElement.value
  state.resultsSectionHeight = utils.elementHeight(element, true)
}
const filteredTags = computed(() => {
  let tags = state.tags
  if (shouldShowCurrentSpaceTags.value) {
    tags = spaceStore.getSpaceTags
  }
  console.info('♠︎ filteredTags', tags)
  return tags
})

const shouldShowCurrentSpaceTags = computed(() => userStore.shouldShowCurrentSpaceTags)
const toggleShouldShowCurrentSpaceTags = () => {
  const value = !shouldShowCurrentSpaceTags.value
  userStore.updateUser({ shouldShowCurrentSpaceTags: value })
}

// update tag

const removeTag = (tagToRemove) => {
  globalStore.tagDetailsIsVisible = false
  let tags = utils.clone(state.tags)
  tags = tags.filter(tag => {
    return tag.name !== tagToRemove.name
  })
  state.tags = tags
  globalStore.remoteTagsIsFetched = false
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
  globalStore.remoteTagsIsFetched = false
}

// tags list

const updateTags = async () => {
  const spaceTags = spaceStore.getSpaceTags
  state.tags = spaceTags || []
  const cachedTags = await cache.allTags()
  const mergedTags = utils.mergeArrays({ previous: spaceTags, updated: cachedTags, key: 'name' })
  state.tags = mergedTags
  // remote tags
  state.isLoading = true
  const remoteTags = await globalStore.updateRemoteTags(true)
  state.tags = remoteTags || []
  state.isLoading = false
}
</script>

<template lang="pug">
.tags(v-if="props.visible")
  section.results-section(v-if="state.tags.length" ref="resultsElement" :style="{'max-height': state.resultsSectionHeight + 'px'}")
    .button-wrap(@click.left.prevent="toggleShouldShowCurrentSpaceTags" @keydown.stop.enter="toggleShouldShowCurrentSpaceTags")
      label(:class="{ active: shouldShowCurrentSpaceTags }")
        input(type="checkbox" v-model="shouldShowCurrentSpaceTags")
        span In Current Space
    TagList(:tags="filteredTags" :isLoading="state.isLoading" :parentIsPinned="props.parentIsPinned" :positionTagsOnLeftSide="true")
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
