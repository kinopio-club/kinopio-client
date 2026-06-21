<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'

import dayjs from 'dayjs'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

let unsubscribes

// const dialogElement = ref(null)

// onMounted(() => {
//   window.addEventListener('resize', updateDialogHeight)

//   const globalActionUnsubscribe = globalStore.$onAction(
//     ({ name, args }) => {
//       if (name === 'clearDraggingItems') {
//         console.log('clearDraggingItems')
//       }
//     }
//   )
//   unsubscribes = () => {
//     globalActionUnsubscribe()
//   }
// })
// onBeforeUnmount(() => {
//   unsubscribes()
//   window.removeEventListener('resize', updateDialogHeight)
// })

const emit = defineEmits(['selectDate', 'clearDate'])

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  // count: 0,
  // dialogHeight: null
})

// watch(() => props.visible, (value, prevValue) => {
//   if (value) {
//     updateDialogHeight()
//   }
// })
// watch(() => globalStore.spaceZoomPercent, (value, prevValue) => {

// const updateDialogHeight = async () => {
//   if (!props.visible) { return }
//   await nextTick()
//   const element = dialogElement.value
//   state.dialogHeight = utils.elementHeight(element)
// }

// initialdateisToday

// cosnt year = dayjs().format('YYYY')
// const months = Array.from({ length: 12 }, (_, i) => {
//   const date = dayjs(`${year}-${i + 1}-01`);
//   return {
//     month: date.format('MMM'),
//     daysInMonth: date.daysInMonth(),
//     startsOn: date.format('ddd'),
//   };
// });
// Object { month: "Jan", daysInMonth: 31, startsOn: "Wed" }

</script>

<template lang="pug">
dialog.narrow.date-picker(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement")
  section.title-section
    .row.title-row
      p Jun 12, 2026 < t >
  //- span.badge.info.inline-badge.space-today-badge(v-if="isCreatedToday" title="Created Today")
  //-   img.icon.today(src="@/assets/today.svg")

  section.calendar
    .row
      p [] [] [] [] []
</template>

<style lang="stylus">
// dialog.date-picker
</style>
