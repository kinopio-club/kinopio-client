<template lang="pug">
.row.card-style-actions(v-if="visible" :open="visible" @click.left.stop="closeDialogs")
  //- Frame
  .button-wrap
    button(:disabled="!canEditCard" @click.left.stop="toggleFramePickerIsVisible" :class="{active : framePickerIsVisible || cardsHaveFrames}")
      span Frame
    FramePicker(:visible="framePickerIsVisible" :cards="cards")
  //- h1
  .button-wrap
    button(:disabled="!canEditCard")
      span h1
  //- h2
  .button-wrap
    button(:disabled="!canEditCard")
        span h2
</template>

<script>
import FramePicker from '@/components/dialogs/FramePicker.vue'
import scrollIntoView from '@/scroll-into-view.js'

export default {
  name: 'CardStyleActions',
  components: {
    FramePicker
  },
  props: {
    visible: Boolean,
    backgroundColor: String,
    cards: Array,
    parentElement: Object
  },
  data () {
    return {
      framePickerIsVisible: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerCardDetailsCloseDialogs' && this.visible) {
        this.closeComponentDialogs()
      }
    })
  },
  computed: {
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
    toggleFramePickerIsVisible () {
      const isVisible = this.framePickerIsVisible
      this.closeDialogs()
      this.framePickerIsVisible = !isVisible
    },
    closeDialogs () {
      this.closeComponentDialogs()
      this.$emit('closeDialogs')
    },
    closeComponentDialogs () {
      this.framePickerIsVisible = false
    },
    scrollParentIntoView () {
      const element = this.parentElement
      console.log('💖', element)
      if (!element) { return }
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.scrollParentIntoView()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
</style>
