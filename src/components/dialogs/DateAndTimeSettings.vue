<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

// import { useGlobalStore } from '@/stores/useGlobalStore'
// import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
// import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'
import timezones from '@/data/timezones.json'

import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
dayjs.extend(timezone)

// const globalStore = useGlobalStore()
// const cardStore = useCardStore()
const userStore = useUserStore()
// const spaceStore = useSpaceStore()

let unsubscribes

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
  console.log('🫐🫐🫐🫐🫐🫐', timezones)
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

</script>

<template lang="pug">
dialog.narrow.timezone-picker(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
    p Date and Time Settings
  section
    p New Date Format
    .segmented-buttons
      button.active Aug 20, 2026
      button 2 days left
  section
    p Timezone
    //- results list
    //- list use default + timezones
</template>

<style lang="stylus">
// dialog.timezone-picker
</style>
