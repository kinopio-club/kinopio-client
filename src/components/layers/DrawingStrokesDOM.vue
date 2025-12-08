<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

const globalStore = useGlobalStore()

const props = defineProps({
  paths: Array
})

const pageHeight = computed(() => globalStore.pageHeight)
const pageWidth = computed(() => globalStore.pageWidth)
</script>

<template lang="pug">
svg.drawing-strokes(
  :width="pageWidth"
  :height="pageHeight"
)
  defs
    //- eraserMask is legacy
    //- current version does not have isEraser strokes
    mask#eraserMask
      rect(:width="pageWidth" :height="pageHeight" fill="white")
      template(v-for="path in props.paths" :key="path.id")
        template(v-if="path.isEraser")
          path(
            :d="path.d"
            stroke="black"
            :stroke-width="path.width"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            :data-id="path.id"
            :data-rect-x="path.rect.x"
            :data-rect-y="path.rect.y"
            :data-rect-width="path.rect.width"
            :data-rect-height="path.rect.height"
          )
  //- drawing strokes
  g(:mask="'url(#eraserMask)'")
    template(v-for="path in props.paths" :key="path.id")
      template(v-if="!path.isEraser")
        path(
          :d="path.d"
          :stroke="path.color"
          :stroke-width="path.width"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
          :data-id="path.id"
          :data-rect-x="path.rect.x"
          :data-rect-y="path.rect.y"
          :data-rect-width="path.rect.width"
          :data-rect-height="path.rect.height"
        )
</template>

<style lang="stylus">
svg.drawing-strokes
  position absolute
  transform-origin top left
  background transparent
  top 0
  left 0
  opacity 1
  pointer-events none
  z-index var(--max-z)
  mix-blend-mode hard-light
#drawing-strokes-background
  svg.drawing-strokes
    mix-blend-mode normal
    z-index 0
</style>
