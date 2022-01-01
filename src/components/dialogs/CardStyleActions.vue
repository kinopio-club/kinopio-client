<template lang="pug">
dialog.card-style-actions(v-if="visible" :open="visible" ref="dialog" @click.left.stop="closeDialogs")
  section
    //- Frame
    .button-wrap
      button(:disabled="!canEditSome" @click.left.stop="toggleFramePickerIsVisible" :class="{active : framePickerIsVisible || cardsHaveFrames}")
        span Frame
      FramePicker(:visible="framePickerIsVisible" :cards="cards")
    //- h1
    .button-wrap
      button(:disabled="!canEditSome" @click="toggleHeader('h1')")
        span h1
    //- h2
    .button-wrap
      button(:disabled="!canEditSome" @click="toggleHeader('h2')")
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
// import utils from '@/utils.js'

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
    cardsHaveFrames () {
      const cards = this.cards.filter(card => card.frameId)
      return Boolean(cards.length)
    }
  },
  methods: {
    toggleHeader (hType) {
      let markdown = '#'
      if (hType === 'h2') {
        markdown = '##'
      }
      // let cards = utils.clone(this.cards)

      console.log(hType, markdown)
    },

    // TODO nameWithoutCodeBlocks (name) {

    // },

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
