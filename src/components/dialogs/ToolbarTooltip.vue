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
    description: 'Click to create a draggable horizontal dividing line. Use to mark pages, sections, slides.',
    videoUrl: ''
  },
  box: {
    title: 'Draw Box',
    keyboardShortcut: 'B',
    helpUrl: '',
    description: 'click to create, or drag to do x y z. for sections.',
    videoUrl: ''
  },
  list: {
    title: 'list',
    keyboardShortcut: 'L',
    helpUrl: '',
    description: 'click to create, or drag to do x y z. for sections.',
    videoUrl: ''
  },
  drawing: {
    title: 'Drawing',
    keyboardShortcut: 'D',
    helpUrl: '',
    description: 'click to create, or drag to do x y z. for sections.',
    videoUrl: ''
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
    img(src="https://d2w9rnfcy7mm78.cloudfront.net/46095939/original_105b79e6b78982b6b1eea60b261d66bf.jpeg?1778634028?bc=0")
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
