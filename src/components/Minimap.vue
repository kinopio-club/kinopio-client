<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

// import utils from '@/utils.js'

const store = useStore()

// let unsubscribe

onMounted(() => {
  // update()
  console.log(`🐴 the component is now mounted.`, store.state.currentSpace)
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
  visible: Boolean,
  size: Number
})
const state = reactive({
  // count: 0
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    console.log('💁‍♀️', value)
    // update()
  }
})

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
p yoyo
//- .component-name(v-if="props.visible")
//-   button(@click="incrementBy")
//-     span Count is: {{ state.count }}
//-   p Current theme is: {{ themeName }}, prop is {{ props.visible }}
</template>

<style lang="stylus">
// .minimap
</style>
