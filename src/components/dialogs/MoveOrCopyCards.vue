<template lang="pug">
dialog.narrow.more-or-copy-cards(v-if="visible" :open="visible" ref="dialog" @click.left.stop="closeDialogs")
  section
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
        input(placeholder="name" v-model="newSpaceName" @keyup.space.prevent)
      button(@click.left="moveOrCopyToSpace" :class="{active: loading}")
        img.icon.visit(src="@/assets/visit.svg")
        span {{buttonLabel}}
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
        button(@click.left="moveOrCopyToSpace" :class="{active: loading}")
          img.icon.visit(src="@/assets/visit.svg")
          span {{buttonLabel}}
          Loader(:visible="loading")

  //- Copy Card Names
  section(v-if="!actionIsMove")
    textarea(ref="text") {{text()}}
    button(@click.left="copyText")
      span Copy Card Names
    .row
      .badge.success(v-if="textIsCopied") Card Names Copied

</template>

<script>
import scrollIntoView from '@/scroll-into-view.js'
import cache from '@/cache.js'
import utils from '@/utils.js'
import SpacePicker from '@/components/dialogs/SpacePicker.vue'
import Loader from '@/components/Loader.vue'
import words from '@/data/words.js'
import newSpace from '@/data/new.json'
import nanoid from 'nanoid'
import join from 'lodash-es/join'

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
      toNewSpace: false,
      newSpaceName: '',
      textIsCopied: false
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
    buttonLabel () {
      const actionLabel = this.capitalize(this.actionLabel) // copy, move
      const pluralCard = this.capitalize(this.pluralCard) // card, cards
      return `${actionLabel} ${pluralCard}`
    }
  },
  methods: {
    capitalize (value) {
      return utils.capitalizeFirstLetter(value)
    },
    pastTense (value) {
      return utils.pastTense(value)
    },
    text () {
      const data = this.exportData.cards.map(card => { return card.name })
      return join(data, '\n')
    },
    copyText () {
      const element = this.$refs.text
      element.select()
      element.setSelectionRange(0, 99999) // for mobile
      document.execCommand('copy')
      this.textIsCopied = true
    },
    hideToNewSpace () {
      this.closeDialogs()
      this.toNewSpace = false
    },
    showToNewSpace () {
      this.closeDialogs()
      this.toNewSpace = true
    },
    toggleSpacePickerIsVisible () {
      this.spacePickerIsVisible = !this.spacePickerIsVisible
    },
    removeCards (cards) {
      cards.forEach(card => {
        this.$store.dispatch('currentSpace/removeCard', card)
        this.$store.dispatch('currentSpace/removeConnectionsFromCard', card)
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

    async createNewSpace (items, newSpaceName) {
      this.loading = true
      items = utils.clone(items)
      let space = utils.clone(newSpace)
      space.name = newSpaceName
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
      const nullCardUsers = true
      const newItems = utils.uniqueSpaceItems(utils.clone(items), nullCardUsers)
      let { cards, connectionTypes, connections } = newItems
      cards = this.mapRemoteItems(cards)
      connectionTypes = this.mapRemoteItems(connectionTypes)
      connections = this.mapRemoteItems(connections)
      console.log('🚚 copy or move', cards, connectionTypes, connections)
      await this.$store.dispatch('api/updateCards', cards)
      await this.$store.dispatch('api/updateConnectionTypes', connectionTypes)
      await this.$store.dispatch('api/updateConnections', connections)
      const spaceIsCached = Boolean(cache.space(this.selectedSpace.id).cards)
      if (!spaceIsCached) {
        const space = { id: this.selectedSpace.id }
        let remoteSpace = await this.$store.dispatch('api/getSpace', { space, shouldRequestRemote: true })
        cache.saveSpace(remoteSpace)
      }
      cache.addToSpace(newItems, this.selectedSpace.id)
      this.loading = false
    },

    async moveOrCopyToSpace () {
      if (this.loading) { return }
      const newSpaceName = this.newSpaceName || words.randomUniqueName()
      const items = this.selectedItems()
      let selectedSpace = this.selectedSpace
      if (this.toNewSpace) {
        selectedSpace = await this.createNewSpace(items, newSpaceName)
        this.notifyNewSpaceSuccess(selectedSpace)
      } else {
        await this.copyToSelectedSpace(items)
        this.notifySuccess()
      }
      if (this.actionIsMove) {
        this.removeCards(items.cards)
      }
      this.$store.dispatch('currentSpace/removeUnusedConnectionTypes')
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
          this.newSpaceName = words.randomUniqueName()
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

</style>
