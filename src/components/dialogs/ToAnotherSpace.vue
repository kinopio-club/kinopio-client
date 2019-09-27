<template lang="pug">
dialog.narrow(v-if="visible" :open="visible" ref="dialog" @click.stop="closeDialogs")
  section
    .row
      .segmented-buttons
        button(@click="shouldMoveCardsTrue" :class="{active: shouldMoveCards}")
          span Move
        button(@click="shouldMoveCardsFalse" :class="{active: !shouldMoveCards}")
          span Copy
    .row
      p {{moveOrCopy}} {{cardsCountLabel}} to
    .row
      .button-wrap
        button(@click.stop="toggleSpacePickerIsVisible") {{selectedSpace.name}}
        SpacePicker(:visible="spacePickerIsVisible" :selectedSpace="selectedSpace" @selectSpace="updateSelectedSpace")
    button
      img.icon.move(src="@/assets/move.svg")
      span {{moveOrCopy}}
  section
    label(:class="{active: shouldSwitchToSpace}" @click.prevent="toggleShouldSwitchToSpace")
      input(type="checkbox" v-model="shouldSwitchToSpace")
      span Switch to Space
</template>

<script>
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil

import cache from '@/cache.js'
import SpacePicker from '@/components/dialogs/SpacePicker.vue'

export default {
  name: 'ToAnotherSpace',
  components: {
    SpacePicker
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      shouldMoveCards: true,
      shouldSwitchToSpace: false,
      spaces: [],
      selectedSpace: {},
      spacePickerIsVisible: false
    }
  },
  computed: {
    multipleCardsSelected () {
      return this.$store.state.multipleCardsSelected
    },
    multipleCardsIsSelected () {
      const numberOfCards = this.multipleCardsSelected.length
      return Boolean(numberOfCards > 1)
    },
    cardsCountLabel () {
      const numberOfCards = this.multipleCardsSelected.length
      let label = 'card'
      if (numberOfCards > 1) { label = `${numberOfCards} cards` }
      return label
    },
    moveOrCopy () {
      if (this.shouldMoveCards) {
        return 'Move'
      } else {
        return 'Copy'
      }
    }
  },
  methods: {
    shouldMoveCardsTrue () {
      this.shouldMoveCards = true
    },
    shouldMoveCardsFalse () {
      this.shouldMoveCards = false
    },
    toggleSpacePickerIsVisible () {
      this.spacePickerIsVisible = !this.spacePickerIsVisible
    },
    toggleShouldSwitchToSpace () {
      this.shouldSwitchToSpace = !this.shouldSwitchToSpace
    },
    // removeCards () {
    //   this.$emit('shouldRemoveCards')
    // },
    // copyCards
    // moveCards
    updateSpaces () {
      this.spaces = cache.getAllSpaces()
      this.selectedSpace = this.spaces[1]
    },
    updateSelectedSpace (space) {
      // TODO🌹
      // console.log('TODO')
      this.selectedSpace = space
      this.scrollIntoView()
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      scrollIntoView(element, {
        behavior: 'smooth',
        scrollMode: 'if-needed'
      })
    },
    closeDialogs () {
      this.spacePickerIsVisible = false
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.closeDialogs()
          this.scrollIntoView()
          this.updateSpaces()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
</style>
