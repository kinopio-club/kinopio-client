<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useAnalyticsStore } from '@/stores/useAnalyticsStore'
import { useThemeStore } from '@/stores/useThemeStore'

import TagPickerStyleActions from '@/components/dialogs/TagPickerStyleActions.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import FontPicker from '@/components/dialogs/FontPicker.vue'
import FramePicker from '@/components/dialogs/FramePicker.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'

import uniq from 'lodash-es/uniq'
import { nanoid } from 'nanoid'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const connectionStore = useConnectionStore()
const boxStore = useBoxStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const analyticsStore = useAnalyticsStore()
const themeStore = useThemeStore()

let unsubscribes

onMounted(() => {
  updateDefaultColor(utils.cssVariable('secondary-background'))

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerCloseChildDialogs' && props.visible) {
        const shouldPreventEmit = true
        closeDialogs(shouldPreventEmit)
      } else if (name === 'triggerSelectedCardsContainInBox') {
        containItemsInNewBox()
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

const emit = defineEmits(['closeDialogs'])

const props = defineProps({
  visible: Boolean,
  labelIsVisible: Boolean,
  tagsInCard: Array,
  backgroundColor: String,
  backgroundColorIsFromTheme: Boolean,
  cards: {
    type: Array,
    default () { return [] }
  }
})

const state = reactive({
  tagPickerIsVisible: false,
  colorPickerIsVisible: false,
  fontPickerIsVisible: false,
  framePickerIsVisible: false,
  defaultColor: '#e3e3e3'
})

const canEditSpace = computed(() => userStore.getUserCanEditSpace)
const canOnlyComment = computed(() => userStore.getUserIsCommentOnly)
const isSpaceMember = computed(() => userStore.getUserIsSpaceMember)

const canEditAll = computed(() => {
  if (isSpaceMember.value) { return true }
  const editableCards = props.cards.filter(card => userStore.getUserCanEditCard(card))
  return editableCards.length === props.cards.length
})

const isNotCollaborator = computed(() => {
  if (canOnlyComment.value) { return true }
  return !canEditAll.value
})

const updateDefaultColor = (color) => {
  state.defaultColor = color
}

const cardIds = computed(() => props.cards.map(card => card.id))
const isSingleCard = computed(() => props.cards.length === 1)
const isBoxDetails = computed(() => Boolean(globalStore.boxDetailsIsVisibleForBoxId))

// utils

const closeDialogs = (shouldPreventEmit) => {
  state.tagPickerIsVisible = false
  state.colorPickerIsVisible = false
  state.fontPickerIsVisible = false
  state.framePickerIsVisible = false
  globalStore.userDetailsIsVisible = false
  if (shouldPreventEmit === true) { return }
  emit('closeDialogs')
}

// items (cards only)

const items = computed(() => {
  return props.cards.map(card => ({ ...card, isCard: true }))
})

const label = 'CARD'

// update name

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
  updateName(item, newName)
}
const prependToItemNames = (pattern) => {
  items.value.forEach(item => {
    const name = normalizedName(item.name) || ''
    if (utils.markdown()[pattern].exec(name)) { return }
    prependToName({ pattern, item, nameSegment: name })
  })
}
const updateName = (item, newName) => {
  const card = cardStore.getCard(item.id)
  cardStore.updateCard({ id: card.id, name: newName })
}

// tag

const tagNamesInCard = computed(() => {
  if (!props.tagsInCard) { return }
  return props.tagsInCard.map(tag => tag.name)
})
const toggleTagPickerIsVisible = () => {
  const isVisible = state.tagPickerIsVisible
  closeDialogs()
  state.tagPickerIsVisible = !isVisible
}

// contain items in box

const containItemsInNewBox = async () => {
  if (isNotCollaborator.value) { return }
  const rect = utils.boundaryRectFromItems(items.value)
  const padding = consts.spaceBetweenCards
  const paddingTop = 30 + padding
  const box = {
    id: nanoid(),
    x: rect.x - padding,
    y: rect.y - paddingTop,
    resizeWidth: rect.width + (padding * 2),
    resizeHeight: rect.height + (padding + paddingTop)
  }
  boxStore.createBox(box)
  globalStore.closeAllDialogs()
  await nextTick()
  await nextTick()
  globalStore.updateBoxDetailsIsVisibleForBoxId(box.id)
  analyticsStore.event('containItemsInNewBox')
}

// color

const color = computed(() => {
  const colors = items.value.map(item => item.backgroundColor).filter(Boolean)
  const itemsHaveColors = colors.length === items.value.length
  const colorsAreEqual = uniq(colors).length === 1
  if (itemsHaveColors && colorsAreEqual) return colors[0]
  return state.defaultColor
})
const background = computed(() => props.backgroundColor || color.value)
const itemColors = computed(() => spaceStore.getSpaceItemColors.card)
const updateColor = (color) => {
  items.value.forEach(item => {
    if (item.backgroundColor === color) { return }
    updateCard(item, { backgroundColor: color })
  })
}
const removeColor = () => {
  items.value.forEach(item => updateCard(item, { backgroundColor: null }))
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

// frames

const isFrames = computed(() => {
  const cards = props.cards.filter(card => card.frameId)
  return cards.length === props.cards.length
})
const toggleFramePickerIsVisible = () => {
  const isVisible = state.framePickerIsVisible
  closeDialogs()
  state.framePickerIsVisible = !isVisible
}

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
    if (newName !== item.name) { updateName(item, newName) }
  })
}
const toggleHeader = async (pattern) => {
  await updateCardDimensions()
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
const updateHeaderFont = async (font) => {
  props.cards.forEach(card => updateCard(card, { headerFontId: font.id }))
  userStore.updateUser({ prevHeaderFontId: font.id })
  await nextTick()
  connectionStore.updateConnectionPathsByItemIds(cardIds.value)
}
const udpateHeaderFontSize = async (size) => {
  props.cards.forEach(card => updateCard(card, { headerFontSize: size }))
  await nextTick()
  connectionStore.updateConnectionPathsByItemIds(cardIds.value)
}

// lock

const isLocked = computed(() => {
  return items.value.every(item => item.isLocked)
})
const lockedIsDisabled = computed(() => {
  return items.value.every(item => item.listId)
})
const toggleIsLocked = () => {
  const value = !isLocked.value
  items.value.filter(item => !item.listId).forEach(item => {
    updateCard(item, { isLocked: value })
  })
}

// comment

const isComment = computed(() => {
  return props.cards.every(card => card.isComment)
})
const toggleIsComment = async () => {
  if (isNotCollaborator.value) { return }
  const value = !isComment.value
  props.cards.forEach(card => {
    const update = {
      id: card.id,
      name: utils.nameWithoutCommentPattern(card.name),
      isComment: value
    }
    if (!card.name) { delete update.name }
    cardStore.updateCard(update)
  })
  await nextTick()
  await updateCardDimensions()
  connectionStore.updateConnectionPathsByItemIds(cardIds.value)
}

// vote counter

const countersIsVisible = computed(() => {
  return props.cards.every(card => card.counterIsVisible)
})
const toggleCounterIsVisible = () => {
  const counterIsVisible = !countersIsVisible.value
  props.cards.forEach(card => {
    cardStore.updateCard({
      id: card.id,
      counterIsVisible,
      counterValue: card.counterValue || 1
    })
  })
}

// card

const updateCardDimensions = async () => {
  await nextTick()
  setTimeout(async () => {
    cardStore.updateCardsDimensions(cardIds.value)
    await nextTick()
    await nextTick()
  }, 10)
}
const updateCard = async (card, updates) => {
  const update = { id: card.id, ...updates }
  cardStore.updateCard(update)
  await updateCardDimensions()
  connectionStore.updateConnectionPathByItemId(card.id)
}
</script>

<template lang="pug">
section.subsection.style-actions(
  v-if="props.visible"
  @click.left.stop="closeDialogs"
  :class="colorClasses"
)
  p.subsection-vertical-label(v-if="labelIsVisible" :style="{ background: background }")
    span {{ label }}
  .row
    //- h1/h2
    .button-wrap.header-buttons-wrap(:class="{ 'header-is-active': isHeaderSelected, 'is-box-details': isBoxDetails }")
      .segmented-buttons
        button(:disabled="!canEditAll" @click="toggleHeader('h1Pattern')" :class="{ active: isH1 }" title="Header 1")
          span h1
        button(:disabled="!canEditAll" @click="toggleHeader('h2Pattern')" :class="{ active: isH2 }" title="Header 2")
          span h2
      //- Fonts
      button.toggle-fonts-button.small-button(:disabled="!canEditAll" v-if="isHeaderSelected" @click.stop="toggleFontPickerIsVisible" :class="{ active: state.fontPickerIsVisible }")
        span Aa
      FontPicker(:visible="state.fontPickerIsVisible" :cards="cards" @selectFont="updateHeaderFont" @selectFontSize="udpateHeaderFontSize")
    //- Tag
    .button-wrap
      button(:disabled="!canEditAll" @click.left.stop="toggleTagPickerIsVisible" :class="{ active: state.tagPickerIsVisible }")
        span Tag
      TagPickerStyleActions(:visible="state.tagPickerIsVisible" :cards="cards" :tagNamesInCard="tagNamesInCard")
    //- Frame
    .button-wrap
      button(:disabled="!canEditAll" @click.left.stop="toggleFramePickerIsVisible" :class="{ active: state.framePickerIsVisible || isFrames }")
        span Frame
      FramePicker(:visible="state.framePickerIsVisible" :cards="cards")
    //- Color
    .button-wrap(@click.left.stop="toggleColorPickerIsVisible")
      button.change-color(:disabled="!canEditAll" :class="{active: state.colorPickerIsVisible}" title="Color")
        .current-color(:style="{ background: color }")
      ColorPicker(
        :currentColor="color"
        :visible="state.colorPickerIsVisible"
        :removeIsVisible="true"
        :recentColors="itemColors"
        @selectedColor="updateColor"
        @removeColor="removeColor"
      )
    //- Lock
    .button-wrap
      button(:disabled="!canEditAll || lockedIsDisabled" @click="toggleIsLocked" :class="{active: isLocked}" title="Lock to Background")
        img.icon(src="@/assets/lock.svg")
    //- Comment
    .button-wrap(title="Turn into Comment")
      button(:disabled="isNotCollaborator" @click="toggleIsComment" :class="{active: isComment}")
        img.icon.comment(src="@/assets/comment.svg")
    //- Surround with Box
    .button-wrap(title="Surround with Box (B)")
      button(:disabled="isNotCollaborator" @click="containItemsInNewBox")
        img.icon.box-icon(src="@/assets/box.svg")
    //- Counter
    .button-wrap
      button(:class="{active: countersIsVisible}" :disabled="!canEditSpace" @click="toggleCounterIsVisible" title="Counter")
        span Vote
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
      &.is-box-details
        margin-bottom 20px
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
</style>
