<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import codeLanguages from '@/data/codeLanguages.json'

import { highlight } from 'macrolight'

const store = useStore()

onMounted(() => {
  emit('updateCardDimensions')
})

const props = defineProps({
  content: String,
  parentCardId: String
})
const emit = defineEmits(['updateCardDimensions'])

// syntax highlight

const currentLanguage = computed(() => {
  const card = store.getters['currentCards/byId'](props.parentCardId)
  const language = card.codeBlockLanguage || 'txt'
  return language
})
const syntaxHighlightHtml = computed(() => {
  const codeLangauage = codeLanguages.find(lang => lang.name === 'js')
  const keywords = codeLangauage.keywords
  const html = highlight(props.content, {
    styles: {
      comment: '',
      punctuation: '',
      string: '',
      keyword: ''
    },
    keywords
  })
  console.log('♥️', html)
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
// const shouldNotHighlight = computed(() => {
//   const card = store.getters['currentCards/byId'](props.parentCardId)
//   return !card.codeBlockLanguage || 'txt'
// })

</script>

<template lang="pug">
.code-block
  .language-button.button-wrap(@click.stop="toggleCodeLanguagePicker")
    button.small-button.inline-button(:class="{ active: languagePickerIsVisible }")
      //- TODO lang color badge
      span {{currentLanguage}}
  pre(v-html="syntaxHighlightHtml")
</template>

<style lang="stylus">
.code-block
  position relative
  .button-wrap
    position absolute
    right 0
    bottom -6px
    padding 8px
    // background-color pink
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
    padding-right 2rem
    color var(--primary)
    background-color var(--secondary-active-background)
    font-weight normal
    background-color var(--secondary-active-background)
    border-radius var(--small-entity-radius)
    margin 0
    white-space pre-wrap
    vertical-align 0
    word-wrap none
    span
      font-family var(--mono-font)
      font-size 12px
  .loader
    width 12px !important
    height 12px !important

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
