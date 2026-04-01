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

onMounted(() => {
  focusTextarea()
  textareaSizes()
})

const props = defineProps({
  visible: Boolean,
  subsectionHeight: Number
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
watch(() => spaceStore.id, (value, prevValue) => {
  textareaSizes()
})

const styles = computed(() => {
  return {
    maxHeight: props.subsectionHeight + 'px'
  }
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
  position.x = position.x - 30
  try {
    await navigator.clipboard.writeText(spaceNote.value)
    globalStore.addNotificationWithPosition({ message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    globalStore.addNotificationWithPosition({ message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}

const isSignedIn = computed(() => userStore.getUserIsSignedIn)
const triggerSignUpOrInIsVisible = () => {
  globalStore.closeAllDialogs()
  globalStore.triggerSignUpOrInIsVisible()
}
</script>

<template lang="pug">
section.note(v-if="visible" :style="styles")
  .row.title-row
    div
      span Private Note
    button.small-button(v-if="isSignedIn" title="Copy to Clipboard" @click="copyText")
      img.icon.copy(src="@/assets/copy.svg")
      span Copy

  p(v-if="!isSignedIn")
    p
      span.badge.info Sign Up or In
      span to write private space notes
    button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In

  textarea.name(
    v-if="isSignedIn"
    data-1p-ignore
    autocomplete="off"
    ref="textareaElement"
    rows="2"
    placeholder="Type a note for this space here. Only you can see this."
    v-model="spaceNote"
  )
</template>

<style lang="stylus">
section.note
  overflow auto
  .tips
    margin-bottom 10px
</style>
