<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
const store = useStore()

onMounted(() => {
  store.subscribe(async (mutation, state) => {
    const { type, payload } = mutation
    if (type === 'spaceZoomPercent' || type === 'zoomOrigin') {
      await nextTick()
      updatePosition()
    }
  })
  updatePosition()
})

const props = defineProps({
  box: Object
})
const state = reactive({
  position: null
})

const canEditBox = computed(() => store.getters['currentUser/canEditBox'](props.box))

// styles

const updatePosition = () => {
  const element = document.querySelector(`.box[data-box-id="${props.box.id}"] .lock-button-wrap`)
  if (!element) { return }
  const rect = element.getBoundingClientRect()
  state.position = rect
}
const positionStyles = computed(() => {
  if (!state.position) { return }
  const position = utils.updatePositionWithSpaceOffset(state.position)
  const x = (position.x + window.scrollX) * store.getters.spaceCounterZoomDecimal
  const y = (position.y + window.scrollY) * store.getters.spaceCounterZoomDecimal
  return {
    left: x + 'px',
    top: y + 'px'
  }
})
const backgroundStyles = computed(() => {
  return { backgroundColor: 'transparent' }
})

// theme colors

const backgroundColorIsDark = computed(() => {
  const color = props.box.color
  return utils.colorIsDark(color)
})
const isThemeDark = computed(() => store.state.currentUser.theme === 'dark')
const isDarkInLightTheme = computed(() => backgroundColorIsDark.value && !isThemeDark.value)
const isLightInDarkTheme = computed(() => !backgroundColorIsDark.value && isThemeDark.value)

// unlock

const unlockBox = (event) => {
  if (store.state.currentUserIsDrawingConnection) { return }
  event.stopPropagation()
  // notify read only if user cannot edit
  if (!canEditBox.value) {
    const position = utils.cursorPositionInPage(event)
    store.commit('addNotificationWithPosition', { message: 'Box is Read Only', position, type: 'info', layer: 'space', icon: 'cancel' })
    return
  }
  store.commit('currentUserIsDraggingBox', false)
  store.dispatch('currentBoxes/update', {
    id: props.box.id,
    isLocked: false
  })
}

</script>

<template lang="pug">
.box-unlock-button.inline-button-wrap(:style="positionStyles" @mouseup.left="unlockBox" @touchend="unlockBox")
  button.inline-button(tabindex="-1" :style="backgroundStyles" :class="{'is-light-in-dark-theme': isLightInDarkTheme, 'is-dark-in-light-theme': isDarkInLightTheme}")
    img.icon.lock-icon(src="@/assets/lock.svg")
</template>

<style lang="stylus">
.box-unlock-button
  transform-origin top left
  pointer-events all
  cursor pointer
  position absolute
  button
    cursor pointer
  .lock-icon
    position absolute
    left 5.5px
    top 2px
    height 10px
  .is-light-in-dark-theme
    border-color var(--primary-on-light-background)
    .icon
      filter none
  .is-dark-in-light-theme
    border-color var(--primary-on-dark-background)
    .icon
      filter invert()

</style>
