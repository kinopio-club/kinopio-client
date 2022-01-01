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
      button(:disabled="!canEditSome" @click="toggleHeader('h1')" :class="{ active: isH1 }")
        span h1
    //- h2
    .button-wrap
      button(:disabled="!canEditSome" @click="toggleHeader('h2')" :class="{ active: isH2 }")
          span h2
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
    // styles () {
    //   const color
    // },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    canEditCard () {
      if (this.isSpaceMember) { return true }
      if (this.canEditSome) { return true }
      return false
    },

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
      return this.isHeader(pattern)
    },
    isH2 () {
      const pattern = 'h2Pattern'
      return this.isHeader(pattern)
    }
  },
  methods: {
    isHeader (pattern) {
      let cards = utils.clone(this.cards)
      cards = cards.filter(card => {
        const name = this.normalizedName(card.name).trim()
        const result = utils.markdown()[pattern].exec(name)
        return Boolean(result)
      })
      return Boolean(cards.length)
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
      return name
    },

    toggleHeader (hType) {
      let markdown = '#'
      if (hType === 'h2') {
        markdown = '##'
      }
      // let cards = utils.clone(this.cards)
      // cards = cards.map(card => card.name = utils.removeMarkdownCodeblocksFromString(card.name))

      // for each card get pos for the trailing text (until the next space or `) and insert `# ` before that

      console.log(hType, markdown)
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
