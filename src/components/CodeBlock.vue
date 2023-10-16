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

// watch(() => props.visible, (value, prevValue) => {
//   if (value) {
//     console.log('💁‍♀️', value)
//   }
// })

// const state = reactive({
//   count: 0
// })

// const themeName = computed(() => store.state.currentUser.theme)
// const incrementBy = () => {
//   const theme = themeName.value
//   console.log('🧢', theme)
//   state.count = state.count + 1
//   emit('updateCount', state.count)
//   // store.dispatch('themes/isSystem', false)
// }
</script>

<template lang="pug">
pre.code-block {{props.content}}
</template>

<style lang="stylus">
pre.code-block
  color var(--primary)
  background-color var(--secondary-active-background)
  font-weight normal
  background-color var(--secondary-active-background)
  border-radius var(--small-entity-radius)
  margin 0
  white-space pre-wrap
  vertical-align 0
</style>
