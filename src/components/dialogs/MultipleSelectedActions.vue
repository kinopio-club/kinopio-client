<template lang="pug">
dialog.narrow.multiple-selected-actions(
  v-if="visible"
  :open="visible"
  ref="dialog"
  @click="closeDialogs"
  :style="{backgroundColor: userColor, left: position.left, top: position.top}"
)
  section(v-if="cardsIsSelected || connectionsIsSelected")
    .row(v-if="cardsIsSelected")
      //- [·]
      .button-wrap.cards-checkboxes
        label(v-if="cardsHaveCheckboxes" :class="{active: cardsCheckboxIsChecked}" tabindex="0")
          input(type="checkbox" v-model="cardCheckboxes" tabindex="-1")
        label(v-else @click.prevent="addCheckboxToCards" @keydown.stop.enter="addCheckboxToCards" tabindex="0")
          input.add(type="checkbox" tabindex="-1")
      //- Connect
      label(v-if="multipleCardsIsSelected" :class="{active: cardsIsConnected}" @click.prevent="toggleConnectCards" @keydown.stop.enter="toggleConnectCards")
        input(type="checkbox" v-model="cardsIsConnected")
        span Connect
      //- Frames
      .button-wrap(:class="{active: framePickerIsVisible}" @click.stop="toggleFramePickerIsVisible")
        button Frames
        FramePicker(:visible="framePickerIsVisible" :cards="cards")
    .row(v-if="connectionsIsSelected")
      //- Type Color
      .button-wrap
        button.change-color(:disabled="!canEditSome.connections" @click.stop="toggleMultipleConnectionsPickerVisible")
          .segmented-colors.icon
            template(v-for="type in connectionTypes")
              .current-color(:style="{ background: type.color }")
        MultipleConnectionsPicker(:visible="multipleConnectionsPickerVisible" :selectedConnections="editableConnections" :selectedConnectionTypes="editableConnectionTypes")
      //- Labels
      button(:disabled="!canEditSome.connections" :class="{active: allLabelsAreVisible}" @click="toggleAllLabelsAreVisible")
        img.icon(src="@/assets/view.svg")
        span {{ pluralLabels }}
  section
    .row
      button(:disabled="!canEditSome.any" @click="remove")
        img.icon(src="@/assets/remove.svg")
        span {{ removeLabel }}
      .button-wrap
        button(@click.stop="toggleExportIsVisible" :class="{ active: exportIsVisible }")
          span Export
        Export(:visible="exportIsVisible" :exportTitle="exportTitle" :exportData="exportData" :exportScope="exportScope")
    .row(v-if="multipleCardsSelectedIds.length")
      button(v-if="multipleCardsIsSelected" :disabled="!canEditSome.cards" @click="alignCards")
        img.icon(src="@/assets/align.svg")
      .button-wrap
        button(:disabled="!canEditAll.cards" @click.stop="toggleMoveOrCopyToSpaceIsVisible" :class="{ active: moveOrCopyToSpaceIsVisible }")
          img.icon.visit(src="@/assets/visit.svg")
          span Move or Copy
        MoveOrCopyToSpace(:visible="moveOrCopyToSpaceIsVisible")

    p(v-if="canEditAsNonMember")
      span.badge.info
        img.icon.open(src="@/assets/open.svg")
        span In open spaces, you can only edit cards and connections you've made
</template>

<script>
import nanoid from 'nanoid'
import last from 'lodash-es/last'
import uniq from 'lodash-es/uniq'
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil

import utils from '@/utils.js'
import Export from '@/components/dialogs/Export.vue'
import MoveOrCopyToSpace from '@/components/dialogs/MoveOrCopyToSpace.vue'
import MultipleConnectionsPicker from '@/components/dialogs/MultipleConnectionsPicker.vue'
import FramePicker from '@/components/dialogs/FramePicker.vue'

export default {
  name: 'MultipleSelectedActions',
  components: {
    Export,
    MoveOrCopyToSpace,
    MultipleConnectionsPicker,
    FramePicker
  },
  data () {
    return {
      exportIsVisible: false,
      moveOrCopyToSpaceIsVisible: false,
      multipleConnectionsPickerVisible: false,
      framePickerIsVisible: false,
      cardsIsConnected: false,
      cardsHaveCheckboxes: false,
      cardsCheckboxIsChecked: false
    }
  },
  computed: {
    visible () { return this.$store.state.multipleSelectedActionsIsVisible },
    position () {
      const cursor = this.$store.state.multipleSelectedActionsPosition
      return {
        left: `${cursor.x}px`,
        top: `${cursor.y}px`
      }
    },
    userColor () { return this.$store.state.currentUser.color },
    pluralLabels () { return utils.pluralize('Label', this.multipleConnectionsSelectedIds.length > 1) },

    // cards

    multipleCardsSelectedIds () { return this.$store.state.multipleCardsSelectedIds },
    cardsIsSelected () { return Boolean(this.multipleCardsSelectedIds.length > 0) },
    multipleCardsIsSelected () { return Boolean(this.multipleCardsSelectedIds.length > 1) },
    cards () {
      return this.multipleCardsSelectedIds.map(cardId => {
        return this.$store.getters['currentSpace/cardById'](cardId)
      })
    },
    editableCards () {
      if (this.isSpaceMember) {
        return this.cards
      } else {
        return this.cards.filter(card => {
          return this.$store.getters['currentUser/cardIsCreatedByCurrentUser'](card)
        })
      }
    },
    cardCheckboxes: {
      get () {
        return this.cardsCheckboxIsChecked
      },
      set (value) {
        this.cards.forEach(card => {
          this.$store.dispatch('currentSpace/toggleCardChecked', { cardId: card.id, value })
        })
        this.checkCardsCheckboxIsChecked()
      }
    },

    // connections

    multipleConnectionsSelectedIds () { return this.$store.state.multipleConnectionsSelectedIds },
    connectionsIsSelected () { return Boolean(this.multipleConnectionsSelectedIds.length) },
    connections () {
      return this.multipleConnectionsSelectedIds.map(id => {
        return this.$store.getters['currentSpace/connectionById'](id)
      })
    },
    editableConnections () {
      const connections = this.connections
      if (this.isSpaceMember) {
        return connections
      } else {
        return connections.filter(connection => {
          return this.$store.getters['currentUser/connectionIsCreatedByCurrentUser'](connection)
        })
      }
    },
    connectionTypes () {
      const connectionTypes = uniq(this.multipleConnectionsSelectedIds.map(id => {
        const connection = this.$store.getters['currentSpace/connectionById'](id)
        return this.$store.getters['currentSpace/connectionTypeById'](connection.connectionTypeId)
      }))
      return connectionTypes
    },
    editableConnectionTypes () {
      return uniq(this.editableConnections.map(connection => {
        return this.$store.getters['currentSpace/connectionTypeById'](connection.connectionTypeId)
      }))
    },
    allLabelsAreVisible () {
      if (!this.editableConnections.length) { return }
      const connections = this.editableConnections
      const labelled = connections.filter(connection => connection.labelIsVisible)
      return labelled.length === connections.length
    },

    // all

    canEditAsNonMember () {
      const spaceIsOpen = this.$store.state.currentSpace.privacy === 'open'
      const isSpaceMember = this.$store.getters['currentUser/isSpaceMember']()
      return spaceIsOpen && !isSpaceMember
    },
    numberOfSelectedItemsCreatedByCurrentUser () {
      const connections = this.connections.filter(Boolean)
      const cards = this.cards.filter(Boolean)
      const connectionsCreatedByCurrentUser = connections.filter(connection => {
        return this.$store.getters['currentUser/connectionIsCreatedByCurrentUser'](connection)
      })
      const cardsCreatedByCurrentUser = cards.filter(card => {
        return this.$store.getters['currentUser/cardIsCreatedByCurrentUser'](card)
      })
      return {
        connections: connectionsCreatedByCurrentUser.length,
        cards: cardsCreatedByCurrentUser.length
      }
    },
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    canEditSome () {
      if (this.isSpaceMember) { return { cards: true, connections: true, any: true } }
      const cards = this.numberOfSelectedItemsCreatedByCurrentUser.cards > 0
      const connections = this.numberOfSelectedItemsCreatedByCurrentUser.connections > 0
      const any = cards || connections
      return { cards, connections, any }
    },
    canEditAll () {
      if (this.isSpaceMember) { return { cards: true, connections: true, all: true } }
      const cards = this.multipleCardsSelectedIds.length === this.numberOfSelectedItemsCreatedByCurrentUser.cards
      const connections = this.multipleConnectionsSelectedIds.length === this.numberOfSelectedItemsCreatedByCurrentUser.connections
      const all = cards && connections
      return { cards, connections, all }
    },
    multipleItemsSelected () {
      const total = this.multipleConnectionsSelectedIds.length + this.multipleCardsSelectedIds.length
      return Boolean(total > 1)
    },
    exportScope () { return 'cards' },
    exportTitle () {
      const numberOfCards = this.numberOfCardsSelected
      let title = 'Card'
      if (numberOfCards > 1) { title = `${numberOfCards} Cards` }
      return title
    },
    exportData () {
      const cards = this.multipleCardsSelectedIds.map(cardId => {
        return this.$store.getters['currentSpace/cardById'](cardId)
      })
      return { 'cards': cards }
    },
    removeLabel () {
      if (this.multipleItemsSelected && this.canEditAll.all) {
        return 'Remove All'
      } else if (this.multipleItemsSelected && this.canEditSome.any) {
        return 'Remove Some'
      } else if (this.multipleItemsSelected) {
        return 'Remove All'
      } else {
        return 'Remove'
      }
    }
  },
  methods: {
    toggleAllLabelsAreVisible () {
      const isVisible = !this.allLabelsAreVisible
      this.editableConnections.forEach(connection => {
        this.$store.dispatch('currentSpace/updateLabelIsVisibleForConnection', {
          connectionId: connection.id,
          labelIsVisible: isVisible
        })
      })
    },
    toggleExportIsVisible () {
      const isVisible = this.exportIsVisible
      this.closeDialogs()
      this.exportIsVisible = !isVisible
    },
    toggleMoveOrCopyToSpaceIsVisible () {
      const isVisible = this.moveOrCopyToSpaceIsVisible
      this.closeDialogs()
      this.moveOrCopyToSpaceIsVisible = !isVisible
    },
    toggleMultipleConnectionsPickerVisible () {
      const isVisible = this.multipleConnectionsPickerVisible
      this.closeDialogs()
      this.multipleConnectionsPickerVisible = !isVisible
    },
    toggleFramePickerIsVisible () {
      const isVisible = this.framePickerIsVisible
      this.closeDialogs()
      this.framePickerIsVisible = !isVisible
    },
    closeDialogs () {
      this.exportIsVisible = false
      this.moveOrCopyToSpaceIsVisible = false
      this.multipleConnectionsPickerVisible = false
      this.framePickerIsVisible = false
    },
    connectionType () {
      const typePref = this.$store.state.currentUser.defaultConnectionTypeId
      const defaultType = this.$store.getters['currentSpace/connectionTypeById'](typePref)
      if (!defaultType) {
        this.$store.dispatch('currentSpace/addConnectionType')
      }
      const newConnectionType = last(this.$store.state.currentSpace.connectionTypes)
      return defaultType || newConnectionType
    },
    connectionAlreadyExists (startCardId, endCardId) {
      const connections = this.$store.state.currentSpace.connections
      const existingConnection = connections.find(connection => {
        const isStart = connection.startCardId === startCardId
        const isEnd = connection.endCardId === endCardId
        return isStart && isEnd
      })
      return Boolean(existingConnection)
    },
    checkCardsHaveCheckboxes () {
      const cardsWithCheckboxes = this.cards.filter(card => utils.checkboxFromString(card.name))
      this.cardsHaveCheckboxes = cardsWithCheckboxes.length === this.cards.length
    },
    checkCardsCheckboxIsChecked () {
      const cardsChecked = this.cards.filter(card => utils.nameIsChecked(card.name))
      this.cardsCheckboxIsChecked = cardsChecked.length === this.cards.length
    },
    addCheckboxToCards () {
      this.cards.forEach(card => {
        if (!utils.checkboxFromString(card.name)) {
          const update = {
            id: card.id,
            name: `[] ${card.name}`
          }
          this.$store.dispatch('currentSpace/updateCard', update)
        }
      })
      this.cardsHaveCheckboxes = true
    },
    checkIsCardsConnected () {
      const selectedCards = this.multipleCardsSelectedIds
      const connections = selectedCards.filter((cardId, index) => {
        const startCardId = selectedCards[index - 1]
        const endCardId = cardId
        const connectionExists = this.connectionAlreadyExists(startCardId, endCardId)
        const connectionExistsReverse = this.connectionAlreadyExists(endCardId, startCardId)
        if (connectionExists || connectionExistsReverse) { return true }
      })
      if (connections.length === selectedCards.length - 1) {
        this.cardsIsConnected = true
      } else {
        this.cardsIsConnected = false
      }
    },
    toggleConnectCards () {
      if (this.cardsIsConnected) {
        this.disconnectCards()
      } else {
        this.connectCards()
      }
      this.checkIsCardsConnected()
    },
    connectCards () {
      const cardIds = this.multipleCardsSelectedIds
      let connections = cardIds.map((cardId, index) => {
        if (index + 1 < cardIds.length) { // create connections for middle cards
          const startCardId = cardId
          const endCardId = cardIds[index + 1]
          if (this.connectionAlreadyExists(startCardId, endCardId)) { return }
          const id = nanoid()
          const path = utils.connectionBetweenCards(startCardId, endCardId)
          return {
            id, startCardId, endCardId, path
          }
        }
      })
      connections = connections.filter(Boolean)
      connections.forEach(connection => {
        const connectionType = this.connectionType()
        this.$store.dispatch('currentSpace/addConnection', { connection, connectionType })
        this.$store.dispatch('addToMultipleConnectionsSelected', connection.id)
      })
    },
    disconnectCards () {
      const cardIds = this.multipleCardsSelectedIds
      cardIds.forEach(cardId => {
        this.$store.dispatch('currentSpace/removeSelectedConnectionsFromCard', cardId)
      })
      this.$store.dispatch('currentSpace/removeUnusedConnectionTypes')
    },
    remove () {
      this.editableConnections.forEach(connection => this.$store.dispatch('currentSpace/removeConnection', connection))
      this.editableCards.forEach(card => this.$store.dispatch('currentSpace/removeCard', card))
      this.$store.dispatch('closeAllDialogs')
      this.$store.dispatch('clearMultipleSelected')
    },
    alignCards () {
      const x = this.editableCards[0].x
      this.editableCards.forEach(card => {
        card = utils.clone(card)
        card.x = x
        this.$store.dispatch('currentSpace/updateCard', card)
        this.$nextTick(() => {
          this.$store.dispatch('currentSpace/updateCardConnectionPaths', { cardId: card.id, shouldUpdateApi: true })
        })
      })
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      scrollIntoView(element, {
        behavior: 'smooth',
        scrollMode: 'if-needed'
      })
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.checkIsCardsConnected()
          this.checkCardsHaveCheckboxes()
          this.checkCardsCheckboxIsChecked()
          this.$store.dispatch('currentSpace/removeUnusedConnectionTypes')
          this.scrollIntoView()
          this.closeDialogs()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
.multiple-selected-actions
  .segmented-colors
    display: inline-block
    vertical-align: middle
    .current-color
      display inline-block
      vertical-align bottom
      // margin-right 3px
      border-radius 0
      &:first-child
        border-top-left-radius 3px
        border-bottom-left-radius 3px
      &:last-child
        border-top-right-radius 3px
        border-bottom-right-radius 3px
        margin-right 0
  .cards-checkboxes
    input
      margin 0

</style>
