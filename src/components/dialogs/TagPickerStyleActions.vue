<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import TagList from '@/components/TagList.vue'
import cache from '@/cache.js'
import utils from '@/utils.js'

import randomColor from 'randomcolor'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

const dialogElement = ref(null)
const resultsElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateHeights)
})

const props = defineProps({
  visible: Boolean,
  cards: Array,
  tagNamesInCard: Array
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateHeights()
    updateTags()
    updateResultsSectionHeight()
  }
})

const state = reactive({
  resultsSectionHeight: null,
  dialogHeight: null,
  tags: [],
  loading: false
})

const isThemeDark = computed(() => userStore.theme === 'dark')
const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const scrollIntoView = async () => {
  await nextTick()
  const element = dialogElement.value
  globalStore.scrollElementIntoView({ element })
}

// tags list

const currentTags = computed(() => {
  return props.tagNamesInCard || globalStore.getAllTags
})
const updateTags = async () => {
  const spaceTags = spaceStore.getSpaceTags
  state.tags = spaceTags || []
  const cachedTags = await cache.allTags()
  const mergedTags = utils.mergeArrays({ previous: spaceTags, updated: cachedTags, key: 'name' })
  state.tags = mergedTags
  await updateRemoteTags()
  updateHeights()
  scrollIntoView()
}
const updateRemoteTags = async () => {
  if (!currentUserIsSignedIn.value) { return }
  const remoteTagsIsFetched = globalStore.remoteTagsIsFetched
  let remoteTags
  if (remoteTagsIsFetched) {
    remoteTags = globalStore.remoteTags
  } else {
    state.loading = true
    remoteTags = await apiStore.getUserTags() || []
    globalStore.remoteTags = remoteTags
    globalStore.remoteTagsIsFetched = true
    state.loading = false
  }
  const mergedTags = utils.mergeArrays({ previous: state.tags, updated: remoteTags, key: 'name' })
  state.tags = mergedTags
}

// select tag

const newTagColor = () => {
  if (isThemeDark.value) {
    return randomColor({ luminosity: 'dark' })
  } else {
    return randomColor({ luminosity: 'light' })
  }
}
const selectTag = (tag) => {
  const tagString = `[[${tag.name}]]`
  const cardsWithTag = props.cards.filter(card => card.name.includes(tagString))
  const shouldRemove = props.cards.length === cardsWithTag.length
  removeFromCards(tagString)
  if (shouldRemove) { return }
  addToCards(tagString)
}
const removeFromCards = (tagString) => {
  props.cards.forEach(card => {
    const newName = card.name.replace(tagString, '').trim()
    if (newName === card.name) { return }
    const update = {
      id: card.id,
      name: newName
    }
    cardStore.updateCard(update)
  })
  updateCardDimensions()
}
const addToCards = (tagString) => {
  props.cards.forEach(card => {
    const newName = card.name + ' ' + tagString
    if (newName === card.name) { return }
    const update = {
      id: card.id,
      name: newName
    }
    cardStore.updateCard(update)
  })
  updateCardDimensions()
}
const updateCardDimensions = () => {
  const cards = utils.clone(props.cards)
  const cardIds = cards.map(card => card.id)
  cardStore.clearResizeCards(cardIds)
}
const addTag = (name) => {
  let tag = state.tags.find(item => item.name === name)
  const color = newTagColor()
  tag = { name, color }
  spaceStore.addTag(tag)
  state.tags.unshift(tag)
  selectTag(tag)
}

// update dialog height

const updateHeights = async () => {
  await nextTick()
  updateDialogHeight()
  updateResultsSectionHeight()
}
const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const updateResultsSectionHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = resultsElement.value
  state.resultsSectionHeight = utils.elementHeight(element, true)
}

</script>

<template lang="pug">
dialog.narrow.tag-picker-style-actions(v-if="visible" :open="visible" ref="dialogElement" @click.stop :style="{'max-height': state.dialogHeight + 'px'}")
  section.results-section(v-if="state.tags.length" ref="resultsElement" :style="{'max-height': state.resultsSectionHeight + 'px'}")
    TagList(:tags="state.tags" :isLoading="state.loading" :canAddTag="true" :shouldEmitSelectTag="true" :currentTags="currentTags" @selectTag="selectTag" @addTag="addTag")
</template>

<style lang="stylus">
dialog.tag-picker-style-actions
  min-height 200px
  overflow auto
  .results-section
    min-height 200px
</style>
