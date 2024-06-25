<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import frames from '@/data/frames.js'
import FrameBadge from '@/components/FrameBadge.vue'
import utils from '@/utils.js'
const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
})

const emit = defineEmits(['updateCount'])

const props = defineProps({
  visible: Boolean,
  cards: Array
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
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const scrollIntoView = () => {
  const element = dialogElement.value
  store.commit('scrollElementIntoView', { element })
}

// frames

const changeCardFrame = (frame) => {
  props.cards.forEach(card => {
    card = {
      frameId: frame.id,
      frameName: frame.name,
      id: card.id
    }
    store.dispatch('currentCards/update', card)
  })
}
const frameIsSelected = (frame) => {
  const cardFrameIds = props.cards.map(card => card.frameId)
  return cardFrameIds.includes(frame.id)
}
</script>

<template lang="pug">
dialog.narrow.frame-picker(v-if="visible" :open="visible" ref="dialogElement" @click.left.stop :style="{'max-height': state.dialogHeight + 'px'}")
  section.results-section
    ul.results-list
      template(v-for="frame in frames" :key="frame.id")
        li(:class="{active: frameIsSelected(frame)}" @click.left="changeCardFrame(frame)" tabindex="0" v-on:keyup.enter="changeCardFrame(frame)")
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
