<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import BrushSizePicker from '@/components/dialogs/BrushSizePicker.vue'

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
  brushSizePickerIsVisible: false,
  colorPickerIsVisible: false,
  eraserIsActive: false
})

const shouldIncreaseUIContrast = computed(() => store.state.currentUser.shouldIncreaseUIContrast)
const closeAllDialogs = () => {
  state.brushSizePickerIsVisible = false
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

const toggleBrushSizePickerIsVisible = () => {
  const value = !state.brushSizePickerIsVisible
  closeAllDialogs()
  state.brushSizePickerIsVisible = value
}
const updateBrushSize = (value) => {
  store.commit('currentUser/drawingBrushSize', value)
}
const currentBrushSize = computed(() => store.state.currentUser.drawingBrushSize)
</script>

<template lang="pug">
.drawing-toolbar(v-if="props.visible")
  ColorPicker(:currentColor="drawingColor" :visible="state.colorPickerIsVisible" @selectedColor="updateDrawingColor")
  BrushSizePicker(:visible="state.brushSizePickerIsVisible" @updateBrushSize="updateBrushSize" :currentBrushSize="currentBrushSize")
  .segmented-buttons
    //- color
    button.change-color(
      title="Color (C)"
      :class="{ active: state.colorPickerIsVisible, 'translucent-button': !shouldIncreaseUIContrast }"
      @click.left="toggleColorPickerIsVisible"
    )
      .current-color(:style="{backgroundColor: drawingColor}")
    //- size
    button(
      title="Size (S)"
      :class="{ active: state.brushSizePickerIsVisible, 'translucent-button': !shouldIncreaseUIContrast }"
      @click.left="toggleBrushSizePickerIsVisible"
    )
      span.badge.info {{currentBrushSize.toUpperCase()}}
      span S
    //- eraser
    button(
      title="Eraser (E)"
      :class="{ active: state.eraserIsActive, 'translucent-button': !shouldIncreaseUIContrast }"
    )
      img.icon.eraser-icon(src="@/assets/eraser.svg")
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
