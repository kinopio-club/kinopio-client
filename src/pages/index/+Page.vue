<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

// import { useGlobalStore } from '@/stores/useGlobalStore'
// import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
// import { useSpaceStore } from '@/stores/useSpaceStore'

// import utils from '@/utils.js'

// const globalStore = useGlobalStore()
// const cardStore = useCardStore()
const userStore = useUserStore()
// const spaceStore = useSpaceStore()

onMounted(() => {
  console.info('🐴 the component is now mounted.')
})

// const emit = defineEmits(['updateCount'])

// const props = defineProps({
//   visible: Boolean
// })
const state = reactive({
  count: 0
})

// watch(() => props.visible, (value, prevValue) => {
//   if (value) {
//     console.info('💁‍♀️', value)
//   }
// })
// watch(() => globalStore.spaceZoomPercent, (value, prevValue) => {

// const themeName = computed(() => userStore.theme)
const incrementBy = () => {
  state.count = state.count + 1
  console.log(userStore)
  // themeStore.updateThemeIsSystem(false)
}

</script>

<template lang="pug">
p hello world {{ state.count }}
button(@click="incrementBy")
  span Count is: {{ state.count }}
</template>

<style lang="stylus">
// .component-name
</style>
