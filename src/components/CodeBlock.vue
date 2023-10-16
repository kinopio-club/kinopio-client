<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

console.log('🌺🌺🌺codeblock run🌺🌺🌺🌺')
// import utils from '@/utils.js'

onMounted(() => {
  console.log(`🍆 codeblock component is now mounted.`, store.state.currentSpace)
  emit('updateCardDimensions')
})

const props = defineProps({
  content: String
})
const emit = defineEmits(['updateCardDimensions'])

const languages = []

const toggleLanguagePicker = () => {
  store.dispatch('closeAllDialogs')
  store.commit('currentUserIsDraggingCard', false)
}

</script>

<template lang="pug">
.code-block
  .language-button
    button.small-button.inline-button(@click.stop="toggleLanguagePicker")
      span Auto
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
</style>
