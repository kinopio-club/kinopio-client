<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import FramePicker from '@/components/dialogs/FramePicker.vue'
import TagPickerStyleActions from '@/components/dialogs/TagPickerStyleActions.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import FontPicker from '@/components/dialogs/FontPicker.vue'
import utils from '@/utils.js'

import uniq from 'lodash-es/uniq'
import { nanoid } from 'nanoid'

const store = useStore()

onMounted(() => {
  store.subscribe((mutation, state) => {
    const { type } = mutation
    if (type === 'triggerCloseChildDialogs' && props.visible) {
      const shouldPreventEmit = true
      closeDialogs(shouldPreventEmit)
    } else if (type === 'triggerSelectedCardsContainInBox') {
      containItemsInNewBox()
    } else if (type === 'triggerUpdateTheme') {
      updateDefaultColor(utils.cssVariable('secondary-background'))
    }
  })
  updateDefaultColor(utils.cssVariable('secondary-background'))
})

const emit = defineEmits(['closeDialogs'])

const props = defineProps({
  visible: Boolean,
  colorIsHidden: Boolean,
  labelIsVisible: Boolean,
  tagsInCard: Array,
  backgroundColor: String,
  cards: {
    type: Array,
    default (value) {
      return []
    }
  },
  boxes: {
    type: Array,
    default (value) {
      return []
    }
  }
})
const state = reactive({
  framePickerIsVisible: false,
  tagPickerIsVisible: false,
  colorPickerIsVisible: false,
  fontPickerIsVisible: false,
  defaultColor: '#e3e3e3'
})

const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const isSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())
const canEditAll = computed(() => {
  if (isSpaceMember.value) { return true }
  const editableCards = props.cards.filter(card => store.getters['currentUser/canEditCard'](card))
  const canEditCards = editableCards.length === props.cards.length
  const editableBoxes = props.boxes.filter(box => store.getters['currentUser/canEditBox'](box))
  const canEditBoxes = editableBoxes.length === props.boxes.length
  return canEditCards && canEditBoxes
})
const updateDefaultColor = (color) => {
  state.defaultColor = color
}
const closeDialogs = (shouldPreventEmit) => {
  state.framePickerIsVisible = false
  state.tagPickerIsVisible = false
  state.colorPickerIsVisible = false
  state.fontPickerIsVisible = false
  store.commit('userDetailsIsVisible', false)
  if (shouldPreventEmit === true) { return }
  emit('closeDialogs')
}

// items

const isCards = computed(() => Boolean(props.cards.length))
const isSingleCard = computed(() => props.cards.length === 1 && !isBoxes.value)
const isBoxes = computed(() => Boolean(props.boxes.length))
const items = computed(() => {
  let cards = utils.clone(props.cards)
  let boxes = utils.clone(props.boxes)
  cards = cards.map(card => {
    card.isCard = true
    return card
  })
  boxes = boxes.map(box => {
    box.isBox = true
    return box
  })
  return cards.concat(boxes)
})
const label = computed(() => {
  let label, cardLabel, boxLabel
  const isMultipleCards = props.cards.length > 1
  const isMultipleBoxes = props.boxes.length > 1
  if (isCards.value) {
    cardLabel = 'card'
  }
  if (isMultipleCards) {
    cardLabel = 'cards'
  }
  if (isBoxes.value) {
    boxLabel = 'box'
  }
  if (isMultipleBoxes) {
    boxLabel = 'boxes'
  }
  if (cardLabel && boxLabel) {
    label = `${cardLabel} + ${boxLabel}`
  } else {
    label = cardLabel || boxLabel
  }
  return label.toUpperCase()
})
const isBoxDetails = computed(() => Boolean(store.state.boxDetailsIsVisibleForBoxId))

// update name

const itemsWithPattern = (pattern) => {
  return items.value.filter(item => {
    const name = normalizedName(item.name)
    const result = utils.markdown()[pattern].exec(name)
    return Boolean(result)
  })
}
const normalizedName = (name) => {
  name = utils.removeMarkdownCodeblocksFromString(name) || ''
  const urls = utils.urlsFromString(name) || []
  urls.forEach(url => {
    name = name.replace(url, '')
  })
  const tags = utils.tagsFromString(name) || []
  tags.forEach(tag => {
    name = name.replace(tag, '')
  })
  const checkbox = utils.checkboxFromString(name) || ''
  name = name.replace(checkbox, '')
  name = name.trim()
  return name
}
const removePattern = (pattern) => {
  if (pattern === 'h1Pattern') {
    return 'h2Pattern'
  } else if (pattern === 'h2Pattern') {
    return 'h1Pattern'
  }
}
const markdown = (pattern) => {
  if (pattern === 'h1Pattern') {
    return '# '
  } else if (pattern === 'h2Pattern') {
    return '## '
  }
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
    let patternExists = utils.markdown()[pattern].exec(name)
    if (patternExists) {
      return // skip
    }
    prependToName({ pattern, item, nameSegment: name })
  })
}
const updateName = async (item, newName) => {
  if (item.isCard) {
    const card = store.getters['currentCards/byId'](item.id)
    store.dispatch('currentCards/updateName', { card, newName })
    await nextTick()
    await nextTick()
    store.dispatch('currentConnections/updatePaths', { cardId: card.id })
  }
  if (item.isBox) {
    const box = store.getters['currentBoxes/byId'](item.id)
    store.dispatch('currentBoxes/updateName', { box, newName })
  }
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
  let box = utils.boundaryRectFromItems(items.value)
  // add box margins
  const margin = 20
  box = {
    id: nanoid(),
    x: box.x - margin,
    resizeWidth: box.width + (margin * 2),
    y: box.y - (margin * 2.5),
    resizeHeight: box.height + (margin * 3.5)
  }
  store.dispatch('currentBoxes/add', { box })
  store.dispatch('closeAllDialogs')
  await nextTick()
  await nextTick()
  store.commit('boxDetailsIsVisibleForBoxId', box.id)
}
const boxSurroundTitle = computed(() => {
  if (isNotCollaborator.value) {
    return 'Only collaborators can add boxes'
  } else {
    return 'Surround with Box'
  }
})

// box fill

const boxFillIsEmpty = computed(() => {
  const numberOfBoxes = props.boxes.length
  const boxes = props.boxes.filter(box => box.fill === 'empty')
  return boxes.length === numberOfBoxes
})
const boxFillIsFilled = computed(() => {
  const numberOfBoxes = props.boxes.length
  const boxes = props.boxes.filter(box => box.fill === 'filled')
  return boxes.length === numberOfBoxes
})
const updateBoxFill = (fill) => {
  props.boxes.forEach(box => {
    updateBox(box, { fill })
  })
}

// color

const color = computed(() => {
  let colors = items.value.map(item => item.backgroundColor || item.color)
  colors = colors.filter(color => Boolean(color))
  const itemsHaveColors = colors.length === items.value.length
  const colorsAreEqual = uniq(colors).length === 1
  if (itemsHaveColors && colorsAreEqual) {
    return colors[0]
  } else {
    return state.defaultColor
  }
})
const background = computed(() => {
  return props.backgroundColor || color.value
})
const itemColors = computed(() => store.getters['currentSpace/itemColors'])
const updateColor = (color) => {
  items.value.forEach(item => {
    const currentColor = item.backgroundColor || item.color
    if (currentColor === color) { return }
    if (item.isCard) {
      updateCard(item, { backgroundColor: color })
    } else if (item.isBox) {
      if (color === 'transparent') { return }
      updateBox(item, { color })
    }
  })
}
const removeColor = () => {
  items.value.forEach(item => {
    if (item.isCard) {
      updateCard(item, { backgroundColor: null })
    }
  })
}
const toggleColorPickerIsVisible = () => {
  const isVisible = state.colorPickerIsVisible
  closeDialogs()
  state.colorPickerIsVisible = !isVisible
}

// frames

const isFrames = computed(() => {
  const cards = props.cards.filter(card => card.frameId)
  return Boolean(cards.length === props.cards.length)
})
const toggleFramePickerIsVisible = () => {
  const isVisible = state.framePickerIsVisible
  closeDialogs()
  state.framePickerIsVisible = !isVisible
}

// header h1 h2

const isH1 = computed(() => {
  let pattern = 'h1Pattern'
  let matches = itemsWithPattern(pattern)
  return Boolean(matches.length)
})
const isH2 = computed(() => {
  let pattern = 'h2Pattern'
  let matches = itemsWithPattern(pattern)
  return Boolean(matches.length)
})
const isH3 = computed(() => {
  let pattern = 'h3Pattern'
  let matches = itemsWithPattern(pattern)
  return Boolean(matches.length)
})
const isHeaderSelected = computed(() => {
  return isH1.value || isH2.value || isH3.value
})
const removeHeaderFromItemNames = () => {
  // https://regexr.com/804qh
  // ignores [] or [x] + space at beginning of string
  // matches # or ## + space
  const headerPattern = new RegExp(/^(?:\[x?\])?[# ]+/gm)
  items.value.forEach(item => {
    let match = item.name.match(headerPattern)
    if (!match) { return }
    match = match[0]
    match = match.replace('[] ', '')
    match = match.replace('[x] ', '')
    const newName = item.name.replace(match, '')
    if (newName === item.name) { return }
    updateName(item, newName)
  })
}
const toggleHeader = async (pattern) => {
  await updateCardDimensions()
  let matches = itemsWithPattern(pattern)
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
  props.cards.forEach(card => {
    updateCard(card, { headerFontId: font.id })
  })
  props.boxes.forEach(box => {
    updateBox(box, { headerFontId: font.id })
  })
  store.dispatch('currentUser/update', { prevHeaderFontId: font.id })
  await nextTick()
  store.dispatch('currentConnections/updateMultiplePaths', props.cards)
}
const udpateHeaderFontSize = async (size) => {
  props.cards.forEach(card => {
    updateCard(card, { headerFontSize: size })
  })
  props.boxes.forEach(box => {
    updateBox(box, { headerFontSize: size })
  })
  await nextTick()
  store.dispatch('currentConnections/updateMultiplePaths', props.cards)
}

// lock

const isLocked = computed(() => {
  const matches = items.value.filter(item => item.isLocked)
  return Boolean(matches.length === items.value.length)
})
const toggleIsLocked = () => {
  const value = !isLocked.value
  items.value.forEach(item => {
    if (item.isCard) {
      updateCard(item, { isLocked: value })
    }
    if (item.isBox) {
      updateBox(item, { isLocked: value })
    }
  })
}

// comment

const canOnlyComment = computed(() => store.getters['currentUser/canOnlyComment']())
const isNotCollaborator = computed(() => {
  if (canOnlyComment.value) { return true }
  return !canEditAll.value
})
const isComment = computed(() => {
  const cards = props.cards.filter(card => card.isComment)
  return Boolean(cards.length === props.cards.length)
})
const toggleIsComment = async () => {
  if (isNotCollaborator.value) { return }
  const value = !isComment.value
  props.cards.forEach(card => {
    card = {
      id: card.id,
      name: utils.nameWithoutCommentPattern(card.name),
      isComment: value
    }
    if (!card.name) {
      delete card.name
    }
    store.dispatch('currentCards/update', { card })
  })
  await nextTick()
  await updateCardDimensions()
  store.dispatch('currentConnections/updateMultiplePaths', props.cards)
}
const commentTitle = computed(() => {
  if (isNotCollaborator.value) {
    return 'Only collaborators can toggle comments'
  } else {
    return 'Turn into Comment'
  }
})

// vote counter

const countersIsVisible = computed(() => {
  const cards = props.cards.filter(card => card.counterIsVisible)
  return Boolean(cards.length === props.cards.length)
})
const toggleCounterIsVisible = () => {
  let counterIsVisible = true
  if (countersIsVisible.value) {
    counterIsVisible = false
  }
  props.cards.forEach(card => {
    card = {
      id: card.id,
      counterIsVisible,
      counterValue: card.counterValue || 1
    }
    store.dispatch('currentCards/update', { card })
  })
}

// card

const updateCardDimensions = async () => {
  await nextTick()
  store.dispatch('currentCards/updateDimensions', { cards: props.cards })
  await nextTick()
  await nextTick()
}
const updateCard = async (card, updates) => {
  const keys = Object.keys(updates)
  card = { id: card.id }
  keys.forEach(key => {
    card[key] = updates[key]
  })
  store.dispatch('currentCards/update', { card })
  await updateCardDimensions()
  store.dispatch('currentConnections/updatePaths', { cardId: card.id })
}

// box

const updateBox = (box, updates) => {
  const keys = Object.keys(updates)
  box = { id: box.id }
  keys.forEach(key => {
    box[key] = updates[key]
  })
  store.dispatch('currentBoxes/update', box)
}
</script>

<template lang="pug">
section.subsection.style-actions(v-if="visible" @click.left.stop="closeDialogs")
  p.subsection-vertical-label(v-if="labelIsVisible" :style="{ background: background }")
    span {{label}}
  .row
    //- h1/h2
    .button-wrap.header-buttons-wrap(:class="{ 'header-is-active': isHeaderSelected, 'is-box-details': isBoxDetails }")
      .segmented-buttons
        button(:disabled="!canEditAll" @click="toggleHeader('h1Pattern')" :class="{ active: isH1 }" title="Header 1")
          span h1
        button(:disabled="!canEditAll" @click="toggleHeader('h2Pattern')" :class="{ active: isH2 }" title="Header 2")
          span h2
      //- Fonts
      button.toggle-fonts-button.small-button(v-if="isHeaderSelected" @click.stop="toggleFontPickerIsVisible" :class="{ active: state.fontPickerIsVisible }")
        span Fonts
      FontPicker(:visible="state.fontPickerIsVisible" :cards="cards" :boxes="boxes" @selectFont="updateHeaderFont" @selectFontSize="udpateHeaderFontSize")
    //- Tag
    .button-wrap(v-if="isCards")
      button(:disabled="!canEditAll" @click.left.stop="toggleTagPickerIsVisible" :class="{ active: state.tagPickerIsVisible }")
        span Tag
      TagPickerStyleActions(:visible="state.tagPickerIsVisible" :cards="cards" :tagNamesInCard="tagNamesInCard")
    //- Frame
    .button-wrap(v-if="isCards")
      button(:disabled="!canEditAll" @click.left.stop="toggleFramePickerIsVisible" :class="{ active : state.framePickerIsVisible || isFrames }")
        span Frame
      FramePicker(:visible="state.framePickerIsVisible" :cards="cards")
    //- Color
    .button-wrap(v-if="!colorIsHidden" @click.left.stop="toggleColorPickerIsVisible")
      button.change-color(:disabled="!canEditAll" :class="{active: state.colorPickerIsVisible}" title="Color")
        .current-color(:style="{ background: color }")
      ColorPicker(
        :currentColor="color"
        :visible="state.colorPickerIsVisible"
        :removeIsVisible="isCards"
        :recentColors="itemColors"
        @selectedColor="updateColor"
        @removeColor="removeColor"
      )
    //- Box Fill
    .segmented-buttons(v-if="isBoxes")
      button(:class="{active: boxFillIsFilled}" @click="updateBoxFill('filled')" title="Solid Fill Box")
        img.icon.box-icon(src="@/assets/box-filled.svg")
      button(:class="{active: boxFillIsEmpty}" @click="updateBoxFill('empty')" title="No Fill Box")
        img.icon.box-icon(src="@/assets/box-empty.svg")

    //- Lock
    .button-wrap
      button(:disabled="!canEditAll" @click="toggleIsLocked" :class="{active: isLocked}" title="Lock to Background")
        img.icon(src="@/assets/lock.svg")
    //- Comment
    .button-wrap(v-if="isCards" :title="commentTitle")
      button(:disabled="isNotCollaborator" @click="toggleIsComment" :class="{active: isComment}")
        img.icon.comment(src="@/assets/comment.svg")
    //- Surround with Box
    .button-wrap(v-if="isCards" :title="boxSurroundTitle")
      button(:disabled="isNotCollaborator" @click="containItemsInNewBox")
        img.icon.box-icon(src="@/assets/box.svg")

    //- Counter
    .button-wrap(v-if="isCards")
      button(:class="{active: countersIsVisible}" :disabled="!canEditSpace" @click="toggleCounterIsVisible" title="Counter")
        span Vote
</template>

<style lang="stylus" scoped>
.style-actions
  position relative
  padding var(--subsection-padding)
  padding-bottom 0
  background-color transparent
  &.subsection
    border 1px solid var(--primary-border)
    padding var(--subsection-padding)
    padding-bottom 0
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
    margin-bottom 10px
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
</style>
