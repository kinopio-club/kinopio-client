<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import ResultsFilter from '@/components/ResultsFilter.vue'
import codeLanguages from '@/data/codeLanguages.json'
import utils from '@/utils.js'

const store = useStore()

const dialog = ref(null)
const placeholder = 'Search Languages'

onMounted(() => {
  updateDialogHeight()
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
})

const state = reactive({
  dialogHeight: null,
  filteredCodeLanguages: codeLanguages,
  focusOnId: null
})
const visible = computed(() => store.state.codeLanguagePickerIsVisible)
watch(() => visible.value, (value, prevValue) => {
  if (value) { scrollIntoView() }
})
const position = computed(() => store.state.codeLanguagePickerPosition)
const cardId = computed(() => store.state.codeLanguagePickerCardId)

// languages

const languageIsActive = (language) => {
  const card = store.getters['currentCards/byId'](cardId.value)
  const cardLanguage = card.codeBlockLanguage || 'txt'
  return language.name === cardLanguage
}
const languageIsFocused = (language) => {
  return state.focusOnId === language.id
}
const selectLanguage = (language) => {
  if (!language) { return }
  store.dispatch('currentCards/update', {
    id: cardId.value,
    codeBlockLanguage: language.name
  })
  store.dispatch('closeAllDialogs')
}

// results list input

const clearFilter = () => {
  state.focusOnId = null
  state.filteredCodeLanguages = codeLanguages
}
const onBlur = () => {
  state.focusOnId = null
}
const onFocus = () => {
  state.focusOnId = state.filteredCodeLanguages[0].id
}
const updateFilter = async (filter) => {
  if (!filter) {
    state.focusOnId = codeLanguages[0].id
  }
  updateDialogHeight()
}
const updateFilteredItems = (items) => {
  state.filteredCodeLanguages = items
  if (items.length) {
    state.focusOnId = state.filteredCodeLanguages[0].id
  }
  updateDialogHeight()
}
const focusNextItem = () => {
  const currentIndex = state.filteredCodeLanguages.findIndex(language => language.id === state.focusOnId) || 0
  const language = state.filteredCodeLanguages[currentIndex + 1]
  if (!language) { return }
  state.focusOnId = language.id
}
const focusPreviousItem = () => {
  const currentIndex = state.filteredCodeLanguages.findIndex(language => language.id === state.focusOnId) || 0
  const language = state.filteredCodeLanguages[currentIndex - 1]
  if (!language) { return }
  state.focusOnId = language.id
}
const selectItemFromFilter = () => {
  const language = state.filteredCodeLanguages.find(language => language.id === state.focusOnId)
  selectLanguage(language)
}
const languageColorStyle = (language) => {
  return {
    backgroundColor: language.color || 'transparent'
  }
}

// dialog

const styles = computed(() => {
  // adapted from card details
  let zoom = store.getters.spaceCounterZoomDecimal
  if (utils.isAndroid()) {
    zoom = utils.visualViewport().scale
  } else if (store.state.isTouchDevice) {
    zoom = 1
  }
  const transform = `scale(${zoom})`
  const left = `${position.value.x}px`
  const top = `${position.value.y}px`
  const maxHeight = `${state.dialogHeight}px`
  return { transform, left, top, maxHeight }
})
const updateDialogHeight = async () => {
  await nextTick()
  await nextTick()
  const element = dialog.value
  if (!element) { return }
  state.dialogHeight = utils.elementHeight(element)
}
const scrollIntoView = async () => {
  // wait for element to be rendered before getting position
  await nextTick()
  await nextTick()
  await nextTick()
  await nextTick()
  const element = dialog.value
  store.commit('scrollElementIntoView', { element })
}
</script>

<template lang="pug">
dialog.narrow.code-language-picker(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="styles" :data-card-id="cardId")
  ResultsFilter(
    :items="codeLanguages"
    :placeholder="placeholder"
    @updateFilter="updateFilter"
    @updateFilteredItems="updateFilteredItems"
    @focusNextItem="focusNextItem"
    @focusPreviousItem="focusPreviousItem"
    @selectItem="selectItemFromFilter"
    @onFocus="onFocus"
    @onBlur="onBlur"
    @clearFilter="clearFilter"
  )
  ul.results-list(ref="resultsList")
    template(v-for="(language, index) in state.filteredCodeLanguages" :key="language.id")
      li(@click="selectLanguage(language)" :class="{active: languageIsActive(language), hover: languageIsFocused(language)}")
        .badge.dot(:style="languageColorStyle(language)")
        span {{language.name}}
</template>

<style lang="stylus">
dialog.code-language-picker
  width 200px
  min-height 150px
  padding 4px
  position absolute
  top 0
  left 8px
  overflow auto
  li
    align-items center !important
</style>
