<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

// import utils from '@/utils.js'

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
</script>

<template lang="pug">
.drawing-toolbar(v-if="props.visible")
  .segmented-buttons
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
