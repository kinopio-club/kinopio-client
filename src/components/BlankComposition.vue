<script setup>
// import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps } from 'vue'
// https://vuex.vuejs.org/guide/composition-api.html#accessing-state-and-getters
import { useStore } from 'vuex'
const store = useStore()

onMounted(() => {
  console.log(`the component is now mounted.`, store.state.currentSpace)
})

defineProps({
  visible: Boolean
})

const state = reactive({
  count: 0
})
const themeName = computed(() => store.state.currentUser.theme)
const incrementBy = () => {
  state.count = state.count + 1
  // store.dispatch('themes/isSystem', false)
}
</script>

<template lang="pug">
.component-name(v-if="visible")
  button(@click="incrementBy")
    span Count is: {{ state.count }}
  p Current theme is: {{ themeName }}
</template>

<style lang="stylus">
// .component-name
</style>
