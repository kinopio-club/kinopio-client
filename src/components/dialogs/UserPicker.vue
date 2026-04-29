<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import cache from '@/cache.js'
import Tag from '@/components/Tag.vue'
import utils from '@/utils.js'

import fuzzy from '@/libs/fuzzy.js'
import last from 'lodash-es/last'
import randomColor from 'randomcolor'
import uniqBy from 'lodash-es/uniqBy'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

const dialogElement = ref(null)
const resultsElement = ref(null)
let unsubscribes

onMounted(() => {
  window.addEventListener('resize', updateHeights)

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerPickerNavigationKey') {
        if (!props.visible) { return }
        const key = args[0]
        triggerPickerNavigationKey(key)
      } else if (name === 'triggerPickerSelect') {
        if (!props.visible) { return }
        triggerPickerSelect()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateHeights)
  unsubscribes()
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
    scrollIntoView()
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

const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const closeDialog = () => {
  emit('closeDialog')
}
const scrollIntoView = async () => {
  await nextTick()
  const element = dialogElement.value
  globalStore.scrollElementIntoView({ element })
}

// tags list

const filteredTags = computed(() => {
  let tags = globalStore.getTags.filter(tag => {
    return tag.name !== props.search
  })
  const options = {
    pre: '',
    post: '',
    extract: (item) => {
      const name = item.name || ''
      return name
    }
  }
  const filtered = fuzzy.filter(props.search, tags, options)
  tags = filtered.map(item => item.original)
  return tags.slice(0, 5)
})

// search tags matching

const searchTagMatch = computed(() => {
  const tag = globalStore.getTags.find(tag => {
    return tag.name === props.search
  })
  if (tag) {
    return tag
  } else {
    return null
  }
})
const searchTagColor = computed(() => {
  const tag = searchTagMatch.value
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

// select tag

const color = () => {
  const isThemeDark = userStore.theme === 'dark'
  let newColor = randomColor({ luminosity: 'light' })
  if (isThemeDark) {
    newColor = randomColor({ luminosity: 'dark' })
  }
  return newColor
}
const tagBadgeLabel = () => {
  if (!searchTagMatch.value) {
    return 'New Tag'
  }
}
const clickTag = (event, tag) => {
  selectTag(tag, true)
}
const selectTag = (tag, shouldCloseDialog) => {
  tag = tag || searchTag.value
  emit('selectTag', tag)
  if (shouldCloseDialog) {
    closeDialog()
  }
}

// keyboard handling

const triggerPickerNavigationKey = (key) => {
  const searchTag = [{
    name: props.search,
    color: searchTagColor.value
  }]
  const tags = searchTag.concat(filteredTags.value)
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
  console.info('🎹 triggerPickerSelect', {
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
</template>

<style lang="stylus">
dialog.tag-picker
  min-height 200px
  overflow auto
  .info-section
    padding-bottom 4px
  .results-section
    min-height 200px
    overflow scroll
    &:first-child
      padding-top 4px
  .label-badge
    bottom -10px
    min-height 12px
    width max-content
    z-index 1
</style>
