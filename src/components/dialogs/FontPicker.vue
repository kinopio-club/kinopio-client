<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import fonts from '@/data/fonts.js'
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

const emit = defineEmits(['selectFont'])

const props = defineProps({
  visible: Boolean,
  cards: Array,
  boxes: Array
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
  utils.scrollIntoView({ element })
}

// fonts

const selectFont = (font) => {
  emit('selectFont', font)
}
const items = computed(() => {
  let array = props.cards.concat(props.boxes)
  array = array.filter(item => Boolean(item))
  console.log(array, props.cards, props.boxes)
  return array
})
const fontIsSelected = (font) => {
  return items.value.find(item => {
    const currentFontId = item.headerFontId || 0
    return currentFontId === font.id
  })
}
</script>

<template lang="pug">
dialog.narrow.font-picker(v-if="visible" :open="visible" ref="dialogElement" @click.left.stop :style="{'max-height': state.dialogHeight + 'px'}")
  section.results-section
    ul.results-list
      template(v-for="font in fonts" :key="font.id")
        li(:class="{active: fontIsSelected(font)}" @click.left="selectFont(font)" tabindex="0" v-on:keyup.enter="selectFont(font)")
          //- img previewImage
          //- TODO dark mode = invert
          .name {{font.name}}
</template>

<style lang="stylus">
dialog.font-picker
  min-height 200px
  overflow auto
  width 160px
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
