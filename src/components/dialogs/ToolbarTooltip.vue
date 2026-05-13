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
  toolName: String
})
const state = reactive({
  dialogHeight: null
})

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

const data = computed(() => {
  if (props.toolName === 'line') {
    return {
      title: 'Add Line Divider',
      keyboardShortcut: '–',
      helpUrl: '',
      description: 'click to create, or drag to do x y z. for sections.',
      videoUrl: ''
    }
  } else {
    return {}
  }
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
      span {{ data.title }}
        span.badge.keyboard-shortcut(title="keyboard Shortcut") {{ data.keyboardShortcut }}
      a(:href="data.helpUrl" target="_blank")
        button.small-button ?
  section
    img(src="https://d2w9rnfcy7mm78.cloudfront.net/46095939/original_105b79e6b78982b6b1eea60b261d66bf.jpeg?1778634028?bc=0")
    p {{ data.description }}
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
