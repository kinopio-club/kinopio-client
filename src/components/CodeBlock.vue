<script setup>
import { reactive, computed, onMounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import { highlight } from 'macrolight'

import codeLanguages from '@/data/codeLanguages.json'
import utils from '@/utils.js'
import latex from '@/libs/latex.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const defaultLanguageName = 'txt'
const latexLanguageName = 'latex'

const props = defineProps({
  content: String,
  parentCardId: String
})

const state = reactive({
  latexHTML: ''
})

onMounted(() => {
  updateLatexHTML()
})

const parentCard = computed(() => cardStore.getCard(props.parentCardId))
const canEditCard = computed(() => userStore.getUserCanEditCard({ id: props.parentCardId }))

// syntax highlight

const shouldSyntaxHighlight = computed(() => {
  const name = currentLanguage.value.name
  return name !== defaultLanguageName && name !== latexLanguageName
})
const languageFromCodeBlock = computed(() => utils.languageFromCodeBlock(props.content))
const currentLanguage = computed(() => {
  let language = codeLanguages.find(codeLanguage => codeLanguage.name === parentCard.value.codeBlockLanguage)
  // priority: card.codeBlockLanguage → ```js → default
  language = language || languageFromCodeBlock.value?.language || codeLanguages[0]
  return language
})
const contentWithoutLanguage = computed(() => {
  if (languageFromCodeBlock.value) {
    return languageFromCodeBlock.value.newString
  }
  return props.content
})
const syntaxHighlightHTML = computed(() => {
  const content = contentWithoutLanguage.value
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

// latex

const isLatex = computed(() => currentLanguage.value.name === latexLanguageName)
const latexIsVisible = computed(() => isLatex.value && Boolean(state.latexHTML))
const updateLatexHTML = async () => {
  if (!isLatex.value) {
    state.latexHTML = ''
    return
  }
  try {
    state.latexHTML = await latex.renderToString(contentWithoutLanguage.value)
  } catch (error) {
    console.error('🚒 updateLatexHTML', error)
    state.latexHTML = ''
  }
  await nextTick()
  cardStore.updateCardDimensions(props.parentCardId)
}
watch([isLatex, contentWithoutLanguage], () => {
  updateLatexHTML()
})

// language picker

const languagePickerIsVisible = computed(() => {
  const isVisible = globalStore.codeLanguagePickerIsVisible
  const isCard = globalStore.codeLanguagePickerCardId === props.parentCardId
  return isVisible && isCard
})
const toggleCodeLanguagePicker = async (event) => {
  const value = !globalStore.codeLanguagePickerIsVisible
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
  globalStore.closeAllDialogs()
  globalStore.currentUserIsDraggingCard = false
  await nextTick()
  globalStore.codeLanguagePickerIsVisible = value
  globalStore.codeLanguagePickerPosition = position
  globalStore.codeLanguagePickerCardId = props.parentCardId
}

// copy code

const copy = async (event) => {
  globalStore.clearNotificationsWithPosition()
  globalStore.closeAllDialogs()
  const position = utils.cursorPositionInPage(event)
  try {
    await navigator.clipboard.writeText(props.content)
    globalStore.addNotificationWithPosition({ message: 'Copied Code', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    globalStore.addNotificationWithPosition({ message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}
</script>

<template lang="pug">
.code-block
  .code-buttons(:data-x="canEditCard")
    .button-wrap(v-if="canEditCard" @click.stop="toggleCodeLanguagePicker" title="Code Language")
      button.small-button.inline-button(:class="{ active: languagePickerIsVisible }")
        span(v-if="currentLanguage.color")
          .badge.dot(:style="{ backgroundColor: currentLanguage.color }")
        span {{currentLanguage.name}}
    .button-wrap(@click.stop="copy" title="Copy Code")
      button.small-button.inline-button
        img.icon.copy(src="@/assets/copy.svg")

  template(v-if="latexIsVisible")
    .latex(v-html="state.latexHTML")
  template(v-else-if="shouldSyntaxHighlight")
    pre(v-html="syntaxHighlightHTML")
  template(v-else)
    pre {{props.content}}

</template>

<style lang="stylus">
.code-block
  position relative
  width calc(100% - 8px)
  .code-buttons
    position absolute
    right -13px
    bottom -6px
    width max-content
    .button-wrap
      padding 8px
      padding-left 8px
      padding-right 6px
      margin-left 0
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
        width initial
        cursor pointer
        &.active
          box-shadow var(--button-active-inset-shadow)
          background-color var(--secondary-active-background)
        span
          color var(--primary)
  pre
    width calc(100% + 20px)
    max-height 300px
    overflow-x auto
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
    font-family var(--mono-font)
    span
      font-size 12px
      font-family var(--mono-font)
  .latex
    width calc(100% + 20px)
    max-height 300px
    overflow auto
    padding 4px
    padding-bottom 20px
    color var(--primary)
    background-color var(--secondary-active-background)
    border-radius var(--small-entity-radius)
    // math
    //   font-size 16px
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
