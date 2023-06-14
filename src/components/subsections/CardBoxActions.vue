<template lang="pug">
section.subsection.style-actions(v-if="visible" @click.left.stop="closeDialogs")
  .row
    //- h1/h2
    .segmented-buttons
      button(:disabled="!canEditAll" @click="toggleHeader('h1Pattern')" :class="{ active: isH1 }" title="Header 1")
        span h1
      button(:disabled="!canEditAll" @click="toggleHeader('h2Pattern')" :class="{ active: isH2 }" title="Header 2")
          span h2
    //- Tag
    .button-wrap(v-if="isCards")
      button(:disabled="!canEditAll" @click.left.stop="toggleTagPickerIsVisible" :class="{ active: tagPickerIsVisible }")
        span Tag
      TagPickerStyleActions(:visible="tagPickerIsVisible" :cards="cards" :tagNamesInCard="tagNamesInCard")
    //- Frame
    .button-wrap(v-if="isCards")
      button(:disabled="!canEditAll" @click.left.stop="toggleFramePickerIsVisible" :class="{ active : framePickerIsVisible || isFrames }")
        span Frame
      FramePicker(:visible="framePickerIsVisible" :cards="cards")
    //- Color
    .button-wrap(v-if="!colorIsHidden" @click.left.stop="toggleColorPickerIsVisible")
      button.change-color(:disabled="!canEditAll" :class="{active: colorPickerIsVisible}" title="Color")
        .current-color(:style="{ background: color }")
      ColorPicker(
        :currentColor="color"
        :visible="colorPickerIsVisible"
        :removeIsVisible="isCards"
        :recentColors="itemColors"
        :defaultCardColorIsVisible="true"
        @selectedColor="updateColor"
        @removeColor="removeColor"
      )
    //- Box Fill
    .segmented-buttons(v-if="isBoxes")
      button(:class="{active: boxFillIsFilled}" @click="updateBoxFill('filled')" :disabled="isDisabled" title="Solid Fill")
        img.icon.box-icon(src="@/assets/box-filled.svg")
      button(:class="{active: boxFillIsEmpty}" @click="updateBoxFill('empty')" :disabled="isDisabled" title="No Fill")
        img.icon.box-icon(src="@/assets/box-empty.svg")

    //- Lock
    .button-wrap
      button(:disabled="!canEditAll" @click="toggleIsLocked" :class="{active: isLocked}" title="Lock Card to Background")
        img.icon(src="@/assets/lock.svg")
    //- Comment
    .button-wrap(v-if="isCards")
      button(:disabled="!canEditAll" @click="toggleIsComment" :class="{active: isComment}" title="Turn into Comment")
        img.icon(src="@/assets/comment.svg")

    //- Surround with Box
    .button-wrap(v-if="isCards")
      button(:disabled="!canEditSpace" @click="containItemsInNewBox" title="Surround with Box")
        img.icon.box-icon(src="@/assets/box.svg")

    //- Counter
    .button-wrap(v-if="isCards")
      button(:class="{active: countersIsVisible}" :disabled="!canEditSpace" @click="toggleCounterIsVisible" title="Counter")
        img.icon.add(src="@/assets/add.svg")
        span.counter-label 1

</template>

<script>
import FramePicker from '@/components/dialogs/FramePicker.vue'
import TagPickerStyleActions from '@/components/dialogs/TagPickerStyleActions.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import utils from '@/utils.js'

import uniq from 'lodash-es/uniq'
import { nanoid } from 'nanoid'

export default {
  name: 'StyleActions',
  components: {
    FramePicker,
    TagPickerStyleActions,
    ColorPicker
  },
  props: {
    visible: Boolean,
    isDisabled: Boolean,
    colorIsHidden: Boolean,
    tagsInCard: Array,
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
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      const { type } = mutation
      if (type === 'triggerCardDetailsCloseDialogs' && this.visible) {
        const shouldPreventEmit = true
        this.closeDialogs(shouldPreventEmit)
      } else if (type === 'triggerSelectedCardsContainInBox') {
        this.containItemsInNewBox()
      } else if (type === 'triggerUpdateTheme') {
        this.defaultColor = utils.cssVariable('secondary-background')
      }
    })
  },
  mounted () {
    this.defaultColor = utils.cssVariable('secondary-background')
  },
  data () {
    return {
      framePickerIsVisible: false,
      tagPickerIsVisible: false,
      colorPickerIsVisible: false,
      defaultColor: '#e3e3e3'
    }
  },
  computed: {
    tagNamesInCard () {
      if (!this.tagsInCard) { return }
      return this.tagsInCard.map(tag => tag.name)
    },
    isCards () { return Boolean(this.cards.length) },
    isSingleCard () { return this.cards.length === 1 && !this.isBoxes },
    isBoxes () { return Boolean(this.boxes.length) },
    items () {
      let cards = utils.clone(this.cards)
      let boxes = utils.clone(this.boxes)
      cards = cards.map(card => {
        card.isCard = true
        return card
      })
      boxes = boxes.map(box => {
        box.isBox = true
        return box
      })
      return cards.concat(boxes)
    },
    boxFillIsEmpty () {
      const numberOfBoxes = this.boxes.length
      const boxes = this.boxes.filter(box => box.fill === 'empty')
      return boxes.length === numberOfBoxes
    },
    boxFillIsFilled () {
      const numberOfBoxes = this.boxes.length
      const boxes = this.boxes.filter(box => box.fill === 'filled')
      return boxes.length === numberOfBoxes
    },
    color () {
      let colors = this.items.map(item => item.backgroundColor || item.color)
      colors = colors.filter(color => Boolean(color))
      const itemsHaveColors = colors.length === this.items.length
      const colorsAreEqual = uniq(colors).length === 1
      if (itemsHaveColors && colorsAreEqual) {
        return colors[0]
      } else {
        return this.defaultColor
      }
    },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    itemColors () { return this.$store.getters['currentSpace/itemColors'] },
    canEditAll () {
      if (this.isSpaceMember) { return true }
      const editableCards = this.cards.filter(card => this.$store.getters['currentUser/canEditCard'](card))
      const canEditCards = editableCards.length === this.cards.length
      const editableBoxes = this.boxes.filter(box => this.$store.getters['currentUser/canEditBox'](box))
      const canEditBoxes = editableBoxes.length === this.boxes.length
      return canEditCards && canEditBoxes
    },
    isFrames () {
      const cards = this.cards.filter(card => card.frameId)
      return Boolean(cards.length === this.cards.length)
    },
    isH1 () {
      const pattern = 'h1Pattern'
      const items = this.itemsWithPattern(pattern)
      return Boolean(items.length === this.items.length)
    },
    isH2 () {
      const pattern = 'h2Pattern'
      const items = this.itemsWithPattern(pattern)
      return Boolean(items.length === this.items.length)
    },
    isLocked () {
      const items = this.items.filter(item => item.isLocked)
      return Boolean(items.length === this.items.length)
    },
    isComment () {
      const cards = this.cards.filter(card => card.isComment)
      return Boolean(cards.length === this.cards.length)
    },
    countersIsVisible () {
      const cards = this.cards.filter(card => card.counterIsVisible)
      return Boolean(cards.length === this.cards.length)
    }
  },
  methods: {

    // items

    updateColor (color) {
      this.items.forEach(item => {
        const currentColor = item.backgroundColor || item.color
        if (currentColor === color) { return }
        if (item.isCard) {
          this.updateCard(item, { backgroundColor: color })
        } else if (item.isBox) {
          if (color === 'transparent') { return }
          this.updateBox(item, { color })
        }
      })
    },
    removeColor () {
      this.items.forEach(item => {
        if (item.isCard) {
          this.updateCard(item, { backgroundColor: null })
        }
      })
    },
    itemsWithPattern (pattern) {
      const items = this.items.filter(item => {
        const name = this.normalizedName(item.name)
        const result = utils.markdown()[pattern].exec(name)
        return Boolean(result)
      })
      return items
    },
    normalizedName (name) {
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
    },
    removePattern (pattern) {
      if (pattern === 'h1Pattern') {
        return 'h2Pattern'
      } else if (pattern === 'h2Pattern') {
        return 'h1Pattern'
      }
    },
    markdown (pattern) {
      if (pattern === 'h1Pattern') {
        return '# '
      } else if (pattern === 'h2Pattern') {
        return '## '
      }
    },
    toggleHeader (pattern) {
      this.updateCardDimensions()
      let items = this.itemsWithPattern(pattern)
      const shouldPrepend = items.length < this.items.length
      if (shouldPrepend) {
        const removePattern = this.removePattern(pattern)
        this.removeFromItemNames(removePattern)
        this.prependToItemNames(pattern)
      } else {
        this.removeFromItemNames(pattern)
      }
    },
    toggleIsLocked () {
      let isLocked = true
      if (this.isLocked) {
        isLocked = false
      }
      this.items.forEach(item => {
        if (item.isCard) {
          this.updateCard(item, { isLocked })
        }
        if (item.isBox) {
          this.updateBox(item, { isLocked })
        }
      })
    },
    prependToName ({ pattern, item, nameSegment }) {
      const markdown = this.markdown(pattern)
      let index = item.name.indexOf(nameSegment)
      if (index < 0) { index = 0 }
      const newName = utils.insertStringAtIndex(item.name, markdown, index)
      this.updateName(item, newName)
    },
    prependToItemNames (pattern) {
      this.items.forEach(item => {
        const name = this.normalizedName(item.name) || ''
        let patternExists = utils.markdown()[pattern].exec(name)
        if (patternExists) {
          return // skip
        }
        this.prependToName({ pattern, item, nameSegment: name })
      })
    },
    updateName (item, newName) {
      if (item.isCard) {
        const card = this.$store.getters['currentCards/byId'](item.id)
        this.$store.dispatch('currentCards/updateName', { card, newName })
      }
      if (item.isBox) {
        const box = this.$store.getters['currentBoxes/byId'](item.id)
        this.$store.dispatch('currentBoxes/updateName', { box, newName })
      }
    },
    removeFromItemNames (pattern) {
      const markdown = this.markdown(pattern)
      this.items.forEach(item => {
        const newName = item.name.replace(markdown, '')
        if (newName === item.name) { return }
        this.updateName(item, newName)
      })
    },
    toggleColorPickerIsVisible () {
      const isVisible = this.colorPickerIsVisible
      this.closeDialogs()
      this.colorPickerIsVisible = !isVisible
    },
    closeDialogs (shouldPreventEmit) {
      this.framePickerIsVisible = false
      this.tagPickerIsVisible = false
      this.colorPickerIsVisible = false
      this.$store.commit('userDetailsIsVisible', false)
      if (shouldPreventEmit === true) { return }
      this.$emit('closeDialogs')
    },

    // cards only

    updateCardDimensions () {
      const cards = utils.clone(this.cards)
      const cardIds = cards.map(card => card.id)
      this.$store.dispatch('currentCards/removeResize', { cardIds })
    },
    updateCard (card, updates) {
      const keys = Object.keys(updates)
      card = { id: card.id }
      keys.forEach(key => {
        card[key] = updates[key]
      })
      this.$store.dispatch('currentCards/update', card)
    },
    toggleFramePickerIsVisible () {
      const isVisible = this.framePickerIsVisible
      this.closeDialogs()
      this.framePickerIsVisible = !isVisible
    },
    toggleTagPickerIsVisible () {
      const isVisible = this.tagPickerIsVisible
      this.closeDialogs()
      this.tagPickerIsVisible = !isVisible
    },
    toggleIsComment () {
      this.updateCardDimensions()
      let isComment = true
      if (this.isComment) {
        isComment = false
      }
      this.cards.forEach(card => {
        card = {
          id: card.id,
          name: utils.nameWithoutCommentPattern(card.name),
          isComment
        }
        if (!card.name) {
          delete card.name
        }
        this.$store.dispatch('currentCards/update', card)
        this.$store.dispatch('currentCards/updateDimensions', { cards: [card] })
      })
    },
    containItemsInNewBox () {
      let box = utils.boundaryRectFromItems(this.items)
      // add box margins
      const margin = 20
      box = {
        id: nanoid(),
        x: box.x - margin,
        resizeWidth: box.width + (margin * 2),
        y: box.y - (margin * 2.5),
        resizeHeight: box.height + (margin * 3.5)
      }
      this.$store.dispatch('currentBoxes/add', { box })
      this.$store.dispatch('closeAllDialogs')
      this.$nextTick(() => {
        this.$nextTick(() => {
          this.$store.commit('boxDetailsIsVisibleForBoxId', box.id)
        })
      })
    },
    toggleCounterIsVisible () {
      let counterIsVisible = true
      if (this.countersIsVisible) {
        counterIsVisible = false
      }
      this.cards.forEach(card => {
        card = {
          id: card.id,
          counterIsVisible
        }
        this.$store.dispatch('currentCards/update', card)
      })
    },

    // boxes only

    updateBox (box, updates) {
      const keys = Object.keys(updates)
      box = { id: box.id }
      keys.forEach(key => {
        box[key] = updates[key]
      })
      this.$store.dispatch('currentBoxes/update', box)
    },
    updateBoxFill (fill) {
      this.boxes.forEach(box => {
        this.updateBox(box, { fill })
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
.style-actions
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
  .button-wrap,
  .segmented-buttons
    margin-left 0
    margin-right 4px
    vertical-align middle
    margin-bottom 10px
  .segmented-buttons
    display inline-flex
  .counter-label
    margin-left 3px
</style>
