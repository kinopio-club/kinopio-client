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

const resultsElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateResultsSectionHeight)
  init()
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateResultsSectionHeight)
})

const props = defineProps({
  visible: Boolean,
  parentIsPinned: Boolean
})

const state = reactive({
  resultsSectionHeight: null,
  isLoading: false
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    init()
  }
})
const init = () => {
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
const tags = computed(() => globalStore.getTags)
const filteredTags = computed(() => {
  let tags = globalStore.getTags
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
</script>

<template lang="pug">
.tags(v-if="props.visible")
  section.results-section(v-if="tags.length" ref="resultsElement" :style="{'max-height': state.resultsSectionHeight + 'px'}")
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
