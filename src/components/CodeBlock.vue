<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import { highlight } from 'macrolight'

import codeLanguages from '@/data/codeLanguages.json'
import utils from '@/utils.js'

const store = useStore()

const defaultLanguageName = 'txt'

const props = defineProps({
  content: String,
  parentCardId: String
})

const parentCard = computed(() => store.getters['currentCards/byId'](props.parentCardId))
const isCheckboxCard = computed(() => utils.checkboxFromString(parentCard.value.name))

// syntax highlight

const shouldSyntaxHighlight = computed(() => currentLanguage.value.name !== defaultLanguageName)
const languageFromCodeBlock = computed(() => utils.languageFromCodeBlock(props.content))
const currentLanguage = computed(() => {
  let language = codeLanguages.find(codeLanguage => codeLanguage.name === parentCard.value.codeBlockLanguage)
  // priority: card.codeBlockLanguage → ```js → default
  language = language || languageFromCodeBlock.value?.language || codeLanguages[0]
  return language
})
const syntaxHighlightHTML = computed(() => {
  let content = props.content
  if (languageFromCodeBlock.value) {
    content = languageFromCodeBlock.value.newString
  }
  const keywords = currentLanguage.value.keywords
  const html = highlight(content, {
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
  let element = event.target.closest('.button-wrap')
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

// copy code

const copy = async (event) => {
  store.commit('clearNotificationsWithPosition')
  store.dispatch('closeAllDialogs')
  const position = utils.cursorPositionInPage(event)
  try {
    await navigator.clipboard.writeText(props.content)
    store.commit('addNotificationWithPosition', { message: 'Copied Code', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}
</script>

<template lang="pug">
.code-block(:class="{ narrow: isCheckboxCard }")
  .code-buttons
    .button-wrap(@click.stop="toggleCodeLanguagePicker" title="Code Language")
      button.small-button.inline-button(:class="{ active: languagePickerIsVisible }")
        span(v-if="currentLanguage.color")
          .badge.dot(:style="{ backgroundColor: currentLanguage.color }")
        span {{currentLanguage.name}}
    .button-wrap(@click.stop="copy" title="Copy Code")
      button.small-button.inline-button
        img.icon.copy(src="@/assets/copy.svg")

  template(v-if="shouldSyntaxHighlight")
    pre(v-html="syntaxHighlightHTML")
  template(v-else)
    pre {{props.content}}

</template>

<style lang="stylus">
.code-block
  position relative
  width calc(100% + 14px)
  &.narrow
    width calc(100% - 14px)
  .code-buttons
    position absolute
    right 0
    bottom -6px
    .button-wrap
      padding 8px
      padding-left 8px
      &:last-child
        padding-left 0
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
        span
          color var(--primary)
  pre
    width 100%
    max-height 300px
    overflow scroll !important
    white-space pre !important
    padding 4px
    padding-right 60px
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
    font-family var(--code-font)
    span
      font-size 12px
      font-family var(--code-font)
  .loader
    width 12px !important
    height 12px !important
  .badge.dot
    width 8px
    height 8px
    vertical-align 0
    padding 0
  .icon.copy
    width 10px

  // syntax highlighting
  .macrolight-comment
    color var(--code-comment)
  .macrolight-punctuation
    color var(--code-punctuation) !important
  .macrolight-string
    color var(--code-string)
  .macrolight-keyword
    font-weight bold
    color var(--code-keyword)
</style>
