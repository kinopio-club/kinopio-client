<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

// import utils from '@/utils.js'

// onMounted(() => {
//   // console.log(`🐴 the component is now mounted.`, store.state.currentSpace)
//   // store.subscribe((mutation, state) => {
//   //   if (mutation.type === 'triggerUpdateOtherCard') {
//   //     mutation.payload
//   //   }
//   // })
// })

// const emit = defineEmits(['updateCount'])

const props = defineProps({
  visible: Boolean
})
// const state = reactive({
//   count: 0
// })

// watch(() => props.visible, (value, prevValue) => {
//   if (value) {
//     console.log('💁‍♀️', value)
//   }
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
.cards-settings(v-if="visible")
  section
    p asldkjf
  //- button(@click="incrementBy")
  //-   span Count is: {{ state.count }}
  //- p Current theme is: {{ themeName }}, prop is {{ visible }}
</template>

<style lang="stylus">
.cards-settings
  overflow auto
  section
    border-top 1px solid var(--primary-border)
    border-radius 0 !important

</style>
