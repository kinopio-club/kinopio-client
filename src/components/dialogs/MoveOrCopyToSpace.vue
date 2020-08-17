<template lang="pug">
dialog.narrow(v-if="visible" :open="visible" ref="dialog" @click.left.stop="closeDialogs")
  section
    .segmented-buttons
      button(@click.left.stop="showMove" :class="{ active: actionIsMove }")
        span Move
      button(@click.left.stop="hideMove" :class="{ active: !actionIsMove }")
        span Copy

  section
    .row
      p {{actionLabel | capitalize}} {{cardsCount}} {{pluralCard}} To
    .row
      .segmented-buttons
        button(@click.left.stop="hideToNewSpace" :class="{active: !toNewSpace}")
          span Space
        button(@click.left.stop="showToNewSpace" :class="{active: toNewSpace}")
          img.icon(src="@/assets/add.svg")
          span New Space

    //- To New Space
    template(v-if="toNewSpace")
      .row
        input(placeholder="name" v-model="spaceName")
      .row
        label(:class="{active: shouldSwitchToSpace}" @click.left.prevent="toggleShouldSwitchToSpace" @keydown.stop.enter="toggleShouldSwitchToSpace")
          input(type="checkbox" v-model="shouldSwitchToSpace")
          span Switch to Space
      button(@click.left="moveOrCopyToSpace" :class="{active: loading}")
        img.icon.visit(src="@/assets/visit.svg")
        span {{actionLabel | capitalize}} to New Space
        Loader(:visible="loading")

    //- To Existing Space
    template(v-if="!toNewSpace")
      template(v-if="!spaces.length")
        span.badge.danger No Other Spaces
      template(v-if="spaces.length")
        .row
          .button-wrap
            button(@click.left.stop="toggleSpacePickerIsVisible" :class="{active: spacePickerIsVisible}")
              span {{selectedSpace.name}}
              img.down-arrow(src="@/assets/down-arrow.svg")
            SpacePicker(:visible="spacePickerIsVisible" :selectedSpace="selectedSpace" @selectSpace="updateSelectedSpace")
        .row(v-if="spaces.length")
          label(:class="{active: shouldSwitchToSpace}" @click.left.prevent="toggleShouldSwitchToSpace" @keydown.stop.enter="toggleShouldSwitchToSpace")
            input(type="checkbox" v-model="shouldSwitchToSpace")
            span Switch to Space
        button(@click.left="moveOrCopyToSpace" :class="{active: loading}")
          img.icon.visit(src="@/assets/visit.svg")
          span {{actionLabel | capitalize}} to {{selectedSpace.name}}
          Loader(:visible="loading")

</template>

<script>
import scrollIntoView from '@/scroll-into-view.js'
import cache from '@/cache.js'
import utils from '@/utils.js'
import SpacePicker from '@/components/dialogs/SpacePicker.vue'
import Loader from '@/components/Loader.vue'
import words from '@/words.js'
import newSpace from '@/spaces/new.json'
import nanoid from 'nanoid'

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
      loading: false,
      actionIsMove: true,
      toNewSpace: false,
      spaceName: ''
    }
  },
  filters: {
    capitalize (value) {
      return utils.capitalizeFirstLetter(value)
    },
    pastTense (value) {
      return utils.pastTense(value)
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
    },
    pluralCard () {
      const condition = this.multipleCardsSelectedIds.length !== 1
      return utils.pluralize('card', condition)
    },
    actionLabel () {
      if (this.actionIsMove) {
        return 'move'
      } else {
        return 'copy'
      }
    }
  },
  methods: {
    hideToNewSpace () {
      this.toNewSpace = false
    },
    showToNewSpace () {
      this.toNewSpace = true
    },
    showMove () {
      this.actionIsMove = true
    },
    hideMove () {
      this.actionIsMove = false
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
    notifySuccess () {
      const actionLabel = this.$options.filters.pastTense(this.actionLabel)
      const message = `${this.cardsCount} ${this.pluralCard} ${actionLabel} to ${this.selectedSpace.name}` // 3 cards copied to SpacePalace
      this.$store.commit('addNotification', { message, type: 'success' })
    },
    notifyNewSpaceSuccess (spaceName) {
      const actionLabel = this.$options.filters.pastTense(this.actionLabel)
      const message = `${spaceName} added with ${this.cardsCount} ${this.pluralCard} ${actionLabel} ` // SpacePalace added with 3 cards copied
      this.$store.commit('addNotification', { message, type: 'success' })
    },
    selectedItems () {
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
      return { cards, connectionTypes, connections }
    },

    async createNewSpace (items, spaceName) {
      this.loading = true
      let space = utils.clone(newSpace)
      space.name = spaceName
      space.id = nanoid()
      space.cards = items.cards
      space.connectionTypes = items.connectionTypes
      space.connections = items.connections
      space.userId = this.$store.state.currentUser.id
      space = cache.updateIdsInSpace(space)
      console.log('🚚 create new space', space)
      await this.$store.dispatch('api/createSpace', space)
      this.loading = false
      return space
    },

    async copyToSelectedSpace (items) {
      this.loading = true
      const newItems = utils.uniqueSpaceItems(utils.clone(items))
      let { cards, connectionTypes, connections } = newItems
      cards = this.mapRemoteItems(cards)
      connectionTypes = this.mapRemoteItems(connectionTypes)
      connections = this.mapRemoteItems(connections)
      console.log('🚚 copy or move', cards, connectionTypes, connections)
      await this.$store.dispatch('api/updateCards', cards)
      await this.$store.dispatch('api/updateConnectionTypes', connectionTypes)
      await this.$store.dispatch('api/updateConnections', connections)
      cache.addToSpace(newItems, this.selectedSpace.id)
      this.loading = false
    },

    async moveOrCopyToSpace () {
      if (this.loading) { return }
      const spaceName = this.spaceName || words.randomUniqueName()
      const items = this.selectedItems()
      let selectedSpace = this.selectedSpace
      if (this.toNewSpace) {
        selectedSpace = await this.createNewSpace(items, spaceName)
        this.notifyNewSpaceSuccess(spaceName)
      } else {
        await this.copyToSelectedSpace(items)
        this.notifySuccess()
      }
      if (this.actionIsMove) {
        this.removeCards(items.cards)
      }
      this.$store.dispatch('currentSpace/removeUnusedConnectionTypes')
      this.$store.dispatch('clearMultipleSelected')
      this.$store.dispatch('closeAllDialogs')
      if (this.shouldSwitchToSpace) {
        this.$store.dispatch('currentSpace/changeSpace', { space: selectedSpace })
      }
    },

    mapRemoteItems (items) {
      const spaceId = this.selectedSpace.id
      return items.map(item => {
        item.spaceId = spaceId
        return item
      })
    },
    updateSpaces () {
      const spaces = cache.getAllSpaces()
      this.spaces = spaces.filter(space => {
        const spaceIsNotCurrent = space.id !== this.currentSpace.id
        const spaceHasId = Boolean(space.id)
        return spaceIsNotCurrent && spaceHasId
      })
      this.selectedSpace = this.spaces[0]
      if (!this.spaces.length) {
        this.toNewSpace = true
      }
    },
    updateSelectedSpace (space) {
      this.selectedSpace = space
      this.spacePickerIsVisible = false
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
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
          this.spaceName = words.randomUniqueName()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
</style>
