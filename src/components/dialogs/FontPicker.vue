<script setup>
import { reactive, computed, onBeforeUnmount, onMounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useThemeStore } from '@/stores/useThemeStore'

import fonts from '@/data/fonts.js'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const themeStore = useThemeStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['selectFont', 'selectFontSize'])

const props = defineProps({
  visible: Boolean,
  cards: Array,
  boxes: Array
})
const state = reactive({
  dialogHeight: null,
  previewFontId: 0,
  previewItem: {}
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
  updatePreviewItem(array)
  return array
})
const updatePreviewItem = (array) => {
  const previewItems = array.filter(item => hType(item.name))
  state.previewItem = previewItems[0]
}

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

// font preview

const preview = computed(() => {
  // normalize name
  let name = utils.truncated(state.previewItem?.name)
  const checkbox = utils.checkboxFromString(name)
  if (checkbox) {
    name = name.replace(checkbox, '')
  }
  const normalizedName = name
  // get header in name
  const h1 = utils.markdown().h1Pattern.exec(name)
  const h2 = utils.markdown().h2Pattern.exec(name)
  const h3 = utils.markdown().h3Pattern.exec(name)
  name = h1 || h2 || h3
  if (name) {
    name = name[2].trim()
  }
  const value = {
    name,
    type: hType(normalizedName),
    headerFontId: state.previewItem?.headerFontId,
    headerFontSize: state.previewItem?.headerFontSize,
    backgroundColor: state.previewItem?.backgroundColor || state.previewItem?.color
  }
  value.class = utils.colorClasses({ backgroundColor: value.backgroundColor })
  value.class.push(`header-font-${state.previewItem?.headerFontId}`)
  return value
})

</script>

<template lang="pug">
dialog.font-picker(v-if="visible" :open="visible" ref="dialogElement" @click.left.stop :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section(v-if="preview" :style="{ 'background-color': preview.backgroundColor }")
    .name-segment(:class="preview.class")
      .markdown
        template(v-if="preview.type === 'h1'")
          h1 {{preview.name}}
        template(v-if="preview.type === 'h2'")
          h2 {{preview.name}}
        template(v-if="preview.type === 'h3'")
          h3 {{preview.name}}

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
  .is-background-light
    h1,
    h2,
    h3
      color var(--primary-on-light-background)
  .is-background-dark
    h1,
    h2,
    h3
      color var(--primary-on-dark-background)

dialog.font-picker-preview
  top 44px
  left 215%
  max-height 180px
  overflow auto
</style>
