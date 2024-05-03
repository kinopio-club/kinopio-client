<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import cache from '@/cache.js'
import Loader from '@/components/Loader.vue'
import Tag from '@/components/Tag.vue'
import utils from '@/utils.js'

import fuzzy from '@/libs/fuzzy.js'
import last from 'lodash-es/last'
import randomColor from 'randomcolor'

const store = useStore()

const dialogElement = ref(null)
const resultsElement = ref(null)

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      updateHeights()
    } else if (mutation.type === 'triggerPickerNavigationKey') {
      if (!props.visible) { return }
      const key = mutation.payload
      triggerPickerNavigationKey(key)
    } else if (mutation.type === 'triggerPickerSelect') {
      if (!props.visible) { return }
      triggerPickerSelect()
    }
  })
})

const emit = defineEmits(['selectTag', 'closeDialog', 'currentTag', 'newTagColor'])

const props = defineProps({
  visible: Boolean,
  position: Object,
  search: String,
  cursorPosition: Number
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateHeights()
    state.randomColor = color()
    updateTags()
  }
})
watch(() => props.search, (value, prevValue) => {
  if (value) {
    state.focusOnName = value
    const currentTag = { name: value, color: searchTagColor.value }
    emit('currentTag', currentTag)
  }
})

const state = reactive({
  tags: [],
  loading: false,
  focusOnName: '',
  randomColor: '',
  dialogHeight: null,
  resultsSectionHeight: null
})
watch(() => state.randomColor, (value, prevValue) => {
  if (value) {
    emit('newTagColor', value)
  }
})

const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const filteredTags = computed(() => {
  let tags = state.tags.filter(tag => {
    return tag.name !== props.search
  })
  const options = {
    pre: '',
    post: '',
    extract: (item) => {
      let name = item.name || ''
      return name
    }
  }
  const filtered = fuzzy.filter(props.search, tags, options)
  tags = filtered.map(item => item.original)
  return tags.slice(0, 5)
})
const searchTagMatch = computed(() => {
  let tag = state.tags.find(tag => {
    return tag.name === props.search
  })
  if (tag) {
    return tag
  } else {
    return null
  }
})
const searchTagColor = computed(() => {
  let tag = searchTagMatch.value
  if (tag) {
    return tag.color
  } else {
    return state.randomColor
  }
})
const searchTag = computed(() => {
  return {
    name: props.search,
    color: searchTagColor.value
  }
})

const tagBadgeLabel = () => {
  if (!searchTagMatch.value) {
    return 'New Tag'
  }
}
const updateTags = async () => {
  const spaceTags = store.getters['currentSpace/spaceTags']
  state.tags = spaceTags || []
  const cachedTags = cache.allTags()
  const mergedTags = utils.mergeArrays({ previous: spaceTags, updated: cachedTags, key: 'name' })
  state.tags = mergedTags
  await updateRemoteTags()
  await nextTick()
  scrollIntoView()
}
const updateRemoteTags = async () => {
  if (!currentUserIsSignedIn.value) { return }
  const remoteTagsIsFetched = store.state.remoteTagsIsFetched
  let remoteTags
  if (remoteTagsIsFetched) {
    remoteTags = store.state.remoteTags
  } else {
    state.loading = true
    remoteTags = await store.dispatch('api/getUserTags') || []
    store.commit('remoteTags', remoteTags)
    store.commit('remoteTagsIsFetched', true)
    state.loading = false
  }
  const mergedTags = utils.mergeArrays({ previous: state.tags, updated: remoteTags, key: 'name' })
  state.tags = mergedTags
}
const clickTag = (event, tag) => {
  selectTag(tag, true)
}
const selectTag = (tag, shouldCloseDialog) => {
  // const searchTag = {
  //   name: props.search,
  //   color: searchTagColor.value
  // }
  tag = tag || searchTag.value
  emit('selectTag', tag)
  if (shouldCloseDialog) {
    closeDialog()
  }
}
const scrollIntoView = () => {
  let element = dialogElement.value
  utils.scrollIntoView({ element })
}

const triggerPickerNavigationKey = (key) => {
  const searchTag = [{
    name: props.search,
    color: searchTagColor.value
  }]
  let tags = searchTag.concat(filteredTags.value)
  const currentIndex = tags.findIndex(tag => tag.name === state.focusOnName)
  if (key === 'ArrowUp') {
    focusPreviousItem(tags, currentIndex)
  } else if (key === 'ArrowDown') {
    focusNextItem(tags, currentIndex)
  }
}

const triggerPickerSelect = () => {
  let tags = filteredTags.value
  if (props.search) {
    const searchTag = [{
      name: props.search,
      color: searchTagColor.value
    }]
    tags = searchTag.concat(filteredTags.value)
  }
  const currentIndex = tags.findIndex(tag => tag.name === state.focusOnName)
  const currentTag = tags[currentIndex]
  console.log('🎹 triggerPickerSelect', {
    search: props.search,
    focusOnName: state.focusOnName,
    currentTag,
    tags,
    currentIndex
  })
  selectTag(currentTag)
}

const focusPreviousItem = (tags, currentIndex) => {
  const firstItem = tags[0]
  const previousItem = tags[currentIndex - 1]
  if (previousItem) {
    state.focusOnName = previousItem.name
  } else {
    state.focusOnName = firstItem.name
  }
}
const focusNextItem = (tags, currentIndex) => {
  const lastItem = last(tags)
  const nextItem = tags[currentIndex + 1]
  if (nextItem) {
    state.focusOnName = nextItem.name
  } else {
    state.focusOnName = lastItem.name
  }
}
const closeDialog = () => {
  emit('closeDialog')
}
const color = () => {
  const isThemeDark = store.state.currentUser.theme === 'dark'
  let newColor = randomColor({ luminosity: 'light' })
  if (isThemeDark) {
    newColor = randomColor({ luminosity: 'dark' })
  }
  return newColor
}

// update height

const updateHeights = async () => {
  await nextTick()
  updateDialogHeight()
  updateResultsSectionHeight()
}
const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const updateResultsSectionHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = resultsElement.value
  state.resultsSectionHeight = utils.elementHeight(element, true)
}

</script>

<template lang="pug">
dialog.narrow.tag-picker(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{top: position.top + 'px', 'max-height': state.dialogHeight + 'px'}")
  section.info-section(v-if="!search")
    p
      img.icon.search(src="@/assets/search.svg")
      span Type to add or search tags
  section.results-section(ref="resultsElement" :style="{'max-height': state.resultsSectionHeight + 'px'}")
    ul.results-list
      li(v-if="search" @click="selectTag(null, true)" @touchend.stop :class="{hover: state.focusOnName === search}")
        Tag(:tag="searchTag" :tagBadgeLabel="tagBadgeLabel" @clickTag="clickTag")
      li(v-for="tag in filteredTags" @click="selectTag(tag, true)" @touchend.stop :class="{hover: state.focusOnName === tag.name}")
        Tag(:tag="tag" @clickTag="clickTag")
    Loader(:visible="state.loading")
</template>

<style lang="stylus">
dialog.tag-picker
  min-height 150px
  overflow auto
  .loader
    margin-left 6px
  .info-section
    padding-bottom 4px
  .results-section
    min-height 150px
    &:first-child
      padding-top 4px
  .label-badge
    bottom -10px
    min-height 12px
    width max-content
    z-index 1
</style>
