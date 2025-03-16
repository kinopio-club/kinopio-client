<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

// import utils from '@/utils.js'

const store = useStore()

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  sizePickerIsVisible: false,
  colorPickerIsVisible: false,
  eraserIsActive: false
})

const closeDialogs = () => {
  state.sizePickerIsVisible = false
  state.colorPickerIsVisible = false
}

const xyz = () => {
  closeDialogs()
}

</script>

<template lang="pug">
.segmented-buttons.drawing-toolbar(v-if="props.visible")
  button(
    title="Size (S)"
    :class="{ active: state.sizePickerIsVisible, 'translucent-button': !shouldIncreaseUIContrast }"
    @click="xyz"
  )
    span S
  button(
    title="Color (C)"
    :class="{ active: state.colorPickerIsVisible, 'translucent-button': !shouldIncreaseUIContrast }"
    @click="xyz"
  )
    span C
  button(
    title="Eraser (E)"
    :class="{ active: state.eraserIsActive, 'translucent-button': !shouldIncreaseUIContrast }"
    @click="xyz"
  )
    span E
</template>

<style lang="stylus">
.drawing-toolbar
  position absolute
  top 29px
  left 36px
</style>
