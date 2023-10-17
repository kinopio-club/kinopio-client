<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

onMounted(() => {
  emit('updateCardDimensions')
  // TODO syntaxHighlight()
})
watch(() => props.content, (value, prevValue) => {
  if (value) {
    // TODO syntaxHighlight()
  }
})

const props = defineProps({
  content: String,
  parentCardId: String
})
const emit = defineEmits(['updateCardDimensions'])
const state = reactive({
  isLoadingSyntaxHighlight: true,
  contentSyntaxHighlightTree: null,
  languagePickerIsVisible: false
})

const syntaxHighlight = () => {
  if (language.value === 'txt') {
    state.contentSyntaxHighlightTree = null
    state.isLoadingSyntaxHighlight = false
    return
  }
  state.isLoadingSyntaxHighlight = true
  try {
    // TODO call api util w props.content and with card.codeBlockLanguage, no auth works on anon
    // assign state.contentSyntaxHighlightTree
    // assign card.codeBlockLanguage , if no lang detected then assign 'txt'
  } catch (error) {
    console.error('🚑 syntaxHighlight', props.parentCardId, error)
  }
  state.isLoadingSyntaxHighlight = false
}

// language

const language = computed(() => {
  const card = store.getters['currentCards/byId'](props.parentCardId)
  const language = card.codeBlockLanguage || 'txt'
  return language
})

const updateLanguage = (newLanguage) => {
  if (newLanguage === language.value) { return }
  console.log('🌺 updateCardCodeBlockLanguage', newLanguage, language.value, props.parentCardId)
  // dispatch currentcards.update { id: props.parentCardId, codeBlockLanguage: newLanguage }
  // TODO syntaxHighlight()  , if !preventSyntaxHighlight param
}

// code language picker dialog

const toggleCodeLanguagePicker = async (event) => {
  const value = !store.state.codeLanguagePickerIsVisible
  let element = event.target.closest('.language-button')
  if (element) {
    element = element.querySelector('button')
  } else {
    element = event.target.closest('button')
  }

  console.log('🚒🚒', event.target, element)

  const rect = element.getBoundingClientRect()
  const position = {
    x: window.scrollX + rect.x + 2,
    y: window.scrollY + rect.y + rect.height - 2,
    pageX: window.scrollX,
    pageY: window.scrollY
  }
  // console.log('🍔🍔🍔🍔',value, )
  store.dispatch('closeAllDialogs')
  store.commit('currentUserIsDraggingCard', false)
  await nextTick()
  store.commit('codeLanguagePickerIsVisible', value)
  store.commit('codeLanguagePickerPosition', position)
  store.commit('codeLanguagePickerCardId', props.parentCardId)

  // state.languagePickerIsVisible = value
}

const languagePickerIsVisible = computed(() => {
  const isVisible = store.state.codeLanguagePickerIsVisible
  const isCard = store.state.codeLanguagePickerCardId === props.parentCardId
  return isVisible && isCard
})
</script>

<template lang="pug">
.code-block
  .language-button(@click.stop="toggleCodeLanguagePicker")
    button.small-button.inline-button(:class="{ active: languagePickerIsVisible }")
      span {{language}}
      Loader(:visible="state.isLoadingSyntaxHighlight" :isStatic="true" :isSmall="true")
    CodeLanguagePicker(:visible="state.languagePickerIsVisible" :currentLanguage="language", @updateLanguage="updateLanguage")

  //- code
  template(v-if="state.isLoadingSyntaxHighlight")
    pre {{props.content}}
  template(v-else-if="state.contentSyntaxHighlightTree")
    //- render from contentSyntaxHighlightTree
    pre {{state.contentSyntaxHighlightTree}}
  template(v-else)
    pre {{props.content}}

</template>

<style lang="stylus">
.code-block
  position relative
  .button-wrap
    position absolute
    right 0
    top 0
    padding 6px
    &:hover
      button
        box-shadow var(--button-hover-shadow)
        background-color var(--secondary-hover-background)
    &:active
      button
        box-shadow var(--button-active-inset-shadow)
        background-color var(--secondary-active-background)
    button
      margin-right -4px
      margin-top -4px
      width initial
      cursor pointer
      &.active
        box-shadow var(--button-active-inset-shadow)
        background-color var(--secondary-active-background)

  pre
    color var(--primary)
    background-color var(--secondary-active-background)
    font-weight normal
    background-color var(--secondary-active-background)
    border-radius var(--small-entity-radius)
    margin 0
    white-space pre-wrap
    vertical-align 0
  .loader
    width 12px !important
    height 12px !important
</style>
