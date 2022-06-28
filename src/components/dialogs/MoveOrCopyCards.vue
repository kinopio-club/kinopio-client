<template lang="pug">
dialog.narrow.more-or-copy-cards(v-if="visible" :open="visible" ref="dialog" @click.left.stop="closeDialogs")
  //- Copy Card Names
  section(v-if="!actionIsMove")
    textarea(ref="text") {{text()}}
    button(@click.left="copyText")
      img.icon.cut(src="@/assets/cut.svg")
      span Copy Content
    .row
      .badge.success(v-if="textIsCopied") Card Content Copied

  section
    .row
      p {{actionLabelCapitalized}} {{pluralCard}} to space
    .row
      .button-wrap
        button(@click.left.stop="toggleSpacePickerIsVisible" :class="{active: spacePickerIsVisible}")
          span {{selectedSpace.name}}
          img.down-arrow(src="@/assets/down-arrow.svg")
        SpacePicker(:visible="spacePickerIsVisible" :selectedSpace="selectedSpace" :shouldShowNewSpace="true" @selectSpace="updateSelectedSpace")
    button(@click.left="moveOrCopyToSpace" :class="{active: loading}")
      img.icon.visit(src="@/assets/visit.svg")
      span {{buttonLabel}}
      Loader(:visible="loading")

  .error-card-limit(v-if="cardsCreatedIsOverLimit")
    .badge.danger Out of Cards
    p To add more cards you'll need to upgrade
    button(@click.left.stop="triggerUpgradeUserIsVisible") Upgrade for Unlimited

</template>

<script>
import scrollIntoView from '@/scroll-into-view.js'
import cache from '@/cache.js'
import utils from '@/utils.js'
import SpacePicker from '@/components/dialogs/SpacePicker.vue'
import Loader from '@/components/Loader.vue'

export default {
  name: 'MoveOrCopyCards',
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
      textIsCopied: false,
      cardsCreatedIsOverLimit: false
    }
  },
  computed: {
    multipleCardsSelectedIds () {
      return utils.clone(this.$store.state.multipleCardsSelectedIds)
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
    },
    actionLabelCapitalized () { return utils.capitalizeFirstLetter(this.actionLabel) },
    buttonLabel () {
      const actionLabel = this.capitalize(this.actionLabel) // copy, move
      const pluralCard = this.capitalize(this.pluralCard) // card, cards
      return `${actionLabel} ${pluralCard} to Space`
    }
  },
  methods: {
    triggerUpgradeUserIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'MoveOrCopyToSpace')
      this.$store.commit('triggerUpgradeUserIsVisible')
    },
    capitalize (value) {
      return utils.capitalizeFirstLetter(value)
    },
    pastTense (value) {
      return utils.pastTense(value)
    },
    text () {
      return utils.textFromCardNames(this.exportData.cards)
    },
    copyText () {
      const element = this.$refs.text
      element.select()
      element.setSelectionRange(0, 99999) // for mobile
      document.execCommand('copy')
      this.textIsCopied = true
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
    notifySuccess () {
      const actionLabel = this.pastTense(this.actionLabel)
      const message = `${this.cardsCount} ${this.pluralCard} ${actionLabel} to ${this.selectedSpace.name}` // 3 cards copied to SpacePalace
      this.$store.commit('notifyMoveOrCopyToSpaceDetails', { id: this.selectedSpace.id, name: this.selectedSpace.name, message })
      this.$store.commit('notifyMoveOrCopyToSpace', true)
    },
    notifyNewSpaceSuccess (newSpace) {
      const actionLabel = this.pastTense(this.actionLabel)
      const message = `${newSpace.name} added with ${this.cardsCount} ${this.pluralCard} ${actionLabel} ` // SpacePalace added with 3 cards copied
      this.$store.commit('notifyMoveOrCopyToSpaceDetails', { id: newSpace.id, name: newSpace.name, message })
      this.$store.commit('notifyMoveOrCopyToSpace', true)
    },
    selectedItems () {
      const multipleCardsSelectedIds = this.$store.state.multipleCardsSelectedIds
      const cards = multipleCardsSelectedIds.map(id => this.$store.getters['currentCards/byId'](id))
      const connections = this.$store.getters['currentConnections/all'].filter(connection => {
        const isStartCardMatch = multipleCardsSelectedIds.includes(connection.startCardId)
        const isEndCardMatch = multipleCardsSelectedIds.includes(connection.endCardId)
        return isStartCardMatch && isEndCardMatch
      })
      const connectionTypeIds = connections.map(connection => connection.connectionTypeId)
      const connectionTypes = connectionTypeIds.map(id => this.$store.getters['currentConnections/typeByTypeId'](id))
      return { cards, connectionTypes, connections }
    },
    async copyToSelectedSpace (items) {
      this.loading = true
      const nullCardUsers = true
      const newItems = utils.uniqueSpaceItems(utils.clone(items), nullCardUsers)
      let { cards, connectionTypes, connections } = newItems
      cards = this.mapRemoteItems(cards)
      connectionTypes = this.mapRemoteItems(connectionTypes)
      connections = this.mapRemoteItems(connections)
      await this.$store.dispatch('api/createCards', cards)
      await this.$store.dispatch('api/createConnectionTypes', connectionTypes)
      await this.$store.dispatch('api/createConnections', connections)
      const spaceIsCached = Boolean(cache.space(this.selectedSpace.id).cards)
      if (!spaceIsCached) {
        const space = { id: this.selectedSpace.id }
        let remoteSpace = await this.$store.dispatch('api/getSpace', { space, shouldRequestRemote: true })
        cache.saveSpace(remoteSpace)
      }
      cache.addToSpace(newItems, this.selectedSpace.id)
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
      this.$store.dispatch('closeAllDialogs', 'MoveOrCopyToSpace.moveOrCopyToSpace')
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
          this.textIsCopied = false
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
  textarea
    background-color var(--secondary-background)
    border 0
    border-radius 3px
    padding 4px
    margin-bottom 4px
    height 60px
  .badge.success
    margin-top 10px
  .error-card-limit
    margin-top 10px
</style>
