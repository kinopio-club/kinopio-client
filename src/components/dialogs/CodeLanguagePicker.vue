<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import ResultsFilter from '@/components/ResultsFilter.vue'
import codeLanguages from '@/data/codeLanguages.json'
import utils from '@/utils.js'

const store = useStore()

const dialog = ref(null)
const placeholder = 'Filter Languages'

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
  languages: codeLanguages
  // filteredLanguages: codeLanguages
})
const visible = computed(() => store.state.codeLanguagePickerIsVisible)
const position = computed(() => store.state.codeLanguagePickerPosition)
const cardId = computed(() => store.state.codeLanguagePickerCardId)

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
  let element = dialog.value
  if (!element) { return }
  state.dialogHeight = utils.elementHeight(element)
}

// results list

const updateFilter = (filter, isClearFilter) => {
  console.log('🚛', filter, isClearFilter)
  // if isclear => state.languages = codeLanguages
  // if (isClearFilter) {
  updateDialogHeight()
  // }
}

// const updateFilteredItems = (items) => {
//   // state.languages = items
//   updateDialogHeight()
// }

const focusNextItemFromFilter = () => {
  console.log('🍔🍔🍔')
}

const focusPreviousItemFromFilter = () => {
  console.log('☮️☮️☮️')
}

const selectItemFromFilter = () => {
  console.log('🍇🍇🍇')
}

const languageColorStyle = (language) => {
  return {
    backgroundColor: language.color || 'transparent'
  }
}

const languageIsActive = (language) => {
  const card = store.getters['currentCards/byId'](cardId.value)
  const cardLanguage = card.codeBlockLanguage || 'txt'
  return language.name === cardLanguage
}

</script>

<template lang="pug">
dialog.narrow.code-language-picker(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="styles" :data-card-id="cardId")
  ResultsFilter(
    :items="codeLanguages"
    :placeholder="placeholder"
    @updateFilter="updateFilter"
    @focusNextItem="focusNextItemFromFilter"
    @focusPreviousItem="focusPreviousItemFromFilter"
    @selectItem="selectItemFromFilter"
  )

  ul.results-list(ref="resultsList")
    template(v-for="(language, index) in state.languages")
      li(:class="{active: languageIsActive(language)}")
        .badge(:style="languageColorStyle(language)")
        span {{language.name}}

</template>

<style lang="stylus">
dialog.code-language-picker
  min-height 150px
  padding 4px
  position absolute
  top 0
  left 8px
  overflow auto
  li
    align-items center !important
  .badge
    min-width initial
    min-height initial
    width 12px
    height 12px
    border-radius 100px
</style>
