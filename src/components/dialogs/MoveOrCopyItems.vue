<template lang="pug">
dialog.narrow.more-or-copy-cards(v-if="visible" :open="visible" ref="dialog" @click.left.stop="closeDialogs")
  section(v-if="!actionIsMove")
    //- Copy Card Names
    button(@click.left="copyText")
      img.icon.copy(src="@/assets/copy.svg")
      span Copy Card Names

  section
    .row
      p {{actionLabelCapitalized}} {{pluralItem}} to space
    .row
      .button-wrap
        button(@click.left.stop="toggleSpacePickerIsVisible" :class="{active: spacePickerIsVisible}")
          span {{selectedSpace.name}}
          img.down-arrow(src="@/assets/down-arrow.svg")
        SpacePicker(:visible="spacePickerIsVisible" :selectedSpace="selectedSpace" :shouldShowNewSpace="true" @selectSpace="updateSelectedSpace" :showUserIfCurrentUserIsCollaborator="true")
    button(@click.left="moveOrCopyToSpace" :class="{active: loading}")
      img.icon.cut(v-if="actionIsMove" src="@/assets/cut.svg")
      img.icon.copy(v-else src="@/assets/copy.svg")
      span {{buttonLabel}}
      Loader(:visible="loading")

  .error-card-limit(v-if="cardsCreatedIsOverLimit")
    .badge.danger Out of Cards
    p To add more cards you'll need to upgrade
    button(@click.left.stop="triggerUpgradeUserIsVisible") Upgrade for Unlimited

</template>

<script>
import cache from '@/cache.js'
import utils from '@/utils.js'
import SpacePicker from '@/components/dialogs/SpacePicker.vue'
import Loader from '@/components/Loader.vue'

export default {
  name: 'MoveOrCopyItems',
  components: {
    SpacePicker,
    Loader
  },
  props: {
    visible: Boolean,
    actionIsMove: Boolean,
    exportData: Object
  },
  data () {
    return {
      spaces: [],
      selectedSpace: {},
      spacePickerIsVisible: false,
      loading: false,
      cardsCreatedIsOverLimit: false
    }
  },
  computed: {
    multipleCardsSelectedIds () {
      return utils.clone(this.$store.state.multipleCardsSelectedIds)
    },
    multipleBoxesSelectedIds () {
      return utils.clone(this.$store.state.multipleBoxesSelectedIds)
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
    pluralItem () {
      const condition = this.multipleCardsSelectedIds.length + this.multipleBoxesSelectedIds.length !== 1
      return utils.pluralize('item', condition)
    },
    actionLabel () {
      if (this.actionIsMove) {
        return 'move'
      } else {
        return 'copy'
      }
    },
    actionLabelCapitalized () { return utils.capitalizeFirstLetter(this.actionLabel) },
    buttonLabel () {
      const actionLabel = this.capitalize(this.actionLabel) // copy, move
      const pluralItem = this.capitalize(this.pluralItem) // item, items
      return `${actionLabel} ${pluralItem} to Space`
    },
    names () { return this.exportData.cards.map(card => card.name) },
    text () { return utils.textFromCardNames(this.exportData.cards) }
  },
  methods: {
    triggerUpgradeUserIsVisible () {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerUpgradeUserIsVisible')
    },
    capitalize (value) {
      return utils.capitalizeFirstLetter(value)
    },
    pastTense (value) {
      return utils.pastTense(value)
    },
    async copyText () {
      this.$store.commit('clearNotificationsWithPosition')
      const position = utils.cursorPositionInPage(event)
      try {
        await navigator.clipboard.writeText(this.text)
        this.$store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
      } catch (error) {
        console.warn('🚑 copyText', error)
        this.$store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
      }
    },
    toggleSpacePickerIsVisible () {
      this.spacePickerIsVisible = !this.spacePickerIsVisible
    },
    removeCards (cards) {
      cards.forEach(card => {
        this.$store.dispatch('currentCards/remove', card)
        this.$store.dispatch('currentConnections/removeFromCard', card)
      })
    },
    removeBoxes (boxes) {
      boxes.forEach(box => {
        this.$store.dispatch('currentBoxes/remove', box)
      })
    },
    notifySuccess () {
      const actionLabel = this.pastTense(this.actionLabel)
      const message = `${this.cardsCount} ${this.pluralItem} ${actionLabel} to ${this.selectedSpace.name}` // 3 cards copied to SpacePalace
      this.$store.commit('notifyMoveOrCopyToSpaceDetails', { id: this.selectedSpace.id, name: this.selectedSpace.name, message })
      this.$store.commit('notifyMoveOrCopyToSpace', true)
    },
    notifyNewSpaceSuccess (newSpace) {
      const actionLabel = this.pastTense(this.actionLabel)
      const message = `${newSpace.name} added with ${this.cardsCount} ${this.pluralItem} ${actionLabel} ` // SpacePalace added with 3 cards copied
      this.$store.commit('notifyMoveOrCopyToSpaceDetails', { id: newSpace.id, name: newSpace.name, message })
      this.$store.commit('notifyMoveOrCopyToSpace', true)
    },
    selectedItems () {
      const multipleCardsSelectedIds = this.$store.state.multipleCardsSelectedIds
      const { cards, boxes } = this.exportData
      const connections = this.$store.getters['currentConnections/all'].filter(connection => {
        const isStartCardMatch = multipleCardsSelectedIds.includes(connection.startCardId)
        const isEndCardMatch = multipleCardsSelectedIds.includes(connection.endCardId)
        return isStartCardMatch && isEndCardMatch
      })
      const connectionTypeIds = connections.map(connection => connection.connectionTypeId)
      const connectionTypes = connectionTypeIds.map(id => this.$store.getters['currentConnections/typeByTypeId'](id))
      return { cards, connectionTypes, connections, boxes }
    },
    async copyToSelectedSpace (items) {
      this.loading = true
      const nullCardUsers = true
      const newItems = utils.uniqueSpaceItems(utils.clone(items), nullCardUsers)
      let { cards, connectionTypes, connections, boxes } = newItems
      cards = this.mapRemoteItems(cards)
      connectionTypes = this.mapRemoteItems(connectionTypes)
      connections = this.mapRemoteItems(connections)
      boxes = this.mapRemoteItems(boxes)
      await this.$store.dispatch('api/createCards', cards)
      await this.$store.dispatch('api/createConnectionTypes', connectionTypes)
      await this.$store.dispatch('api/createConnections', connections)
      await this.$store.dispatch('api/createBoxes', boxes)
      const spaceIsCached = Boolean(cache.space(this.selectedSpace.id).cards)
      if (!spaceIsCached) {
        const space = { id: this.selectedSpace.id }
        let remoteSpace = await this.$store.dispatch('api/getSpace', { space, shouldRequestRemote: true })
        cache.saveSpace(remoteSpace)
      }
      cache.addToSpace(newItems, this.selectedSpace.id)
      if (this.actionIsMove) {
        await this.$store.dispatch('api/updateCardsWithLinkToCardIds', { prevCards: items.cards, newCards: newItems.cards })
      }
      console.log('🚚 copies created', newItems)
      this.loading = false
    },
    isCardsCreatedIsOverLimit () {
      if (this.actionIsMove) { return }
      const items = this.selectedItems().cards.length
      return this.$store.getters['currentUser/cardsCreatedWillBeOverLimit'](items)
    },
    async moveOrCopyToSpace () {
      if (this.loading) { return }
      const items = this.selectedItems()
      if (this.isCardsCreatedIsOverLimit()) {
        this.cardsCreatedIsOverLimit = true
        return
      }
      await this.copyToSelectedSpace(items)
      this.notifySuccess()
      if (this.actionIsMove) {
        this.removeCards(items.cards)
        this.removeBoxes(items.boxes)
        items.isRemoved = true
        this.$store.dispatch('history/resume')
        this.$store.dispatch('history/add', items)
      } else {
        this.$store.dispatch('currentUser/cardsCreatedCountUpdateBy', {
          delta: items.cards.length,
          shouldIncrement: true
        })
      }
      this.$store.dispatch('currentConnections/removeUnusedTypes')
      this.$store.dispatch('clearMultipleSelected')
      this.$store.dispatch('closeAllDialogs')
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
    },
    updateSelectedSpace (space) {
      this.selectedSpace = space
      this.spacePickerIsVisible = false
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      utils.scrollIntoView(element)
    },
    closeDialogs () {
      this.spacePickerIsVisible = false
    }
  },
  watch: {
    visible (visible) {
      this.$store.commit('clearNotificationsWithPosition')
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
.more-or-copy-cards
  top calc(100% - 8px)
  cursor initial
  .url-textarea
    max-height 100px
    width 100%
  .error-card-limit
    margin-top 10px
</style>
