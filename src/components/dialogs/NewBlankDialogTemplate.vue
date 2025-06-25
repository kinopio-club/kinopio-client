<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

let unsubscribes

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)

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
  window.removeEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['updateCount'])

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  count: 0,
  dialogHeight: null
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const themeName = computed(() => userStore.theme)
const incrementBy = () => {
  state.count = state.count + 1
  emit('updateCount', state.count)
  // themeStore.updateThemeIsSystem(false)
}
</script>

<template lang="pug">
dialog.narrow.dialog-name(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    p blank dialog, please duplicate
  section
    button(@click="incrementBy")
      span Count is: {{ state.count }}
    p Current theme is: {{ themeName }}
</template>

<style lang="stylus">
// dialog.dialog-name
</style>
