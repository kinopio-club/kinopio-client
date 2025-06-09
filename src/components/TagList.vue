<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useGlobalStore } from '@/stores/useGlobalStore'

import ResultsFilter from '@/components/ResultsFilter.vue'
import Tag from '@/components/Tag.vue'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

onMounted(() => {
  console.info('🐴 the component is now mounted.', spaceStore.getSpaceAllState)
  // const cardStoreUnsubscribe = cardStore.$onAction(
  //   ({name, args}) => {
  //     if (name === 'moveCards') {
  //       cancelAnimation()
  //     }
  //   }
  // )
  // const globalStoreUnsubscribe = globalStore.$onAction(
  //   ({ name, args }) => {
  //     if (name === 'moveCards') {
  //       cancelAnimation()
  //     }
  //   }
  // )
  // unsubscribes = () => {
  //   cardStoreUnsubscribe()
  //   globalStoreUnsubscribe()
  // }
})
// onBeforeUnmount(() => {
//   unsubscribes()
// })

const emit = defineEmits(['addTag', 'selectTag', 'closeDialogs'])

const props = defineProps({
  tags: Array,
  isLoading: Boolean,
  parentIsPinned: Boolean,
  shouldEmitSelectTag: Boolean,
  currentTags: Array,
  positionTagsOnLeftSide: Boolean,
  canAddTag: Boolean
})
const state = reactive({
  filter: '',
  filteredTags: [],
  prevTagName: null,
  tagDetailsTag: {},
  focusOnId: ''
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    closeDialogs()
  }
})
watch(() => props.tags, (value, prevValue) => {
  if (!value) { return }
  const updatedTag = value.find(tag => tag.name === state.tagDetailsTag.name)
  if (updatedTag) {
    updateTagDetailsTag(updatedTag)
  }
})
const currentSelectedTag = computed(() => globalStore.currentSelectedTag)
const tagsFiltered = computed(() => {
  if (state.filter) {
    return state.filteredTags
  } else {
    return props.tags
  }
})
const firstResultName = computed(() => {
  if (!tagsFiltered.value.length) { return }
  return tagsFiltered.value[0].name
})
const addTagIsVisible = computed(() => {
  if (!props.canAddTag) { return }
  if (state.filter === firstResultName.value) { return }
  return Boolean(state.filter)
})
const addTag = () => {
  emit('addTag', state.filter)
  updateFilter('')
}
const tagIsActive = (tag) => {
  const isTagDetails = state.tagDetailsTag.name === tag.name
  let isCurrentTag
  if (props.currentTags) {
    isCurrentTag = props.currentTags.includes(tag.name)
  }
  return isTagDetails || isCurrentTag
}
const tagIsFocused = (tag) => {
  return state.focusOnId === tag.id
}
const updatePosition = (event, tag) => {
  let rect
  if (event) {
    rect = event.target.getBoundingClientRect()
  } else {
    const element = document.querySelector(`li[data-tag-id="${tag.id}"]`)
    rect = element.getBoundingClientRect()
  }
  const position = {
    x: rect.x + (rect.width / 2) + window.scrollX,
    y: rect.y + 8 + window.scrollY,
    pageX: window.scrollX,
    pageY: window.scrollY
  }
  if (props.positionTagsOnLeftSide) {
    const tagDetailsWidth = 250
    position.x = rect.x + window.scrollX - tagDetailsWidth
  }
  globalStore.tagDetailsPosition = position
  globalStore.tagDetailsPositionShouldUpdate = true
}
const updateTagDetailsTag = (tag) => {
  state.tagDetailsTag = tag
  globalStore.currentSelectedTag = tag
}
const updateTagDetailsIsVisible = (value) => {
  globalStore.tagDetailsIsVisible = value
  globalStore.tagDetailsIsVisibleFromTagList = value
}
const selectTag = async (event, tag) => {
  if (props.shouldEmitSelectTag) {
    emit('selectTag', tag)
    return
  }
  closeDialogs()
  await nextTick()
  updatePosition(event, tag)
  updateTagDetailsTag(tag)
  if (state.prevTagName === tag.name) {
    const value = !globalStore.tagDetailsIsVisible
    updateTagDetailsIsVisible(value)
  } else {
    updateTagDetailsIsVisible(true)
  }
  state.prevTagName = tag.name
}
const closeDialogs = () => {
  emit('closeDialogs')
}
const updateFilteredTags = (tags) => {
  state.filteredTags = tags
}
const updateFilter = async (filter) => {
  state.filter = filter
  await nextTick()
  const tags = tagsFiltered.value || props.tags
  if (!tags.length) { return }
  state.focusOnId = tags[0].id
}
const focusNextItem = () => {
  const tags = tagsFiltered.value
  const currentIndex = tags.findIndex(tags => tags.id === state.focusOnId)
  let index = currentIndex + 1
  if (tags.length === index) {
    index = 0
  }
  focusItem(tags[index])
}
const focusPreviousItem = () => {
  const tags = tagsFiltered.value
  const currentIndex = tags.findIndex(tags => tags.id === state.focusOnId)
  let index = currentIndex - 1
  if (index < 0) {
    index = 0
  }
  focusItem(tags[index])
}
const selectItem = () => {
  const tags = tagsFiltered.value
  const index = tags.findIndex(tags => tags.id === state.focusOnId)
  selectTag(null, tags[index])
}
const focusItem = (tag) => {
  state.focusOnId = tag.id
}
</script>

<template lang="pug">
span.tag-list(@click.left="closeDialogs")
  template(v-if="props.tags")
    ResultsFilter(
      :items="props.tags"
      :parentIsPinned="props.parentIsPinned"
      @updateFilter="updateFilter"
      @updateFilteredItems="updateFilteredTags"
      @focusNextItem="focusNextItem"
      @focusPreviousItem="focusPreviousItem"
      @selectItem="selectItem"
      :isLoading="props.isLoading"
    )
    .row(v-if="addTagIsVisible")
      button.small-button(tabindex="0" @click.stop="addTag" @touchend.stop="addTag" @keyup.enter="addTag")
        img.icon(src="@/assets/add.svg")
        span New Tag

    ul.results-list
      template(v-for="tag in tagsFiltered" :key="tag.id")
        li(
          :data-tag-id="tag.id"
          tabindex="0"
          @click.left.stop="selectTag($event, tag)"
          @touchend.stop="selectTag($event, tag)"
          v-on:keyup.enter="selectTag($event, tag)"
          :class="{ active: tagIsActive(tag), hover: tagIsFocused(tag) }"
        )
          Tag(:tag="tag")
  p.info(v-if="!tags")
    span Type
    span {{' '}}
    span.badge.secondary [[
      span when editing a card to create tags
</template>

<style lang="stylus">
.tag-list
  .info
    margin 6px
  .badge
    pointer-events none
</style>
