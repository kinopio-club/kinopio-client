<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

const emit = defineEmits(['clearDrawing', 'closeDialogs'])

const props = defineProps({
  visible: Boolean
})

const clearDrawing = () => {
  emit('clearDrawing')
}
const closeDialogs = () => {
  emit('closeDialogs')
}
</script>

<template lang="pug">
dialog.narrow.clear-drawing-confirmation(v-if="props.visible" :open="props.visible" @click.left.stop )
  section
    button.danger.small-button(@click="clearDrawing")
      img.icon.remove(src="@/assets/remove.svg")
      span Clear Drawing
    button.small-button(@click="closeDialogs")
      img.icon.cancel(src="@/assets/add.svg")
</template>

<style lang="stylus">
dialog.clear-drawing-confirmation
  width max-content
</style>
