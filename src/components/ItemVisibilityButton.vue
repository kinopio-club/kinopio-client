<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

const emit = defineEmits(['toggleIsVisible'])

const props = defineProps({
  isVisible: Boolean
})

const toggleIsVisible = () => {
  emit('toggleIsVisible', !props.isVisible)
}
</script>

<template lang="pug">
button.small-button.item-visibility-button(
  :class="{active: !props.isVisible}"
  @click.left.stop="toggleIsVisible"
  title="Toggle Visibility"
)
  img.icon.view(v-if="props.isVisible" src="@/assets/view.svg")
  img.icon.view-hidden(v-else src="@/assets/view-hidden.svg")
</template>

<style lang="stylus">
.item-visibility-button
  margin-right 5px
  z-index 1
</style>
