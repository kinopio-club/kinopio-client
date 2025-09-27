<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useApiStore } from '@/stores/useApiStore'
import Loader from '@/components/Loader.vue'

import utils from '@/utils.js'

// const globalStore = useGlobalStore()
// const userStore = useUserStore()
// const spaceStore = useSpaceStore()

// const ApiStore = useCardStore()

// let unsubscribes

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)

  // const globalActionUnsubscribe = globalStore.$onAction(
  //   ({ name, args }) => {
  //     if (name === 'clearDraggingItems') {
  //       console.log('clearDraggingItems')
  //     }
  //   }
  // )
  // unsubscribes = () => {
  //   globalActionUnsubscribe()
  // }
})
onBeforeUnmount(() => {
  // unsubscribes()
  window.removeEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['updateCount'])

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  loading: {
    restartServer: false
  },
  dialogHeight: null
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})
// watch(() => globalStore.spaceZoomPercent, (value, prevValue) => {

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

// const themeName = computed(() => userStore.theme)
// const incrementBy = () => {
//   state.count = state.count + 1
//   emit('updateCount', state.count)
//   // themeStore.updateThemeIsSystem(false)
// }
const restartServer = () => {
  state.restartServer = true
  // apiStore.moderatorRestartServer
}
</script>

<template lang="pug">
dialog.narrow.moderator-actions(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    p Moderator Actions
  section
    .row
      button(@click="restartServer" :disabled="state.loading.restartServer")
        span Restart Server
        Loader(:visible="state.loading.restartServer" :isSmall="true")
    .row
      .badge.info
        span Server is Restarting. Should take ~5 minutes.
  section
    p All moderator actions are logged and will email Piri.
</template>

<style lang="stylus">
dialog.moderator-actions
  overflow auto
  left initial
  right 8px
</style>
