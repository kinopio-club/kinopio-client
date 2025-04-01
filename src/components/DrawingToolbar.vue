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
  colorPickerIsVisible: false
})

const shouldIncreaseUIContrast = computed(() => store.state.currentUser.shouldIncreaseUIContrast)
const closeAllDialogs = () => {
  state.brushSizePickerIsVisible = false
  state.colorPickerIsVisible = false
}

// color

const toggleColorPickerIsVisible = () => {
  const value = !state.colorPickerIsVisible
  closeAllDialogs()
  state.colorPickerIsVisible = value
}
const drawingColor = computed(() => {
  return store.getters['currentUser/drawingColor']
})
const updateDrawingColor = (value) => {
  store.commit('currentUser/drawingColor', value)
}
const recentColors = computed(() => store.state.drawingStrokeColors)

// size

const toggleBrushSizePickerIsVisible = () => {
  const value = !state.brushSizePickerIsVisible
  closeAllDialogs()
  state.brushSizePickerIsVisible = value
}
const updateBrushSize = (value) => {
  store.commit('currentUser/drawingBrushSize', value)
}
const currentBrushSize = computed(() => store.state.currentUser.drawingBrushSize)

// eraser

const drawingEraserIsActive = computed(() => store.state.drawingEraserIsActive)
const toggleEraser = () => {
  const value = !drawingEraserIsActive.value
  closeAllDialogs()
  store.commit('drawingEraserIsActive', value)
}
</script>

<template lang="pug">
.drawing-toolbar(v-if="props.visible")
  ColorPicker(:currentColor="drawingColor" :visible="state.colorPickerIsVisible" @selectedColor="updateDrawingColor" :recentColors="recentColors")
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
    button.size-button(
      title="Size (S)"
      :class="{ active: state.brushSizePickerIsVisible, 'translucent-button': !shouldIncreaseUIContrast }"
      @click.left="toggleBrushSizePickerIsVisible"
    )
      img.icon.brush-size.l(v-if="currentBrushSize === 'l'" src="@/assets/brush-size-l.svg")
      img.icon.brush-size.m(v-if="currentBrushSize === 'm'" src="@/assets/brush-size-m.svg")
      img.icon.brush-size.s(v-if="currentBrushSize === 's'" src="@/assets/brush-size-s.svg")
    //- eraser
    button(
      title="Eraser (E)"
      :class="{ active: drawingEraserIsActive, 'translucent-button': !shouldIncreaseUIContrast }"
      @click.left="toggleEraser"
    )
      img.icon.eraser-icon(src="@/assets/eraser.svg")
</template>

<style lang="stylus">
.drawing-toolbar
  position absolute
  top 29px
  left 36px
  display block
  dialog
    top 23px
  .size-button
    width 34px
    height auto
    display flex
    justify-content center
    align-items center

</style>
