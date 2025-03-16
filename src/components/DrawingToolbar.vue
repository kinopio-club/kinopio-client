<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

// import utils from '@/utils.js'
import BrushSizePicker from '@/components/dialogs/BrushSizePicker.vue'

const store = useStore()

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  brushSizePickerIsVisible: false,
  colorPickerIsVisible: false,
  eraserIsActive: false
})

const shouldIncreaseUIContrast = computed(() => store.state.currentUser.shouldIncreaseUIContrast)
const closeDialogs = () => {
  state.brushSizePickerIsVisible = false
  state.colorPickerIsVisible = false
}
const toggleBrushSizePickerIsVisible = () => {
  const value = !state.brushSizePickerIsVisible
  closeDialogs()
  state.brushSizePickerIsVisible = value
}
const updateBrushSize = (value) => {
  console.log('updateBrushSize', value)
}
</script>

<template lang="pug">
.drawing-toolbar(v-if="props.visible")
  BrushSizePicker(:visible="state.brushSizePickerIsVisible" @updateBrushSize="updateBrushSize")
  .segmented-buttons
    button(
      title="Size (S)"
      :class="{ active: state.brushSizePickerIsVisible, 'translucent-button': !shouldIncreaseUIContrast }"
      @click.left="toggleBrushSizePickerIsVisible"
    )
      span S
    button(
      title="Color (C)"
      :class="{ active: state.colorPickerIsVisible, 'translucent-button': !shouldIncreaseUIContrast }"
    )
      span C
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
  dialog.brush-size-picker
    top 23px
</style>
