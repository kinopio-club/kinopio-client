<script setup>
// import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch } from 'vue'
// https://vuex.vuejs.org/guide/composition-api.html#accessing-state-and-getters
import { useStore } from 'vuex'
const store = useStore()

onMounted(() => {
  console.log(`the dialog is now mounted.`, store.state.currentSpace)
})

const props = defineProps({
  visible: Boolean
})
const emit = defineEmits(['updateCount'])

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    console.log('💁‍♀️', value)
  }
})

const state = reactive({
  count: 0
})

const themeName = computed(() => store.state.currentUser.theme)
const incrementBy = () => {
  state.count = state.count + 1
  emit('updateCount', state.count)
  // store.dispatch('themes/isSystem', false)
}
</script>

<template lang="pug">
dialog.narrow.dialog-name(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p blank dialog, please duplicate
  section
    button(@click="incrementBy")
      span Count is: {{ state.count }}
    p Current theme is: {{ themeName }}
</template>

<style lang="stylus">
// .dialog-name
</style>
