<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import cache from '@/cache.js'
import ResultsFilter from '@/components/ResultsFilter.vue'

import fuzzy from '@/libs/fuzzy.js'

const store = useStore()

const dialogElement = ref(null)
const resultsListElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
  initEmojis()
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['selectedEmoji'])

const props = defineProps({
  visible: Boolean,
  currentEmoji: String
})
const state = reactive({
  dialogHeight: null,
  emojis: [], // { name: 'group', [emojis] }
  filteredEmojis: [], // ^
  filter: '',
  // focus
  currentFocusEmoji: '',
  currentCategoryIndex: null,
  currentEmojiIndex: null
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    clearFocus()
    initEmojis()
    updateDialogHeight()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

// emojis

const initEmojis = async () => {
  const cachedEmojis = await cache.emojis()
  if (cachedEmojis.length) {
    state.emojis = cachedEmojis
  } else {
    state.isLoadingEmojis = true
    await remoteEmojis()
  }
  updateFilteredEmojis()
  state.isLoadingEmojis = false
}
const remoteEmojis = async () => {
  try {
    const newEmojis = await store.dispatch('api/getEmojis')
    await cache.updateEmojis({
      emojis: newEmojis.emojis,
      version: newEmojis.version
    })
    state.emojis = newEmojis.emojis
  } catch (error) {
    console.error('🚒')
  }
}
const categoryClassIndex = (index) => {
  return `index-${index}`
}
const selectItem = (emoji) => {
  emoji = emoji || state.currentFocusEmoji
  emit('selectedEmoji', emoji)
  updateCurrentFocus(emoji)
}
const isCurrentEmoji = (emoji) => {
  return emoji === props.currentEmoji
}
const isCurrentFocus = (emoji) => {
  return emoji === state.currentFocusEmoji
}

// results filter

const updateFilter = (newValue) => {
  state.filter = newValue.toLowerCase()
}
const updateFilteredEmojis = () => {
  if (!state.filter) {
    state.filteredEmojis = state.emojis
  } else {
    // fuzzy
    let emojis = utils.clone(state.emojis)
    emojis = emojis.map(category => {
      let filteredCategoryEmojis = fuzzy.filter(
        state.filter,
        category.emojis,
        {
          extract: (emoji) => {
            return emoji.name
          }
        }
      )
      filteredCategoryEmojis = filteredCategoryEmojis.map(item => item.original)
      category.emojis = filteredCategoryEmojis
      return category
    })
    // remove empty
    emojis = emojis.filter(category => category.emojis.length)
    // update
    state.filteredEmojis = emojis
  }
}
watch(() => state.filter, (value, prevValue) => {
  updateFilteredEmojis()
  clearFocus()
})

// focus

const clearFocus = () => {
  state.currentFocusEmoji = ''
  state.currentCategoryIndex = null
  state.currentEmojiIndex = null
}
const focusItem = (categoryIndex, emojiIndex) => {
  const emoji = findEmojiByIndex(categoryIndex, emojiIndex)
  if (!emoji) { return }
  state.currentFocusEmoji = emoji
  state.currentCategoryIndex = parseInt(categoryIndex)
  state.currentEmojiIndex = parseInt(emojiIndex)
  return emoji
}
const focusNextItem = () => {
  let emoji
  if (!state.currentFocusEmoji) {
    emoji = focusItem(0, 0)
  } else {
    // next emoji
    emoji = focusItem(state.currentCategoryIndex, state.currentEmojiIndex + 1)
    // or next category
    if (!emoji) {
      emoji = focusItem(state.currentCategoryIndex + 1, 0)
    }
    // first emoji
    if (!emoji) {
      emoji = focusItem(0, 0)
    }
  }
}
const focusPreviousItem = () => {
  let emoji
  if (!state.currentFocusEmoji) {
    emoji = focusItem(0, 0)
  } else {
    // prev emoji
    emoji = focusItem(state.currentCategoryIndex, state.currentEmojiIndex - 1)
    // or prev category
    if (!emoji) {
      emoji = focusItem(state.currentCategoryIndex - 1, 0)
    }
    // first emoji
    if (!emoji) {
      emoji = focusItem(0, 0)
    }
  }
}
const selectItemFromFilter = () => {
  if (!state.currentFocusEmoji) {
    focusItem(0, 0)
  }
  selectItem(state.currentFocusEmoji)
}

const updateCurrentFocus = (emoji) => {
  const { categoryIndex, emojiIndex } = findIndexByEmoji(emoji)
  state.currentFocusEmoji = emoji
  state.currentCategoryIndex = parseInt(categoryIndex)
  state.currentEmojiIndex = parseInt(emojiIndex)
}
// index

const findEmojiByIndex = (categoryIndex, emojiIndex) => {
  const element = resultsListElement.value
  const emojiElement = element.querySelector(`[data-category-index="${categoryIndex}"][data-emoji-index="${emojiIndex}"]`)
  return emojiElement?.innerText
}
const findIndexByEmoji = (emoji) => {
  const element = resultsListElement.value
  const emojiElement = element.querySelector(`[data-emoji="${emoji}"]`)
  const data = emojiElement.dataset
  return { emoji, categoryIndex: data.categoryIndex, emojiIndex: data.emojiIndex }
}
</script>

<template lang="pug">
dialog.narrow.emoji-picker(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'height': state.dialogHeight + 'px'}")
  ResultsFilter(
    :items="state.emojis"
    @updateFilter="updateFilter"
    @focusNextItem="focusNextItem"
    @focusPreviousItem="focusPreviousItem"
    @selectItem="selectItemFromFilter"
    :showFilter="true"
    :isLoading="state.isLoadingEmojis"
  )
  ul.results-list(ref="resultsListElement")
    template(v-for="(category, categoryIndex) in state.filteredEmojis")
      .badge.secondary.category(:class="categoryClassIndex(categoryIndex)")
        span {{ category.name }}
      .row
        template(v-for="(emoji, emojiIndex) in category.emojis")
          span.emoji(
            :data-emoji="emoji.emoji"
            :data-category-index="categoryIndex"
            :data-emoji-index="emojiIndex"
            @click="selectItem(emoji.emoji)"
            :class="{active: isCurrentEmoji(emoji.emoji), hover: isCurrentFocus(emoji.emoji)}"
            :title="emoji.name"
          ) {{emoji.emoji}}
</template>

<style lang="stylus">
dialog.emoji-picker
  overflow auto
  max-height 350px
  .input
    margin-bottom 0
  ul.results-list
    padding-left 8px
    padding-right 8px
  .category
    margin-top 10px
    width fit-content
    &.category-0
      margin-top 0
  .row
    max-width 100%
    flex-wrap wrap
    .emoji
      padding 3px
      font-size 20px
      cursor pointer
      border-radius var(--entity-radius)
      &:hover,
      &.hover
        background-color var(--secondary-hover-background)
      &:active,
      &.active
        background-color var(--secondary-active-background)
        box-shadow var(--button-active-inset-shadow)
</style>
