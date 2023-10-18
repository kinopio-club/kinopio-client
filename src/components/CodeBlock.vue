<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import { highlight } from 'macrolight'

import codeLanguages from '@/data/codeLanguages.json'
const store = useStore()

const defaultLanguageName = 'txt'

onMounted(() => {
  emit('updateCardDimensions')
})
const props = defineProps({
  content: String,
  parentCardId: String
})
const emit = defineEmits(['updateCardDimensions'])

// syntax highlight

const shouldSyntaxHighlight = computed(() => currentLanguage.value.name !== defaultLanguageName)
const currentLanguage = computed(() => {
  const card = store.getters['currentCards/byId'](props.parentCardId)
  const name = card.codeBlockLanguage || defaultLanguageName
  let codeLanguage = codeLanguages.find(language => language.name === name)
  codeLanguage = codeLanguage || codeLanguages[0]
  return codeLanguage
})
const syntaxHighlightHTML = computed(() => {
  const keywords = currentLanguage.value.keywords
  const html = highlight(props.content, {
    styles: {
      comment: '',
      punctuation: '',
      string: '',
      keyword: ''
    },
    keywords
  })
  return html
})

// language picker

const languagePickerIsVisible = computed(() => {
  const isVisible = store.state.codeLanguagePickerIsVisible
  const isCard = store.state.codeLanguagePickerCardId === props.parentCardId
  return isVisible && isCard
})
const toggleCodeLanguagePicker = async (event) => {
  const value = !store.state.codeLanguagePickerIsVisible
  let element = event.target.closest('.language-button')
  if (element) {
    element = element.querySelector('button')
  } else {
    element = event.target.closest('button')
  }
  const rect = element.getBoundingClientRect()
  const position = {
    x: window.scrollX + rect.x + 2,
    y: window.scrollY + rect.y + rect.height - 2,
    pageX: window.scrollX,
    pageY: window.scrollY
  }
  store.dispatch('closeAllDialogs')
  store.commit('currentUserIsDraggingCard', false)
  await nextTick()
  store.commit('codeLanguagePickerIsVisible', value)
  store.commit('codeLanguagePickerPosition', position)
  store.commit('codeLanguagePickerCardId', props.parentCardId)
}

</script>

<template lang="pug">
.code-block
  .language-button.button-wrap(@click.stop="toggleCodeLanguagePicker")
    button.small-button.inline-button(:class="{ active: languagePickerIsVisible }")
      span(v-if="currentLanguage.color")
        .badge.dot(:style="{ backgroundColor: currentLanguage.color }")
      span {{currentLanguage.name}}
  template(v-if="shouldSyntaxHighlight")
    pre(v-html="syntaxHighlightHTML")
  template(v-else)
    pre {{props.content}}

</template>

<style lang="stylus">
.code-block
  position relative
  .button-wrap
    position absolute
    right 0
    bottom -6px
    padding 8px
    &:hover
      button
        box-shadow var(--button-hover-shadow)
        background-color var(--secondary-hover-background)
    &:active
      button
        box-shadow var(--button-active-inset-shadow)
        background-color var(--secondary-active-background)
    button
      margin-right -6px
      margin-bottom -6px
      width initial
      cursor pointer
      &.active
        box-shadow var(--button-active-inset-shadow)
        background-color var(--secondary-active-background)

  pre
    overflow scroll !important
    white-space pre !important
    padding 4px
    padding-right 4rem
    color var(--primary)
    background-color var(--secondary-active-background)
    font-weight normal
    background-color var(--secondary-active-background)
    border-radius var(--small-entity-radius)
    margin 0
    white-space pre-wrap
    vertical-align 0
    word-wrap none
    font-size 12px
    font-family var(--mono-font)
    span
      font-size 12px
      font-family var(--mono-font)
  .loader
    width 12px !important
    height 12px !important
  .badge.dot
    width 8px
    height 8px
    vertical-align 0
    padding 0

  // syntax highlighting
  .macrolight-comment
    color var(--code-comment)
  .macrolight-punctuation
    color var(--code-punctuation)
  .macrolight-string
    color var(--code-string)
  .macrolight-keyword
    font-weight bold
    color var(--code-keyword)
</style>
