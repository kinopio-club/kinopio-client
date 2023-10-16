<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'

const store = useStore()

// console.log('🌺🌺🌺codeblock run🌺🌺🌺🌺')
// import utils from '@/utils.js'

onMounted(() => {
  console.log(`🍆 codeblock component is now mounted.`, props.parentCardId)
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
  contentSyntaxHighlight: ''
})

const language = computed(() => {
  const card = store.getters['currentCard/byId'](props.parentCardId)
  return card.codeBlockLanguage || 'Auto'
})

const syntaxHighlight = () => {
  state.isLoadingSyntaxHighlight = true
  try {
    // TODO call api util w props.content , no auth works on anon
    // assign state.contentSyntaxHighlight
  } catch (error) {
    console.error('🚑 syntaxHighlight', props.parentCardId, error)
  }
  state.isLoadingSyntaxHighlight = false
}

const toggleCodeLanguagePicker = () => {
  store.dispatch('closeAllDialogs')
  store.commit('currentUserIsDraggingCard', false)
  // TODO CodeLanguagePicker: pass props.parentCardId, updates card.codeBlockLanguage
  // const languages = []
}

</script>

<template lang="pug">
.code-block
  .language-button
    button.small-button.inline-button(@click.stop="toggleCodeLanguagePicker")
      span Auto
      Loader(:visible="state.isLoadingSyntaxHighlight" :isStatic="true" :isSmall="true")
  //- code
  template(v-if="state.isLoadingSyntaxHighlight")
    pre {{props.content}}
  template(v-else-if="state.contentSyntaxHighlight")
    //- render unescaped, maybe not in <pre>
    pre {{state.contentSyntaxHighlight}}
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
