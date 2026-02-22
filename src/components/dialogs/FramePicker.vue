<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useListStore } from '@/stores/useListStore'

import frames from '@/data/frames.js'
import FrameBadge from '@/components/FrameBadge.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const listStore = useListStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['updateCount'])

const props = defineProps({
  visible: Boolean,
  cards: {
    type: Array,
    default: () => {
      return []
    }
  },
  lists: {
    type: Array,
    default: () => {
      return []
    }
  }
})
const state = reactive({
  dialogHeight: null
})

watch(() => props.visible, async (value, prevValue) => {
  if (value) {
    await nextTick()
    scrollIntoView()
    await nextTick()
    updateDialogHeight()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const scrollIntoView = () => {
  const element = dialogElement.value
  globalStore.scrollElementIntoView({ element })
}

// frames

const updateFrame = (frame) => {
  // check if shouldClear
  let shouldClear
  props.cards.forEach(card => {
    if (card.frameId === frame.id) {
      shouldClear = true
    }
  })
  props.lists.forEach(list => {
    if (list.frameId === frame.id) {
      shouldClear = true
    }
  })
  if (shouldClear) {
    frame = {
      id: 0,
      name: 'None'
    }
  }
  // update items
  props.cards.forEach(card => {
    const update = {
      frameId: frame.id,
      frameName: frame.name,
      id: card.id
    }
    cardStore.updateCard(update)
  })
  props.lists.forEach(list => {
    const update = {
      frameId: frame.id,
      frameName: frame.name,
      id: list.id
    }
    listStore.updateList(update)
  })
}
const frameIsSelected = (frame) => {
  const cardFrameIds = props.cards.map(card => card.frameId)
  const listFrameIds = props.lists.map(list => list.frameId)
  return cardFrameIds.includes(frame.id) || listFrameIds.includes(frame.id)
}
</script>

<template lang="pug">
dialog.narrow.frame-picker(v-if="visible" :open="visible" ref="dialogElement" @click.left.stop :style="{'max-height': state.dialogHeight + 'px'}")
  section.results-section
    ul.results-list
      template(v-for="frame in frames" :key="frame.id")
        li(:class="{active: frameIsSelected(frame)}" @click.left="updateFrame(frame)" tabindex="0" v-on:keyup.enter="updateFrame(frame)")
          FrameBadge(:frame="frame")
          .name {{frame.name}}
</template>

<style lang="stylus">
.frame-picker
  min-height 200px
  overflow auto
  section
    padding-top 4px
  .badge
    width 20px
    height 19px
    display block
    padding 0
    img
      width 100%
      vertical-align -5px
</style>
