<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const dialogElement = ref(null)

const props = defineProps({
  visible: Boolean,
  tool: String // line, box, list, drawing
})

const state = reactive({
  dialogHeight: null
})

const data = {
  // TODO line help doc
  // https://x.com/KinopioClub/status/1988653434996682936
  line: {
    title: 'Add Line Divider',
    keyboardShortcut: '–',
    helpUrl: '',
    description: 'Add a horizontal dividing line between pages, sections, or slides.',
    videoUrl: 'https://files.kinopio.club/tooltips/tooltip-line.gif'
    // grid bk, 324 x 212
  },
  box: {
    title: 'Draw Box',
    keyboardShortcut: 'B',
    helpUrl: 'https://kinopio.club/help/posts/boxes/',
    description: 'Drag to create a box to define regions and group everything inside.',
    videoUrl: 'https://files.kinopio.club/tooltips/tooltip-box.gif'
  },
  list: {
    title: 'Draw List',
    keyboardShortcut: 'L',
    helpUrl: 'https://kinopio.club/help/posts/lists/',
    description: 'Drag to create a list to vertically group and sort cards.',
    videoUrl: 'https://files.kinopio.club/tooltips/tooltip-list.gif'
  },
  drawing: {
    title: 'Drawing',
    keyboardShortcut: 'D',
    helpUrl: 'https://kinopio.club/help/posts/drawing/',
    description: 'Draw freehand strokes. You can change color, stroke size, and toggle eraser mode.',
    videoUrl: 'https://files.kinopio.club/tooltips/tooltip-drawing.gif'
  }
}

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const tooltip = computed(() => {
  return data[props.tool]
})
</script>

<template lang="pug">
dialog.narrow.toolbar-tooltip#toolbar-tooltip(
  v-if="props.visible"
  :open="props.visible"
  @click.left.stop
  ref="dialogElement"
  :style="{'max-height': state.dialogHeight + 'px'}"
)
  section.title-section
    .row.title-row
      div {{ tooltip.title }}
      div
        .badge.keyboard-shortcut(title="keyboard Shortcut") {{ tooltip.keyboardShortcut }}
  section
    img(:src="tooltip.videoUrl" aria-label="tooltip line")
    p {{ tooltip.description }}
    p
      a(:href="tooltip.helpUrl" target="_blank")
        button
          span Help{{' '}}
          img.icon.visit(src="@/assets/visit.svg")
</template>

<style lang="stylus">
dialog.toolbar-tooltip
  left 29px
  top 0px
  width 180px
  .keyboard-shortcut
    vertical-align 0
    margin 0
    margin-left 5px
    padding 0 5px
  img:not(.icon),
  video
    margin-bottom -4px
    border-radius var(--entity-radius)
</style>
