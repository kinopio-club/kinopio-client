<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'

const store = useStore()

onMounted(() => {
  console.log(`🍆 codeblock component is now mounted.`, props.parentCardId)
  emit('updateCardDimensions')
  // TODO syntaxHighlight()
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerCloseChildDialogs') {
      closeDialogs()
    }
  })
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
  const language = card.codeBlockLanguage || 'auto'
  return language
})

const updateLanguage = (newLanguage) => {
  if (newLanguage === language.value) { return }
  console.log('🌺 updateCardCodeBlockLanguage', newLanguage, language.value, props.parentCardId)
  // dispatch currentcards.update
  // TODO syntaxHighlight()  , if !preventSyntaxHighlight param
}

// code language picker dialog

const toggleCodeLanguagePicker = () => {
  store.dispatch('closeAllDialogs')
  store.commit('currentUserIsDraggingCard', false)
  const value = !state.languagePickerIsVisible
  store.commit('triggerCloseChildDialogs')
  state.languagePickerIsVisible = value
  // TODO CodeLanguagePicker: pass props.parentCardId, updates card.codeBlockLanguage
}

const closeDialogs = () => {
  state.languagePickerIsVisible = false
}
</script>

<template lang="pug">
.code-block
  .language-button(@click.stop="toggleCodeLanguagePicker")
    button.small-button.inline-button
      span {{language}}
      Loader(:visible="state.isLoadingSyntaxHighlight" :isStatic="true" :isSmall="true")
    //- TODO CodeLanguagePicker pass props.parentCardId, @updateLanguage="updateLanguage"

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
  .language-button
    position absolute
    right 0
    top 0
    padding-right 2px
    padding-top 2px
    button
      width initial
      cursor pointer
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
