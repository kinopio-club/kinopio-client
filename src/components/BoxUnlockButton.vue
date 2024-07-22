<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
const store = useStore()

const props = defineProps({
  box: Object
})
const state = reactive({
  position: null
})

const canEditBox = computed(() => store.getters['currentUser/canEditBox'](props.box))

// styles

const positionStyles = computed(() => {
  const buttonWidth = 36
  const width = props.box.resizeWidth
  const x = props.box.x + width - buttonWidth
  return {
    left: x + 'px',
    top: props.box.y + 'px'
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
.box-unlock-button.inline-button-wrap.item-unlock-button(:style="positionStyles" @mouseup.left="unlockBox" @touchend="unlockBox" :data-item-id="box.id")
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
