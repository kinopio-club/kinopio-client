<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import debounce from 'lodash-es/debounce'

const globalStore = useGlobalStore()

// this canvas is a rasterized duplicate of DrawingCanvas above it

// let spaceStrokes = []
const remoteStrokes = []

let unsubscribes

onMounted(() => {
  // updatePrevScroll()
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerUpdateDrawingBackground') {
        update()
      } else if (name === 'triggerDrawingReset') {
        update()
      } else if (name === 'triggerAddRemoteDrawingStroke') {
        // remoteStrokes.push(stroke)
        // renderStroke(stroke, true)
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const state = reactive({
  paths: [],
  eraserMasks: []
})

const pageHeight = computed(() => globalStore.pageHeight)
const pageWidth = computed(() => globalStore.pageWidth)

// const allStrokes = () => {
//   return spaceStrokes.concat(remoteStrokes)
// }

const update = () => {

}

</script>

<template lang="pug">
//- same as DrawingStrokes
svg.drawing-strokes(
  ref="svgElement"
  :width="pageWidth"
  :height="pageHeight"
)
  defs
    mask#eraserMask
      rect(:width="pageWidth" :height="pageHeight" fill="white")
      //- Add eraser strokes as black shapes to create cutouts
      template(v-for="eraser in state.eraserMasks" :key="eraser.id")
        circle(
          v-if="eraser.type === 'circle'"
          :cx="eraser.x"
          :cy="eraser.y"
          :r="eraser.r"
          fill="black"
        )
        path(
          v-else
          :d="eraser.d"
          stroke="black"
          :stroke-width="eraser.width"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        )

  //- Main drawing group with mask applied
  g(:mask="'url(#eraserMask)'")
    //- Render all drawing paths (non-eraser)
    template(v-for="path in state.paths" :key="path.id")
      circle(
        v-if="path.type === 'circle'"
        :cx="path.x"
        :cy="path.y"
        :r="path.r"
        :fill="path.color"
      )
      path(
        v-else
        :d="path.d"
        :stroke="path.color"
        :stroke-width="path.width"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      )
</template>

<style lang="stylus">
canvas.drawing-background
  position fixed
  background transparent
  pointer-events none
  top 0
  left 0
</style>
