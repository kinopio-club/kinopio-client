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

const emit = defineEmits(['selectFont', 'selectFontSize'])

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
const isThemeDark = computed(() => store.getters['themes/isThemeDark'])

const items = computed(() => {
  let array = props.cards.concat(props.boxes)
  array = array.filter(item => Boolean(item))
  return array
})

// fonts

const fontIsSelected = (font) => {
  return items.value.find(item => {
    const currentFontId = item.headerFontId || 0
    return currentFontId === font.id
  })
}
const selectFont = (font) => {
  emit('selectFont', font)
}

// font size

const isFontSize = (size) => {
  return items.value.find(item => {
    const currentFontId = item.headerFontSize || 's'
    return currentFontId === size
  })
}
const selectFontSize = (size) => {
  emit('selectFontSize', size)
}
</script>

<template lang="pug">
dialog.narrow.font-picker(v-if="visible" :open="visible" ref="dialogElement" @click.left.stop :style="{'max-height': state.dialogHeight + 'px'}")
  section.results-section
    //- size
    .segmented-buttons.font-size-buttons
      button.small-button(title="Small" :class="{active: isFontSize('s')}" @click="selectFontSize('s')")
        img.icon.size-small(src="@/assets/size-small.svg")
      button.small-button(title="Medium" :class="{active: isFontSize('m')}" @click="selectFontSize('m')")
        img.icon.size-medium(src="@/assets/size-medium.svg")
      button.small-button(title="Large" :class="{active: isFontSize('l')}" @click="selectFontSize('l')")
        img.icon.size-large(src="@/assets/size-large.svg")
    //- font
    ul.results-list(:class="{'is-dark-theme': isThemeDark}")
      template(v-for="font in fonts" :key="font.id")
        li(:class="{active: fontIsSelected(font)}" @click.left="selectFont(font)" tabindex="0" v-on:keyup.enter="selectFont(font)")
          img.preview-image(:src="font.previewImage" :title="font.name")
</template>

<style lang="stylus">
dialog.font-picker
  min-height 200px
  overflow auto
  width 160px
  .font-size-buttons
    .small-button
      padding 0 5px
    .icon.size-medium
      vertical-align -1px
  section
    padding-top 4px
  .badge
    width 20px
    height 19px
    display block
    padding 0
  .preview-image
    width 100%
    vertical-align -5px
    user-select none
    -webkit-user-drag none
    user-drag none
  .is-dark-theme
    .preview-image
      filter invert()

</style>
