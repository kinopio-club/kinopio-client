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
  window.addEventListener('pointerup', clearCurrentConnection)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerup', clearCurrentConnection)
})

const props = defineProps({
  visible: Boolean,
  subsectionHeight: Number
})

const state = reactive({
  backgroundColor: null
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
const isSpaceMember = computed(() => userStore.getUserIsSpaceMember)
const canEdit = computed(() => isSignedIn.value && isSpaceMember.value)
const triggerSignUpOrInIsVisible = () => {
  globalStore.closeAllDialogs()
  globalStore.triggerSignUpOrInIsVisible()
}

const textareaStyles = computed(() => {
  let borderRadius = 0
  if (state.backgroundColor) {
    borderRadius = utils.cssVariable('entity-radius')
  }
  return {
    backgroundColor: state.backgroundColor,
    borderRadius
  }
})

// connect to copy

const clearCurrentConnection = () => {
  state.backgroundColor = null
}
const mouseenter = (event) => {
  if (!globalStore.currentUserIsDrawingConnection) { return }
  state.backgroundColor = globalStore.currentConnectionColor
}
const mouseleave = (event) => {
  clearCurrentConnection()
}
const copyCurrentConnectionItemNamesToNote = (event) => {
  if (!globalStore.currentUserIsDrawingConnection) { return }
  globalStore.closeAllDialogs()
  // item names
  let items = globalStore.currentConnectionStartItemIds.map(id => spaceStore.getSpaceItemById(id))
  items = utils.sortByY(items)
  let newText = ''
  items.forEach((item, index) => {
    let itemName = ''
    if (index) {
      itemName = '\n\n'
    }
    itemName += item.name
    newText += itemName
  })
  // append to note
  const note = spaceNote.value
  let newValue
  if (note) {
    newValue = `${note}\n\n${newText}`
  } else {
    newValue = newText
  }
  spaceNote.value = newValue
  clearCurrentConnection()
  focusTextarea()
}
</script>

<template lang="pug">
section.note(v-if="visible" :style="styles")
  .row.title-row
    div
      span Private Note
    button.small-button(v-if="canEdit" title="Copy to Clipboard" @click="copyText")
      img.icon.copy(src="@/assets/copy.svg")
      span Copy

  section.subsection(v-if="!isSignedIn")
    p
      span.badge.info Sign Up or In
      span to write private notes for this space
    button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
  section.subsection(v-else-if="!isSpaceMember")
    p Only members of this space can write private notes

  .textarea-wrap
    textarea.name(
      v-if="canEdit"
      data-1p-ignore
      autocomplete="off"
      ref="textareaElement"
      rows="2"
      placeholder="Type a note for this space here. Only you can see this."
      v-model="spaceNote"
      @mouseenter="mouseenter"
      @mouseleave="mouseleave"
      @mouseup.left="copyCurrentConnectionItemNamesToNote"
      :style="textareaStyles"
    )
    .focusing-frame(v-if="state.backgroundColor" :style="{backgroundColor: state.backgroundColor}")
</template>

<style lang="stylus">
section.note
  overflow auto
  .tips
    margin-bottom 10px
  .textarea-wrap
    position relative
    textarea
      margin-bottom 100px
    .focusing-frame
      animation-iteration-count 400 // infinite
      width 100%
      height 100%

  @keyframes focusing
    100%
      left calc(-1 * var(--small-focus-padding) / 2)
      top calc(-1 * var(--small-focus-padding) / 2)
      width calc(100% + var(--small-focus-padding))
      height: calc(100% + var(--small-focus-padding))
      border-radius calc(2 * var(--entity-radius))
</style>
