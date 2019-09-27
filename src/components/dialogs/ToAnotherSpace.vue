<template lang="pug">
dialog.narrow(v-if="visible" :open="visible" ref="dialog" @click.stop="closeDialogs")
  section
    .row
      p Move {{cardsCountLabel}} to
    .row
      .button-wrap
        button(@click.stop="toggleSpacePickerIsVisible" :class="{active: spacePickerIsVisible}") {{selectedSpace.name}}
        SpacePicker(:visible="spacePickerIsVisible" :selectedSpace="selectedSpace" @selectSpace="updateSelectedSpace")
    button(@click="actionToAnotherSpace")
      img.icon.move(src="@/assets/move.svg")
      span Move
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
    }
  },
  methods: {
    toggleSpacePickerIsVisible () {
      this.spacePickerIsVisible = !this.spacePickerIsVisible
    },
    toggleShouldSwitchToSpace () {
      this.shouldSwitchToSpace = !this.shouldSwitchToSpace
    },
    removeCards () {
      this.$emit('removeCards')
    },
    changeToSelectedSpace () {
      this.$store.dispatch('currentSpace/changeSpace', this.selectedSpace)
    },
    actionToAnotherSpace () {
      this.$store.dispatch('currentSpace/moveCardsToAnotherSpace', this.selectedSpace)
      this.removeCards()
      // if (this.shouldSwitchToSpace) {
      //   this.changeToSelectedSpace()
      // }
    },
    updateSpaces () {
      this.spaces = cache.getAllSpaces()
      this.selectedSpace = this.spaces[1]
    },
    updateSelectedSpace (space) {
      this.selectedSpace = space
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
