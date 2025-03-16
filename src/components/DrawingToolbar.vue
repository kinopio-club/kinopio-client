<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import ColorPicker from '@/components/dialogs/ColorPicker.vue'

const store = useStore()

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'closeAllDialogs') {
      closeAllDialogs()
    }
  })
})

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  colorPickerIsVisible: false,
  eraserIsActive: false
})

const shouldIncreaseUIContrast = computed(() => store.state.currentUser.shouldIncreaseUIContrast)
const closeAllDialogs = () => {
  state.colorPickerIsVisible = false
}
const toggleColorPickerIsVisible = () => {
  const value = !state.colorPickerIsVisible
  closeAllDialogs()
  state.colorPickerIsVisible = value
}
const drawingColor = computed(() => {
  return store.state.currentUser.drawingColor || store.state.currentUser.color
})
const updateDrawingColor = (value) => {
  store.commit('currentUser/drawingColor', value)
}
</script>

<template lang="pug">
.drawing-toolbar(v-if="props.visible")
  ColorPicker(:currentColor="drawingColor" :visible="state.colorPickerIsVisible" @selectedColor="updateDrawingColor")
  .segmented-buttons
    button.change-color(
      title="Color (C)"
      :class="{ active: state.colorPickerIsVisible, 'translucent-button': !shouldIncreaseUIContrast }"
      @click.left="toggleColorPickerIsVisible"
    )
      .current-color(:style="{backgroundColor: drawingColor}")
    button(
      title="Eraser (E)"
      :class="{ active: state.eraserIsActive, 'translucent-button': !shouldIncreaseUIContrast }"
    )
      span E
</template>

<style lang="stylus">
.drawing-toolbar
  position absolute
  top 29px
  left 36px
  display block
  dialog.color-picker
    top 23px
</style>
