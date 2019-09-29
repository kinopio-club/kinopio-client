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
        button(@click.stop="toggleSpacePickerIsVisible" :class="{active: spacePickerIsVisible}") {{selectedSpace.name}}
        SpacePicker(:visible="spacePickerIsVisible" :selectedSpace="selectedSpace" :excludeCurrentSpace="true" @selectSpace="updateSelectedSpace")
    button(@click="toAnotherSpace")
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
    currentSpace () {
      return this.$store.state.currentSpace
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
    changeToSelectedSpace () {
      this.updateSpaces()
      this.$store.dispatch('currentSpace/changeSpace', this.selectedSpace)
    },
    toAnotherSpace () {
      if (this.selectedSpace.id === this.currentSpace.id) { return }
      this.$store.dispatch('currentSpace/copyCardsToAnotherSpace', {
        space: this.selectedSpace,
        shouldRemoveOriginals: this.shouldMoveCards
      })
      this.$store.commit('currentSpace/removeUnusedConnectionTypes')
      this.$store.commit('multipleCardsSelected', [])
      this.$store.commit('closeAllDialogs')
      if (this.shouldSwitchToSpace) {
        this.changeToSelectedSpace()
      }
    },
    updateSpaces () {
      const spaces = cache.getAllSpaces()
      this.spaces = spaces.filter(space => space.id !== this.currentSpace.id)
      this.selectedSpace = this.spaces[0]
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
