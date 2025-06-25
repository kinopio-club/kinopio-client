<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

// import utils from '@/utils.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

let unsubscribes

onMounted(() => {
  console.info('🐴 the component is now mounted.', spaceStore.getSpaceAllState)

  const globalStateUnsubscribe = globalStore.$subscribe(
    (mutation, state) => {
      const name = mutation.events?.key
      const value = mutation.events?.newValue
      if (name === 'spaceZoomPercent') {
        console.log('spaceZoomPercent')
      }
    }
  )
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'clearDraggingItems') {
        console.log('clearDraggingItems')
      }
    }
  )
  unsubscribes = () => {
    globalStateUnsubscribe()
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

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

const themeName = computed(() => userStore.theme)
const incrementBy = () => {
  const theme = themeName.value
  console.info('🧢', theme)
  state.count = state.count + 1
  emit('updateCount', state.count)
  // themeStore.updateThemeIsSystem(false)
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
