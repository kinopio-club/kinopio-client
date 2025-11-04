<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import consts from '@/consts.js'

const emit = defineEmits(['updateBrushSize'])

const props = defineProps({
  visible: Boolean,
  currentBrushSize: String
})

const isCurrentBrushSize = (value) => {
  return props.currentBrushSize === value
}
const updateBrushSize = (value) => {
  emit('updateBrushSize', value)
}
const styles = computed(() => {
  const diameter = consts.drawingBrushSizeDiameter[props.currentBrushSize]
  return {
    width: `${diameter}px`,
    height: `${diameter}px`
  }
})
</script>

<template lang="pug">
dialog.narrow.brush-size-picker(v-if="props.visible" :open="props.visible" @click.left.stop)
  section
    .row
      .segmented-buttons
        button(:class="{active: isCurrentBrushSize('xs')}" @click="updateBrushSize('xs')")
          span XS
        button(:class="{active: isCurrentBrushSize('s')}" @click="updateBrushSize('s')")
          span S
        button(:class="{active: isCurrentBrushSize('m')}" @click="updateBrushSize('m')")
          span M
        button(:class="{active: isCurrentBrushSize('l')}" @click="updateBrushSize('l')")
          span L
    .row
      //- TODO show empty previews for other sizes in a row
      .size-preview(:style="styles")
</template>

<style lang="stylus">
dialog.brush-size-picker
  width max-content
  .size-preview
    background-color var(--primary)
    border-radius 100px
</style>
