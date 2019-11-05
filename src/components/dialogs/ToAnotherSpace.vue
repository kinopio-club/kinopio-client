<template lang="pug">
dialog.narrow(v-if="visible" :open="visible" ref="dialog" @click.stop="closeDialogs")
  section
    .row
      .segmented-buttons
        button(@click="shouldMoveCardsTrue" :class="{active: shouldMoveCards}")
          span Move
        button(@click="shouldMoveCardsFalse" :class="{active: !shouldMoveCards}")
          span Copy
    template(v-if="spaces.length")
      .row
        p {{moveOrCopy}} {{cardsCountLabel}} to
      .row
        .button-wrap
          button(@click.stop="toggleSpacePickerIsVisible" :class="{active: spacePickerIsVisible}") {{selectedSpace.name}}
          SpacePicker(:visible="spacePickerIsVisible" :selectedSpace="selectedSpace" :excludeCurrentSpace="true" @selectSpace="updateSelectedSpace" @closeDialog="closeDialogs")
      .row(v-if="spaces.length")
        label(:class="{active: shouldSwitchToSpace}" @click.prevent="toggleShouldSwitchToSpace")
          input(type="checkbox" v-model="shouldSwitchToSpace")
          span Switch to Space
      button(@click="toAnotherSpace")
        img.icon.move(src="@/assets/move.svg")
        span {{moveOrCopy}}

    template(v-if="!spaces.length")
      span.badge.danger No Other Spaces
      p Add a Space to {{moveOrCopy.toLowerCase()}} cards there
</template>

<script>
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil

import cache from '@/cache.js'
import utils from '@/utils.js'
import apiQueue from '@/apiQueue.js'
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
    multipleCardsSelectedIds () {
      return this.$store.state.multipleCardsSelectedIds
    },
    multipleCardsIsSelected () {
      const numberOfCards = this.multipleCardsSelectedIds.length
      return Boolean(numberOfCards > 1)
    },
    cardsCountLabel () {
      const numberOfCards = this.multipleCardsSelectedIds.length
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
      this.copyToSelectedSpace()
      if (this.shouldMoveCards) {
        const currentSpace = utils.clone(this.$store.state.currentSpace)
        const multipleCardsSelectedIds = this.$store.state.multipleCardsSelectedIds
        const cards = currentSpace.cards.filter(card => multipleCardsSelectedIds.includes(card.id))
        cards.forEach(card => {
          this.$store.dispatch('currentSpace/removeCardPermanent', card)
          this.$store.dispatch('currentSpace/removeConnectionsFromCard', card)
        })
      }
      this.$store.dispatch('currentSpace/removeUnusedConnectionTypes')
      this.$store.commit('multipleCardsSelectedIds', [])
      this.$store.commit('closeAllDialogs')
      if (this.shouldSwitchToSpace) {
        this.changeToSelectedSpace()
      }
    },

    copyToSelectedSpace () {
      const currentSpace = utils.clone(this.$store.state.currentSpace)
      const multipleCardsSelectedIds = this.$store.state.multipleCardsSelectedIds
      const cards = currentSpace.cards.filter(card => multipleCardsSelectedIds.includes(card.id))

      const connections = currentSpace.connections.filter(connection => {
        const isStartCardMatch = multipleCardsSelectedIds.includes(connection.startCardId)
        const isEndCardMatch = multipleCardsSelectedIds.includes(connection.endCardId)
        return isStartCardMatch && isEndCardMatch
      })

      const connectionTypeIds = connections.map(connection => connection.connectionTypeId)
      const connectionTypes = currentSpace.connectionTypes.filter(type => {
        return connectionTypeIds.includes(type.id)
      })

      const prevItems = { cards, connectionTypes, connections }
      const newItems = utils.uniqueSpaceItems(utils.clone(prevItems))

      this.createRemoteItems(newItems)
      cache.addToSpace(newItems, this.selectedSpace.id)
    },

    createRemoteItems (newItems) {
      newItems.cards.forEach(card => {
        card.spaceId = this.selectedSpace.id
        apiQueue.add('createCard', card)
      })
      newItems.connectionTypes.forEach(type => {
        type.spaceId = this.selectedSpace.id
        apiQueue.add('createConnectionType', type)
      })
      newItems.cards.forEach(connection => {
        connection.spaceId = this.selectedSpace.id
        apiQueue.add('createConnection', connection)
      })
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
