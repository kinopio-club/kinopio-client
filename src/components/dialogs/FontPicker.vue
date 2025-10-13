<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useThemeStore } from '@/stores/useThemeStore'
import NameSegment from '@/components/NameSegment.vue'

import fonts from '@/data/fonts.js'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const themeStore = useThemeStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['selectFont', 'selectFontSize'])

const props = defineProps({
  visible: Boolean,
  cards: Array,
  boxes: Array
})
const state = reactive({
  dialogHeight: null,
  previewFontId: 0
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
const isThemeDark = computed(() => themeStore.getIsThemeDark)

const items = computed(() => {
  let array = props.cards.concat(props.boxes)
  array = array.filter(item => Boolean(item))
  return array
})

// fonts

const hType = (name) => {
  const h1 = utils.markdown().h1Pattern.exec(name)
  const h2 = utils.markdown().h2Pattern.exec(name)
  const h3 = utils.markdown().h3Pattern.exec(name)
  let type
  if (h1) {
    type = 'h1'
  } else if (h2) {
    type = 'h2'
  } else if (h3) {
    type = 'h3'
  }
  return type
}
const headerFonts = computed(() => {
  return items.value.filter(item => {
    return hType(item.name)
  })
})

const fontIsSelected = (font) => {
  return headerFonts.value.find(item => {
    const currentFontId = item.headerFontId || 0
    const isCurrentFont = currentFontId === font.id
    if (!isCurrentFont) { return }
    state.previewFontId = currentFontId
    return true
  })
}
const selectFont = (font) => {
  emit('selectFont', font)
}

// font size

const isFontSize = (size) => {
  return headerFonts.value.find(item => {
    const currentFontSize = item.headerFontSize || 's'
    return currentFontSize === size
  })
}
const selectFontSize = (size) => {
  emit('selectFontSize', size)
}
const currentFontSizeString = computed(() => {
  // should match NameSegment header-font-size styles
  const sizes = {
    s: {
      h1: 20,
      h2: 18,
      h3: 16
    },
    m: {
      h1: 44,
      h2: 36,
      h3: 24
    },
    l: {
      h1: 66,
      h2: 52,
      h3: 36
    }
  }
  const name = headerFonts.value[0]?.name
  const type = hType(name)
  const currentFontSize = items.value[0].headerFontSize || 's'
  const size = sizes[currentFontSize][type]
  return size + 'px'
})

// preview

const previewSegments = computed(() => {
  let preview
  headerFonts.value.some(item => {
    const name = utils.truncated(item.name)
    const h1 = utils.markdown().h1Pattern.exec(name)
    const h2 = utils.markdown().h2Pattern.exec(name)
    const h3 = utils.markdown().h3Pattern.exec(name)
    const match = h1 || h2 || h3
    if (match) {
      preview = match[2].trim()
    }
    return match
  })
  if (!preview) { return }
  preview = utils.cardNameSegments(preview)
  preview = preview.map(segment => {
    segment.markdown = [{
      type: 'h1',
      content: segment.content
    }]
    return segment
  })
  return preview
})
</script>

<template lang="pug">
dialog.font-picker(v-if="visible" :open="visible" ref="dialogElement" @click.left.stop :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
    template(v-for="segment in previewSegments")
      NameSegment(:segment="segment" :headerFontId="state.previewFontId" :backgroundColorIsDark="isThemeDark")
  section.font-size
    //- size
    .row
      .segmented-buttons.font-size-buttons
        button.small-button(title="Small" :class="{active: isFontSize('s')}" @click="selectFontSize('s')")
          img.icon.size-small(src="@/assets/size-small.svg")
        button.small-button(title="Medium" :class="{active: isFontSize('m')}" @click="selectFontSize('m')")
          img.icon.size-medium(src="@/assets/size-medium.svg")
        button.small-button(title="Large" :class="{active: isFontSize('l')}" @click="selectFontSize('l')")
          img.icon.size-large(src="@/assets/size-large.svg")
      .badge.info {{currentFontSizeString}}

  section.results-section
    //- font
    ul.results-list(:class="{'is-dark-theme': isThemeDark}")
      template(v-for="font in fonts" :key="font.id")
        li(:class="{active: fontIsSelected(font)}" @click.left="selectFont(font)" tabindex="0" v-on:keyup.enter="selectFont(font)")
          img.preview-image(:src="font.previewImage" :title="font.name")
</template>

<style lang="stylus">
dialog.font-picker
  min-height 300px
  overflow auto
  top calc(100% + 4px)
  .font-size-buttons
    margin-right 6px
    .small-button
      padding 0 5px
    .icon.size-medium
      vertical-align -1px
  .preview-image
    height 20px
    vertical-align -5px
    user-select none
    -webkit-user-drag none
    user-drag none
  .is-dark-theme
    .preview-image
      filter invert()
dialog.font-picker-preview
  top 44px
  left 215%
  max-height 180px
  overflow auto
</style>
