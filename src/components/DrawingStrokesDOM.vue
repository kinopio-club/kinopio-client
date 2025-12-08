<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

const globalStore = useGlobalStore()

// const props = defineProps({
//   paths: Array
// })

const pageHeight = computed(() => globalStore.pageHeight)
const pageWidth = computed(() => globalStore.pageWidth)
</script>

<template lang="pug">
p hi
//- svg.drawing-strokes(
//-   :width="pageWidth"
//-   :height="pageHeight"
//- )
  //- defs
  //-   mask#eraserMask
  //-     rect(:width="pageWidth" :height="pageHeight" fill="white")
  //-     //- Add eraser strokes as black shapes to create cutouts
  //-     template(v-for="path in props.paths" :key="path.id")
  //-       template(v-if="path.isEraser")
  //-         circle(
  //-           v-if="path.type === 'circle'"
  //-           :cx="path.x"
  //-           :cy="path.y"
  //-           :r="path.r"
  //-           fill="black"
  //-         )
  //-         path(
  //-           v-else
  //-           :d="path.d"
  //-           stroke="black"
  //-           :stroke-width="path.width"
  //-           fill="none"
  //-           stroke-linecap="round"
  //-           stroke-linejoin="round"
  //-         )

  //- //- Main drawing group with mask applied
  //- g(:mask="'url(#eraserMask)'")
  //-   //- Render all drawing paths (non-eraser)
  //-   template(v-for="path in props.paths" :key="path.id")
  //-     template(v-if="!path.isEraser")
  //-       circle(
  //-         v-if="path.type === 'circle'"
  //-         :cx="path.x"
  //-         :cy="path.y"
  //-         :r="path.r"
  //-         :fill="path.color"
  //-       )
  //-       path(
  //-         v-else
  //-         :d="path.d"
  //-         :stroke="path.color"
  //-         :stroke-width="path.width"
  //-         fill="none"
  //-         stroke-linecap="round"
  //-         stroke-linejoin="round"
  //-       )
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
