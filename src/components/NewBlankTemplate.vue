<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useCardStore } from '@/stores/useCardStore'

// import utils from '@/utils.js'

const cardStore = useCardStore()
const store = useStore()

// let unsubscribe

onMounted(() => {
  console.info('🐴 the component is now mounted.', store.state.currentSpace)
  // unsubscribe = store.subscribe(mutation => {
  //   if (mutation.type === 'triggerUpdateOtherCard') {
  //     mutation.payload
  //   }
  // })
})
// onBeforeUnmount(() => {
//   unsubscribe()
// })

const emit = defineEmits(['updateCount'])

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  count: 0
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    console.info('💁‍♀️', value)
  }
})

const themeName = computed(() => store.state.currentUser.theme)
const incrementBy = () => {
  const theme = themeName.value
  console.info('🧢', theme)
  state.count = state.count + 1
  emit('updateCount', state.count)
  // store.dispatch('themes/isSystem', false)
}
</script>

<template lang="pug">
.component-name(v-if="props.visible")
  button(@click="incrementBy")
    span Count is: {{ state.count }}
  p Current theme is: {{ themeName }}, prop is {{ props.visible }}
</template>

<style lang="stylus">
// .component-name
</style>
