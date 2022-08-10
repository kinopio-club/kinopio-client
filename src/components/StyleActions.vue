<template lang="pug">
section.sub-section.style-actions(v-if="visible" @click.left.stop="closeDialogs")
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
    .button-wrap
      button(:disabled="!canEditAll" @click.left.stop="toggleTagPickerIsVisible" :class="{ active: tagPickerIsVisible }")
        span Tag
      TagPickerStyleActions(:visible="tagPickerIsVisible" :cards="cards")
    //- Frame
    .button-wrap
      button(:disabled="!canEditAll" @click.left.stop="toggleFramePickerIsVisible" :class="{ active : framePickerIsVisible || isFrames }")
        span Frame
      FramePicker(:visible="framePickerIsVisible" :cards="cards")
    //- Color
    .button-wrap(@click.left.stop="toggleColorPickerIsVisible")
      button.change-color(:disabled="!canEditAll" :class="{active: colorPickerIsVisible}")
        .current-color(:style="{ background: cardsBackgroundColor }")
      ColorPicker(
        :currentColor="cardsBackgroundColor"
        :visible="colorPickerIsVisible"
        :removeIsVisible="true"
        :otherColors="spaceCardBackgroundColors"
        @selectedColor="updateCardsBackgroundColor"
        @removeColor="removeCardsBackgroundColor"
      )
    //- Lock
    .button-wrap
      button(:disabled="!canEditAll" @click="toggleIsLocked" :class="{active: isLocked}")
        img.icon(src="@/assets/lock.svg")
    //- Comment
    .button-wrap
      button(:disabled="!canEditAll" @click="toggleIsComment" :class="{active: isComment}")
        img.icon(src="@/assets/comment.svg")

</template>

<script>
import FramePicker from '@/components/dialogs/FramePicker.vue'
import TagPickerStyleActions from '@/components/dialogs/TagPickerStyleActions.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import utils from '@/utils.js'

import uniq from 'lodash-es/uniq'

const defaultCardBackgroundColor = '#c9c9c9'

export default {
  name: 'StyleActions',
  components: {
    FramePicker,
    TagPickerStyleActions,
    ColorPicker
  },
  props: {
    visible: Boolean,
    cards: Array,
    boxes: Array
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
    cardsBackgroundColor () {
      console.log('💖', this.cards, this.boxes) // temp
      let colors = this.cards.map(card => card.backgroundColor)
      colors = colors.filter(color => Boolean(color))
      const cardsHaveColors = colors.length === this.cards.length
      const colorsAreEqual = uniq(colors).length === 1
      if (cardsHaveColors && colorsAreEqual) {
        return colors[0]
      } else {
        return defaultCardBackgroundColor
      }
    },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    spaceCardBackgroundColors () { return this.$store.getters['currentCards/backgroundColors'] },
    numberOfSelectedCardsCreatedByCurrentUser () {
      const cards = this.cards.filter(Boolean)
      const cardsCreatedByCurrentUser = cards.filter(card => {
        return this.$store.getters['currentUser/cardIsCreatedByCurrentUser'](card)
      })
      return cardsCreatedByCurrentUser.length
    },
    canEditAll () {
      if (this.isSpaceMember) { return true }
      const cards = this.numberOfSelectedCardsCreatedByCurrentUser === this.cards.length
      return cards
    },
    isFrames () {
      const cards = this.cards.filter(card => card.frameId)
      return Boolean(cards.length === this.cards.length)
    },
    isH1 () {
      const pattern = 'h1Pattern'
      const cards = this.cardsWithPattern(pattern)
      return Boolean(cards.length === this.cards.length)
    },
    isH2 () {
      const pattern = 'h2Pattern'
      const cards = this.cardsWithPattern(pattern)
      return Boolean(cards.length === this.cards.length)
    },
    isLocked () {
      const cards = this.cards.filter(card => card.isLocked)
      return Boolean(cards.length === this.cards.length)
    },
    isComment () {
      const cards = this.cards.filter(card => card.isComment)
      return Boolean(cards.length === this.cards.length)
    }
  },
  methods: {
    updateCardsBackgroundColor (color) {
      this.cards.forEach(card => {
        if (card.backgroundColor === color) { return }
        card = {
          id: card.id,
          backgroundColor: color
        }
        this.$store.dispatch('currentCards/update', card)
      })
    },
    removeCardsBackgroundColor () {
      this.cards.forEach(card => {
        if (!card.backgroundColor) { return }
        card = {
          id: card.id,
          backgroundColor: ''
        }
        this.$store.dispatch('currentCards/update', card)
      })
    },
    cardsWithPattern (pattern) {
      const cards = this.cards.filter(card => {
        const name = this.normalizedName(card.name)
        const result = utils.markdown()[pattern].exec(name)
        return Boolean(result)
      })
      return cards
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
      let cards = this.cardsWithPattern(pattern)
      const shouldPrepend = cards.length < this.cards.length
      if (shouldPrepend) {
        const removePattern = this.removePattern(pattern)
        this.removeFromCards(removePattern)
        this.prependToCards(pattern)
      } else {
        this.removeFromCards(pattern)
      }
    },
    toggleIsLocked () {
      let isLocked = true
      if (this.isLocked) {
        isLocked = false
      }
      this.cards.forEach(card => {
        card = {
          id: card.id,
          isLocked
        }
        this.$store.dispatch('currentCards/update', card)
      })
      this.$store.dispatch('currentCards/updateCardMap')
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
    prependToCards (pattern) {
      this.cards.forEach(card => {
        const name = this.normalizedName(card.name) || ''
        let patternExists = utils.markdown()[pattern].exec(name)
        if (patternExists) {
          return // skip
        }
        this.prependToNameSegment({ pattern, card, nameSegment: name })
      })
    },
    updateCardName (cardId, newName) {
      const card = this.$store.getters['currentCards/byId'](cardId)
      this.$store.dispatch('currentCards/updateCardName', { card, newName })
    },
    prependToNameSegment ({ pattern, card, nameSegment }) {
      const markdown = this.markdown(pattern)
      let index = card.name.indexOf(nameSegment)
      if (index < 0) { index = 0 }
      const newName = utils.insertStringAtIndex(card.name, markdown, index)
      this.updateCardName(card.id, newName)
    },
    removeFromCards (pattern) {
      const markdown = this.markdown(pattern)
      this.cards.forEach(card => {
        const newName = card.name.replace(markdown, '')
        if (newName === card.name) { return }
        this.updateCardName(card.id, newName)
      })
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
    toggleColorPickerIsVisible () {
      const isVisible = this.colorPickerIsVisible
      this.closeDialogs()
      this.colorPickerIsVisible = !isVisible
    },
    closeDialogs () {
      this.framePickerIsVisible = false
      this.tagPickerIsVisible = false
      this.colorPickerIsVisible = false
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
  .button-wrap
    margin-left 0
    margin-right 6px
    vertical-align middle
    margin-bottom 10px

</style>
