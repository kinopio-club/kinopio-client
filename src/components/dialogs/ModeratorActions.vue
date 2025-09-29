<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useApiStore } from '@/stores/useApiStore'
import { useGlobalStore } from '@/stores/useGlobalStore'
import Loader from '@/components/Loader.vue'

import utils from '@/utils.js'

const globalStore = useGlobalStore()
const apiStore = useApiStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['updateCount'])

const props = defineProps({
  visible: Boolean
})
const state = reactive({
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

const moderatorIsLoadingRestartServer = computed(() => globalStore.moderatorIsLoadingRestartServer)
const restartServer = () => {
  if (globalStore.moderatorIsLoadingRestartServer) { return }
  globalStore.moderatorIsLoadingRestartServer = true
  // http://localhost:8086/ or https://helper.kinopio.club
}
</script>

<template lang="pug">
dialog.narrow.moderator-actions(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    p Moderator Actions
  section
    p All moderator actions are logged and will notify admins.
    .row
      button(@click="restartServer" :disabled="moderatorIsLoadingRestartServer")
        span Restart Server
        Loader(:visible="moderatorIsLoadingRestartServer" :isSmall="true")
    .row(v-if="moderatorIsLoadingRestartServer")
      .badge.info
        span Server is Restarting. Refresh and try again in ~5 minutes.
</template>

<style lang="stylus">
dialog.moderator-actions
  overflow auto
  left initial
  right 8px
</style>
