<template lang="pug">
dialog.narrow(v-if="visible" :open="visible" ref="dialog" @click.stop="closeDialogs")
  section
    p Move {{cardsCount}} Cards To
  section
    template(v-if="spaces.length")
      .row
        .button-wrap
          button(@click.stop="toggleSpacePickerIsVisible" :class="{active: spacePickerIsVisible}") {{selectedSpace.name}}
          SpacePicker(:visible="spacePickerIsVisible" :selectedSpace="selectedSpace" :shouldExcludeCurrentSpace="true" :shouldCloseWhenSelecting="true" @selectSpace="updateSelectedSpace" @closeDialog="closeDialogs")
      .row(v-if="spaces.length")
        label(:class="{active: shouldSwitchToSpace}" @click.prevent="toggleShouldSwitchToSpace" @keydown.stop.enter="toggleShouldSwitchToSpace")
          input(type="checkbox" v-model="shouldSwitchToSpace")
          span Switch to Space
      button(@click="moveToSpace" :class="{active: loading}")
        img.icon.cut(src="@/assets/cut.svg")
        span Move
        Loader(:visible="loading")

    template(v-if="!spaces.length")
      span.badge.danger No Other Spaces
      p + Add a Space to move cards there
      button(@click="triggerSpaceDetailsVisible") Your Spaces
</template>

<script>
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil

import cache from '@/cache.js'
import utils from '@/utils.js'
import SpacePicker from '@/components/dialogs/SpacePicker.vue'
import Loader from '@/components/Loader.vue'

export default {
  name: 'MoveToSpace',
  components: {
    SpacePicker,
    Loader
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      shouldSwitchToSpace: true,
      spaces: [],
      selectedSpace: {},
      spacePickerIsVisible: false,
      loading: false
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
    cardsCount () {
      return this.multipleCardsSelectedIds.length
    },
    currentSpace () {
      return this.$store.state.currentSpace
    }
  },
  methods: {
    triggerSpaceDetailsVisible () {
      this.$store.commit('clearMultipleSelected')
      this.$store.commit('closeAllDialogs')
      this.$store.commit('triggerSpaceDetailsVisible')
    },
    toggleSpacePickerIsVisible () {
      this.spacePickerIsVisible = !this.spacePickerIsVisible
    },
    toggleShouldSwitchToSpace () {
      this.shouldSwitchToSpace = !this.shouldSwitchToSpace
    },
    removeCards (cards) {
      cards.forEach(card => {
        this.$store.dispatch('currentSpace/removeCardPermanent', card)
        this.$store.dispatch('currentSpace/removeConnectionsFromCard', card)
      })
    },
    async moveToSpace () {
      if (this.loading) { return }
      const currentSpace = utils.clone(this.$store.state.currentSpace)
      const multipleCardsSelectedIds = this.$store.state.multipleCardsSelectedIds
      const cards = currentSpace.cards.filter(card => multipleCardsSelectedIds.includes(card.id))
      await this.copyToSelectedSpace(currentSpace, multipleCardsSelectedIds, cards)
      this.removeCards(cards)
      this.$store.dispatch('currentSpace/removeUnusedConnectionTypes')
      this.$store.commit('clearMultipleSelected')
      this.$store.commit('closeAllDialogs')
      if (this.shouldSwitchToSpace) {
        this.$store.dispatch('currentSpace/changeSpace', this.selectedSpace)
      }
      this.$store.commit('addNotification', { message: `Cards Moved to ${this.selectedSpace.name}`, type: 'success' })
    },
    async copyToSelectedSpace (currentSpace, multipleCardsSelectedIds, cards) {
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
      await this.createRemoteItems(newItems)
      cache.addToSpace(newItems, this.selectedSpace.id)
    },
    mapRemoteItems (items) {
      const spaceId = this.selectedSpace.id
      return items.map(item => {
        item.spaceId = spaceId
        return item
      })
    },
    async createRemoteItems ({ cards, connectionTypes, connections }) {
      this.loading = true
      cards = this.mapRemoteItems(cards)
      connectionTypes = this.mapRemoteItems(connectionTypes)
      connections = this.mapRemoteItems(connections)
      console.log('🚚 Move', cards, connectionTypes, connections)
      await this.$store.dispatch('api/updateCards', cards)
      await this.$store.dispatch('api/updateConnectionTypes', connectionTypes)
      await this.$store.dispatch('api/updateConnections', connections)
      this.loading = false
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
