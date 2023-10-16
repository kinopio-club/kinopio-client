<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

// import utils from '@/utils.js'

onMounted(() => {
  console.log(`🍆 the component is now mounted.`, store.state.currentSpace)
  // store.subscribe((mutation, state) => {
  //   if (mutation.type === 'triggerUpdateOtherCard') {
  //     mutation.payload
  //   }
  // })
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
  const theme = themeName.value
  console.log('🧢', theme)
  state.count = state.count + 1
  emit('updateCount', state.count)
  // store.dispatch('themes/isSystem', false)
}
</script>

<template lang="pug">
.component-name(v-if="visible")
  button(@click="incrementBy")
    span Count is: {{ state.count }}
  p Current theme is: {{ themeName }}, prop is {{ visible }}
</template>

<style lang="stylus">
// .component-name
</style>
