<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const textareaElement = ref(null)

// let unsubscribes

onMounted(() => {
//   loadFavoriteUsers()
//   const globalActionUnsubscribe = globalStore.$onAction(
//     ({ name, args }) => {
//       if (name === 'triggerCloseChildDialogs') {
//         closeDialogs()
//       }
//     }
//   )
//   unsubscribes = () => {
//     globalActionUnsubscribe()
//   }
  focusTextarea()
  textareaSizes()
})
// onBeforeUnmount(() => {
//   unsubscribes()
// })

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    focusTextarea()
    textareaSizes()
  }
})

watch(() => userStore.sidebarResizeWidth, (value, prevValue) => {
  textareaSizes()
})

const focusTextarea = async () => {
  await nextTick()
  const element = textareaElement.value
  const length = spaceNote.value.length
  utils.focusTextarea(element)
}

const textareaSizes = async () => {
  await nextTick()
  await nextTick()
  await nextTick()
  const element = textareaElement.value
  if (!element) { return }
  element.style.height = 'auto'
  element.style.height = element.scrollHeight + 2 + 'px' // +2 for chromium scrollbar fix
}

const spaceNote = computed({
  get () {
    return spaceStore.note
  },
  set (newValue) {
    spaceStore.updateSpace({ note: newValue })
    textareaSizes()
  }
})

const copyText = async (event) => {
  globalStore.clearNotificationsWithPosition()
  const position = utils.cursorPositionInPage(event)
  try {
    await navigator.clipboard.writeText(spaceNote.value)
    globalStore.addNotificationWithPosition({ message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    globalStore.addNotificationWithPosition({ message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}
</script>

<template lang="pug">
section.note(v-if="visible")
  .row.title-row
    div
      span Private Note
    button.small-button(title="Copy to Clipboard" @click="copyText")
      img.icon.copy(src="@/assets/copy.svg")
      span Copy

  textarea.name(
    data-1p-ignore
    autocomplete="off"
    ref="textareaElement"
    rows="2"
    placeholder="Type a personal space note here. Only you can see this."
    v-model="spaceNote"
  )
</template>

<style lang="stylus">
section.note
  .tips
    margin-bottom 10px
  // .icon.lock-icon
  //   vertical-align -1px
</style>
