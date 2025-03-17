<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

// import utils from '@/utils.js'

const store = useStore()

const viewportHeight = computed(() => store.state.viewportHeight)
const viewportWidth = computed(() => store.state.viewportWidth)

</script>

<template lang="pug">
canvas#drawing-canvas(
  :width="viewportWidth"
  :height="viewportHeight"
)
</template>

<style lang="stylus" scoped>
canvas
  position fixed
  background transparent
  // background pink
  top 0
  left 0
  width 100dvw
  height 100dvh
  opacity 1
  pointer-events none
</style>
