<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useAnalyticsStore } from '@/stores/useAnalyticsStore'

import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import FontPicker from '@/components/dialogs/FontPicker.vue'
import utils from '@/utils.js'

import uniq from 'lodash-es/uniq'

const globalStore = useGlobalStore()
const boxStore = useBoxStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const themeStore = useThemeStore()
const analyticsStore = useAnalyticsStore()

let unsubscribes

onMounted(() => {
  updateDefaultColor(utils.cssVariable('secondary-background'))

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name }) => {
      if (name === 'triggerCloseChildDialogs' && props.visible) {
        const shouldPreventEmit = true
        closeDialogs(shouldPreventEmit)
      } else if (name === 'triggerUpdateTheme') {
        updateDefaultColor(utils.cssVariable('secondary-background'))
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

const emit = defineEmits(['closeDialogs', 'scrollIntoView'])

const props = defineProps({
  visible: Boolean,
  colorIsHidden: Boolean,
  labelIsVisible: Boolean,
  backgroundColor: String,
  backgroundColorIsFromTheme: Boolean,
  boxes: {
    type: Array,
    default () { return [] }
  },
  collapseExpandIsVisible: Boolean
})

const state = reactive({
  colorPickerIsVisible: false,
  fontPickerIsVisible: false,
  defaultColor: '#e3e3e3',
  isHover: false
})

const isSpaceMember = computed(() => userStore.getUserIsSpaceMember)
const editableBoxes = computed(() => props.boxes.filter(box => userStore.getUserCanEditBox(box)))

const canEditAll = computed(() => {
  if (isSpaceMember.value) { return true }
  return editableBoxes.value.length === props.boxes.length
})

const updateDefaultColor = (color) => {
  state.defaultColor = color
}

// utils

const closeDialogs = (shouldPreventEmit) => {
  state.colorPickerIsVisible = false
  state.fontPickerIsVisible = false
  globalStore.userDetailsIsVisible = false
  if (shouldPreventEmit) { return }
  emit('closeDialogs')
}
const updateIsHover = (value) => {
  state.isHover = value
}
const isHoverVisible = computed(() => state.isHover && props.collapseExpandIsVisible)

// collapse/expand

const shouldShowMultipleSelectedBoxActions = computed(() => userStore.shouldShowMultipleSelectedBoxActions)
const toggleShouldShowMultipleSelectedBoxActions = async () => {
  closeDialogs()
  const value = !shouldShowMultipleSelectedBoxActions.value
  await userStore.updateUser({ shouldShowMultipleSelectedBoxActions: value })
  nextTick(() => {
    emit('scrollIntoView')
  })
}

// items (boxes only)

const items = computed(() => props.boxes.map(box => ({ ...box, isBox: true })))
const label = 'BOX'

// update name (headers)

const itemsWithPattern = (pattern) => {
  return items.value.filter(item => {
    const name = normalizedName(item.name)
    return Boolean(utils.markdown()[pattern].exec(name))
  })
}
const normalizedName = (name) => {
  name = utils.removeMarkdownCodeblocksFromString(name) || ''
  const urls = utils.urlsFromString(name) || []
  urls.forEach(url => { name = name.replace(url, '') })
  const tags = utils.tagsFromString(name) || []
  tags.forEach(tag => { name = name.replace(tag, '') })
  const checkbox = utils.checkboxFromString(name) || ''
  name = name.replace(checkbox, '')
  return name.trim()
}
const markdown = (pattern) => {
  if (pattern === 'h1Pattern') return '# '
  if (pattern === 'h2Pattern') return '## '
}
const prependToName = ({ pattern, item, nameSegment }) => {
  const md = markdown(pattern)
  let index = item.name.indexOf(nameSegment)
  if (index < 0) { index = 0 }
  const newName = utils.insertStringAtIndex(item.name, md, index)
  updateBox(item, { name: newName })
}
const prependToItemNames = (pattern) => {
  items.value.forEach(item => {
    const name = normalizedName(item.name) || ''
    if (utils.markdown()[pattern].exec(name)) { return }
    prependToName({ pattern, item, nameSegment: name })
  })
}

// box fill

const boxFillIsEmpty = computed(() => props.boxes.every(box => box.fill === 'empty'))
const boxFillIsFilled = computed(() => props.boxes.every(box => box.fill === 'filled'))
const updateBoxFill = (fill) => {
  props.boxes.forEach(box => updateBox(box, { fill }))
  if (fill === 'empty') {
    analyticsStore.event('UpdateBoxFillToEmpty')
  }
}

// color

const color = computed(() => {
  const colors = items.value.map(item => item.color).filter(Boolean)
  const itemsHaveColors = colors.length === items.value.length
  const colorsAreEqual = uniq(colors).length === 1
  if (itemsHaveColors && colorsAreEqual) return colors[0]
  return state.defaultColor
})
const background = computed(() => props.backgroundColor || color.value)
const itemColors = computed(() => spaceStore.getSpaceItemColors.box)
const updateColor = (color) => {
  if (color === 'transparent') { return }
  items.value.forEach(item => {
    if (item.color === color) { return }
    updateBox(item, { color })
  })
}
const toggleColorPickerIsVisible = () => {
  const isVisible = state.colorPickerIsVisible
  closeDialogs()
  state.colorPickerIsVisible = !isVisible
}
const colorClasses = computed(() => {
  if (props.backgroundColorIsFromTheme) {
    return utils.colorClasses({ backgroundColorIsDark: themeStore.getIsThemeDark })
  }
  return utils.colorClasses({ backgroundColor: background.value })
})

// header h1 h2

const isH1 = computed(() => Boolean(itemsWithPattern('h1Pattern').length))
const isH2 = computed(() => Boolean(itemsWithPattern('h2Pattern').length))
const isH3 = computed(() => Boolean(itemsWithPattern('h3Pattern').length))
const isHeaderSelected = computed(() => isH1.value || isH2.value || isH3.value)

const removeHeaderFromItemNames = () => {
  const headerPattern = new RegExp(/^(?:\[x?\])?[# ]+/gm)
  items.value.forEach(item => {
    let match = item.name.match(headerPattern)
    if (!match) { return }
    match = match[0].replace('[] ', '').replace('[x] ', '')
    const newName = item.name.replace(match, '')
    if (newName !== item.name) { updateBox(item, { name: newName }) }
  })
}
const toggleHeader = async (pattern) => {
  const matches = itemsWithPattern(pattern)
  const shouldPrepend = matches.length < items.value.length
  removeHeaderFromItemNames()
  if (shouldPrepend) {
    await nextTick()
    prependToItemNames(pattern)
  }
}
const toggleFontPickerIsVisible = () => {
  const isVisible = state.fontPickerIsVisible
  closeDialogs()
  state.fontPickerIsVisible = !isVisible
}
const updateHeaderFont = (font) => {
  props.boxes.forEach(box => updateBox(box, { headerFontId: font.id }))
  userStore.updateUser({ prevHeaderFontId: font.id })
}
const udpateHeaderFontSize = (size) => {
  props.boxes.forEach(box => updateBox(box, { headerFontSize: size }))
}

// lock

const isLocked = computed(() => items.value.every(item => item.isLocked))
const lockedIsDisabled = computed(() => items.value.every(item => item.listId))
const toggleIsLocked = () => {
  const value = !isLocked.value
  items.value.filter(item => !item.listId).forEach(item => {
    updateBox(item, { isLocked: value })
  })
}

// box

const updateBox = (box, updates) => {
  boxStore.updateBox({ id: box.id, ...updates })
}
</script>

<template lang="pug">
section.subsection.style-actions(
  v-if="props.boxes.length"
  @click.left.stop="closeDialogs"
  :class="colorClasses"
  @pointerover="updateIsHover(true)"
  @pointerleave="updateIsHover(false)"
)
  template(v-if="props.visible")
    p.subsection-vertical-label(v-if="labelIsVisible" :style="{ background: background }")
      span {{ label }}
    .row
      //- h1/h2
      .button-wrap.header-buttons-wrap(:class="{ 'header-is-active': isHeaderSelected }")
        .segmented-buttons
          button(:disabled="!canEditAll" @click="toggleHeader('h1Pattern')" :class="{ active: isH1 }" title="Header 1")
            span h1
          button(:disabled="!canEditAll" @click="toggleHeader('h2Pattern')" :class="{ active: isH2 }" title="Header 2")
            span h2
        //- Fonts
        button.toggle-fonts-button.small-button(:disabled="!canEditAll" v-if="isHeaderSelected" @click.stop="toggleFontPickerIsVisible" :class="{ active: state.fontPickerIsVisible }")
          span Aa
        FontPicker(:visible="state.fontPickerIsVisible" :boxes="boxes" @selectFont="updateHeaderFont" @selectFontSize="udpateHeaderFontSize")
      //- Color
      .button-wrap(v-if="!colorIsHidden" @click.left.stop="toggleColorPickerIsVisible")
        button.change-color(:disabled="!canEditAll" :class="{active: state.colorPickerIsVisible}" title="Color")
          .current-color(:style="{ background: color }")
        ColorPicker(
          :currentColor="color"
          :visible="state.colorPickerIsVisible"
          :removeIsVisible="false"
          :recentColors="itemColors"
          @selectedColor="updateColor"
        )
      //- Box Fill
      .segmented-buttons
        button(:class="{active: boxFillIsFilled}" @click="updateBoxFill('filled')" title="Solid Fill Box")
          img.icon.box-icon(src="@/assets/box-filled.svg")
        button(:class="{active: boxFillIsEmpty}" @click="updateBoxFill('empty')" title="No Fill Box")
          img.icon.box-icon(src="@/assets/box-empty.svg")
      //- Lock
      .button-wrap
        button(:disabled="!canEditAll || lockedIsDisabled" @click="toggleIsLocked" :class="{active: isLocked}" title="Lock to Background")
          img.icon(src="@/assets/lock.svg")

  template(v-else)
    .subsection-horizontal-label(@click="toggleShouldShowMultipleSelectedBoxActions")
      span {{ label }}

  .collapse-expand-button-wrap.inline-button-wrap(v-if="props.collapseExpandIsVisible" @click="toggleShouldShowMultipleSelectedBoxActions" title="Toggle Box Options")
    button.small-button.inline-button(:class="{active: shouldShowMultipleSelectedBoxActions || isHoverVisible}")
      img.icon.down-arrow(src="@/assets/down-arrow.svg")
</template>

<style lang="stylus" scoped>
.style-actions
  position relative
  padding var(--subsection-padding)
  background-color transparent
  border 1px solid var(--primary-border)
  &.is-background-light
    border-color var(--primary-border-on-light-background)
  &.is-background-dark
    border-color var(--primary-border-on-dark-background)

  .row
    max-width 203px
    display block
    margin-bottom -6px
    margin-top 0
  .button-wrap,
  .segmented-buttons
    margin-left 0
    margin-right 4px
    vertical-align top
    margin-bottom var(--subsection-padding)
  .segmented-buttons
    display inline-flex
  .header-buttons-wrap
    margin 0
    &.header-is-active
      margin-bottom 12px
      .segmented-buttons
        button
          border-bottom-left-radius 0
          border-bottom-right-radius 0
  .toggle-fonts-button
    position absolute
    bottom -9px
    left 0
    border-top-left-radius 0
    border-top-right-radius 0
    width calc(100% - 4px)
    text-align center
    span
      font-size 15px
      vertical-align initial

  .subsection-horizontal-label
    cursor pointer
    margin-bottom 0
</style>
