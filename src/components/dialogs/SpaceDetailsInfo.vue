<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import SpaceDetailsInfo from '@/components/SpaceDetailsInfo.vue'

const globalStore = useGlobalStore()

let unsubscribes

onMounted(() => {
  const globalStoreUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerSpaceDetailsInfoIsVisible') {
        globalStore.triggerFocusSpaceDetailsName()
      }
    }
  )
  unsubscribes = () => {
    globalStoreUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const props = defineProps({
  visible: Boolean
})

watch(() => props.visible, (value, prevValue) => {
  globalStore.clearNotificationsWithPosition()
})

const closeDialogs = () => {
  globalStore.triggerCloseChildDialogs()
}
</script>

<template lang="pug">
dialog.wide(v-if="props.visible" :open="props.visible" @click.left="closeDialogs" ref="dialog")
  section
    SpaceDetailsInfo(:shouldHidePin="true" @closeDialogs="closeDialogs")
</template>

<style lang="stylus">
// .component-name
</style>
