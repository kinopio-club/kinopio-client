<template lang="pug">
section.subsection.style-actions(v-if="visible" @click.left.stop="closeDialogs")
  .row
    //- h1
    .button-wrap
      button(:disabled="!canEditAll" @click="toggleHeader('h1Pattern')" :class="{ active: isH1 }")
        span h1
    //- h2
    .button-wrap
      button(:disabled="!canEditAll" @click="toggleHeader('h2Pattern')" :class="{ active: isH2 }")
          span h2
    //- Tag
    .button-wrap(v-if="isCards")
      button(:disabled="!canEditAll" @click.left.stop="toggleTagPickerIsVisible" :class="{ active: tagPickerIsVisible }")
        span Tag
      TagPickerStyleActions(:visible="tagPickerIsVisible" :cards="cards")
    //- Frame
    .button-wrap(v-if="isCards")
      button(:disabled="!canEditAll" @click.left.stop="toggleFramePickerIsVisible" :class="{ active : framePickerIsVisible || isFrames }")
        span Frame
      FramePicker(:visible="framePickerIsVisible" :cards="cards")
    //- Color
    .button-wrap(v-if="!colorIsHidden" @click.left.stop="toggleColorPickerIsVisible")
      button.change-color(:disabled="!canEditAll" :class="{active: colorPickerIsVisible}")
        .current-color(:style="{ background: color }")
      ColorPicker(
        :currentColor="color"
        :visible="colorPickerIsVisible"
        :removeIsVisible="true"
        :recentColors="itemColors"
        @selectedColor="updateColor"
        @removeColor="removeColor"
      )
    //- Box Fill
    .segmented-buttons(v-if="isBoxes")
      button(:class="{active: boxFillIsFilled}" @click="updateBoxFill('filled')")
        img.icon.box-icon(src="@/assets/box-filled.svg")
      button(:class="{active: boxFillIsEmpty}" @click="updateBoxFill('empty')")
        img.icon.box-icon(src="@/assets/box-empty.svg")

    //- Lock
    .button-wrap
      button(:disabled="!canEditAll" @click="toggleIsLocked" :class="{active: isLocked}")
        img.icon(src="@/assets/lock.svg")
    //- Comment
    .button-wrap(v-if="isCards")
      button(:disabled="!canEditAll" @click="toggleIsComment" :class="{active: isComment}")
        img.icon(src="@/assets/comment.svg")

</template>

<script>
import FramePicker from '@/components/dialogs/FramePicker.vue'
import TagPickerStyleActions from '@/components/dialogs/TagPickerStyleActions.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import utils from '@/utils.js'

import uniq from 'lodash-es/uniq'

const defaultCardColor = '#c9c9c9'

export default {
  name: 'StyleActions',
  components: {
    FramePicker,
    TagPickerStyleActions,
    ColorPicker
  },
  props: {
    visible: Boolean,
    colorIsHidden: Boolean,
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
  data () {
    return {
      framePickerIsVisible: false,
      tagPickerIsVisible: false,
      colorPickerIsVisible: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerCardDetailsCloseDialogs' && this.visible) {
        this.closeDialogs()
      }
    })
  },
  computed: {
    isCards () { return Boolean(this.cards.length) },
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
        return defaultCardColor
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
      this.$store.dispatch('currentCards/updateCardMap')
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
    closeDialogs () {
      this.framePickerIsVisible = false
      this.tagPickerIsVisible = false
      this.colorPickerIsVisible = false
    },

    // cards only

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
      let isComment = true
      if (this.isComment) {
        isComment = false
      }
      this.cards.forEach(card => {
        card = {
          id: card.id,
          name: utils.nameWithoutCommentPattern(card.name),
          isComment,
          commentIsVisible: false
        }
        if (!card.name) {
          delete card.name
        }
        this.$store.dispatch('currentCards/update', card)
      })
      this.$store.dispatch('currentCards/updateCardMap')
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
  padding 4px
  padding-bottom 0
  .row
    max-width 203px
    display block
    margin-bottom -6px
  .button-wrap,
  .segmented-buttons
    margin-left 0
    margin-right 6px
    vertical-align middle
    margin-bottom 10px
  .segmented-buttons
    display inline-flex
</style>
