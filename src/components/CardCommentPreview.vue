<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UserLabelInline from '@/components/UserLabelInline.vue'
const store = useStore()
// import utils from '@/utils.js'

onMounted(() => {
  console.log(`🐴 the component is now mounted.`, store.state.currentSpace)
  // store.subscribe((mutation, state) => {
  //   if (mutation.type === 'triggerUpdateOtherCard') {
  //     mutation.payload
  //   }
  // })
})

const emit = defineEmits(['updateCount'])

const props = defineProps({
  visible: Boolean,
  card: Object,
  user: Object
})
const state = reactive({
  count: 0
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    console.log('💁‍♀️', value)
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
.card-comment-preview(v-if="visible")
  p akljsdfklsajdf
  //- UserLabelInline(:user="user")
  //- p {{ card.name }}
</template>

<style lang="stylus">
.card-comment-preview
  position absolute
  width 100px
  background teal
  // z-index --var(max-z)

</style>