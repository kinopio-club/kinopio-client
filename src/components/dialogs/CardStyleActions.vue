<template lang="pug">
dialog.card-style-actions(v-if="visible" :open="visible" ref="dialog" @click.left.stop="closeDialogs")
  section
    //- Frame
    .button-wrap
      button(:disabled="!canEditSome" @click.left.stop="toggleFramePickerIsVisible" :class="{ active : framePickerIsVisible || isFrames }")
        span Frame
      FramePicker(:visible="framePickerIsVisible" :cards="cards")
    //- h1
    .button-wrap
      button(:disabled="!canEditSome" @click="toggleHeader('h1Pattern')" :class="{ active: isH1 }")
        span h1
    //- h2
    .button-wrap
      button(:disabled="!canEditSome" @click="toggleHeader('h2Pattern')" :class="{ active: isH2 }")
          span h2
    //- TODO LATER
    //- Tag
    .button-wrap.hidden
      button
        span Tag
    //- Color
    .button-wrap.hidden
      //- @click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}"
      button.change-color(:disabled="!canEditSome")
        .current-color(:style="{ background: '#c9c9c9' }")
      //- ColorPicker(:currentColor="backgroundTint || '#fff'" :visible="colorPickerIsVisible" @selectedColor="updateBackgroundTint" :removeIsVisible="true" @removeColor="removeBackgroundTint" :shouldLightenColors="true")

</template>

<script>
import FramePicker from '@/components/dialogs/FramePicker.vue'
import scrollIntoView from '@/scroll-into-view.js'
import utils from '@/utils.js'

export default {
  name: 'CardStyleActions',
  components: {
    FramePicker
  },
  props: {
    visible: Boolean,
    backgroundColor: String,
    cards: Array
  },
  data () {
    return {
      framePickerIsVisible: false
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
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },

    // move method or use/make getter
    // canEditCard (card) {
    //   if (this.isSpaceMember) { return true }
    //   if (this.canEditSome) { return true }
    //   return false
    // },

    numberOfSelectedCardsCreatedByCurrentUser () {
      const cards = this.cards.filter(Boolean)
      const cardsCreatedByCurrentUser = cards.filter(card => {
        return this.$store.getters['currentUser/cardIsCreatedByCurrentUser'](card)
      })
      return cardsCreatedByCurrentUser.length
    },
    canEditSome () {
      if (this.isSpaceMember) { return true }
      const cards = this.numberOfSelectedCardsCreatedByCurrentUser > 0
      return cards
    },
    isFrames () {
      const cards = this.cards.filter(card => card.frameId)
      return Boolean(cards.length)
    },
    isH1 () {
      const pattern = 'h1Pattern'
      const cards = this.cardsWithPattern(pattern)
      return Boolean(cards.length)
    },
    isH2 () {
      const pattern = 'h2Pattern'
      const cards = this.cardsWithPattern(pattern)
      return Boolean(cards.length)
    }
  },
  methods: {
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
    toggleHeader (pattern) {
      let cards = this.cardsWithPattern(pattern)
      const shouldPrepend = cards.length < this.cards.length
      if (shouldPrepend) {
        this.updateName({ pattern, shouldPrepend })
      } else {
        this.removeFromName(pattern)
      }
    },
    markdown (pattern) {
      let markdown
      if (pattern === 'h1Pattern') {
        markdown = '# '
      } else if (pattern === 'h2Pattern') {
        markdown = '## '
      }
      return markdown
    },
    updateName ({ pattern, shouldPrepend }) {
      this.cards.forEach(card => {
        const name = this.normalizedName(card.name) || ''
        let patternExists = utils.markdown()[pattern].exec(name)
        if (patternExists) {
          return // skip
        }
        if (shouldPrepend) {
          this.prependToNameSegment({ pattern, card, nameSegment: name })
        } else {
          // TODO LATER appendToNameSegment (for tags)
        }
      })
    },
    prependToNameSegment ({ pattern, card, nameSegment }) {
      const markdown = this.markdown(pattern)
      const index = card.name.indexOf(nameSegment)
      const newName = utils.insertStringAtIndex(card.name, markdown, index)
      console.log('🙅‍♀️ to prepend:', card.name, nameSegment, markdown, index, newName) // TEMP
      // TODO check if user can edit card, canEditCard
      this.$store.dispatch('currentCards/update', {
        id: card.id,
        name: newName
      })
    },
    removeFromName (pattern) {
      // TODO
      const markdown = this.markdown(pattern)
      this.cards.forEach(card => {
        console.log('😈 remove from card names', markdown, card.name)
      })
    },
    toggleFramePickerIsVisible () {
      const isVisible = this.framePickerIsVisible
      this.closeDialogs()
      this.framePickerIsVisible = !isVisible
    },
    closeDialogs () {
      this.framePickerIsVisible = false
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      if (!element) { return }
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.scrollIntoView()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
.card-style-actions
  background-color var(--secondary-background)
  width 141px // temp
  left -96px // temp
  .button-wrap
    vertical-align middle
</style>
