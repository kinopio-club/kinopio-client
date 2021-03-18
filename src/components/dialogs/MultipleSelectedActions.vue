<template lang="pug">
dialog.narrow.multiple-selected-actions(
  v-if="visible"
  :open="visible"
  ref="dialog"
  @click.left="closeDialogs"
  :style="{backgroundColor: userColor, left: position.left, top: position.top, zoom: spaceCounterZoomDecimal}"
)
  section(v-if="cardsIsSelected || connectionsIsSelected")
    .row(v-if="cardsIsSelected")
      //- [·]
      .button-wrap.cards-checkboxes
        label(v-if="cardsHaveCheckboxes" :class="{active: cardsCheckboxIsChecked}" tabindex="0")
          input(type="checkbox" v-model="cardCheckboxes" tabindex="-1")
        label(v-else @click.left.prevent="addCheckboxToCards" @keydown.stop.enter="addCheckboxToCards" tabindex="0")
          input.add(type="checkbox" tabindex="-1")
      //- Connect
      button(v-if="multipleCardsIsSelected" :class="{active: cardsIsConnected}" @click.left.prevent="toggleConnectCards" @keydown.stop.enter="toggleConnectCards")
        img.icon.connector-icon(v-if="cardsIsConnected" src="@/assets/connector-closed.svg")
        img.icon.connector-icon(v-else src="@/assets/connector-open.svg")
        span Connect
      //- Frames
      .button-wrap(:class="{active: framePickerIsVisible}" @click.left.stop="toggleFramePickerIsVisible")
        button Frames
        FramePicker(:visible="framePickerIsVisible" :cards="cards")
    .row(v-if="connectionsIsSelected")
      //- Type Color
      .button-wrap
        button.change-color(:disabled="!canEditSome.connections" @click.left.stop="toggleMultipleConnectionsPickerVisible")
          .segmented-colors.icon
            template(v-for="type in connectionTypes")
              .current-color(:style="{ background: type.color }")
        MultipleConnectionsPicker(:visible="multipleConnectionsPickerVisible" :selectedConnections="editableConnections" :selectedConnectionTypes="editableConnectionTypes")
      //- Labels
      button(:disabled="!canEditSome.connections" :class="{active: allLabelsAreVisible}" @click.left="toggleAllLabelsAreVisible")
        img.icon(v-if="allLabelsAreVisible" src="@/assets/view.svg")
        img.icon(v-else src="@/assets/view-hidden.svg")
        span {{ pluralLabels }}
  section
    .row
      //- Remove
      button(:disabled="!canEditSome.any" @click.left="remove")
        img.icon(src="@/assets/remove.svg")
        span {{ removeLabel }}
      //- Export
      .button-wrap
        button(@click.left.stop="toggleExportIsVisible" :class="{ active: exportIsVisible }")
          img.icon.visit(src="@/assets/export.svg")
          span Export
        Export(:visible="exportIsVisible" :exportTitle="exportTitle" :exportData="exportData" :exportScope="exportScope")

    template(v-if="multipleCardsSelectedIds.length")
      .row
        //- Align And Distribute
        AlignAndDistribute(:visible="multipleCardsIsSelected" :shouldHideMoreOptions="true" :shouldAutoDistribute="true" :numberOfSelectedItemsCreatedByCurrentUser="numberOfSelectedItemsCreatedByCurrentUser")
        //- Move/Copy
        .button-wrap.move-or-copy-wrap
          button(@click.left.stop="toggleMoveOrCopyToSpaceIsVisible" :class="{ active: moveOrCopyToSpaceIsVisible }")
            span(v-if="!canEditAll.cards") Copy
            span(v-else) Move or Copy
          MoveOrCopyToSpace(:visible="moveOrCopyToSpaceIsVisible" :copyOnly="!canEditAll.cards")
      //- More Options
      AlignAndDistribute(:visible="multipleCardsIsSelected && moreOptionsIsVisible" :numberOfSelectedItemsCreatedByCurrentUser="numberOfSelectedItemsCreatedByCurrentUser")

    p(v-if="canEditAsNonMember && !selectedItemsIsCreatedByCurrentUser")
      span.badge.info
        img.icon.open(src="@/assets/open.svg")
        span In open spaces, you can only edit cards and connections you've made
</template>

<script>
import nanoid from 'nanoid'
import last from 'lodash-es/last'
import uniq from 'lodash-es/uniq'

import scrollIntoView from '@/scroll-into-view.js'
import utils from '@/utils.js'
import Export from '@/components/dialogs/Export.vue'
import MoveOrCopyToSpace from '@/components/dialogs/MoveOrCopyToSpace.vue'
import MultipleConnectionsPicker from '@/components/dialogs/MultipleConnectionsPicker.vue'
import FramePicker from '@/components/dialogs/FramePicker.vue'
import AlignAndDistribute from '@/components/AlignAndDistribute.vue'

export default {
  name: 'MultipleSelectedActions',
  components: {
    Export,
    MoveOrCopyToSpace,
    MultipleConnectionsPicker,
    FramePicker,
    AlignAndDistribute
  },
  data () {
    return {
      exportIsVisible: false,
      moveOrCopyToSpaceIsVisible: false,
      multipleConnectionsPickerVisible: false,
      framePickerIsVisible: false,
      cardsIsConnected: false,
      cardsHaveCheckboxes: false,
      cardsCheckboxIsChecked: false,
      copyOnly: false
    }
  },
  computed: {
    visible () { return this.$store.state.multipleSelectedActionsIsVisible },
    moreOptionsIsVisible () { return this.$store.state.currentUser.shouldShowMoreAlignOptions },
    position () {
      const cursor = this.$store.state.multipleSelectedActionsPosition
      return {
        left: `${cursor.x}px`,
        top: `${cursor.y}px`
      }
    },
    userColor () { return this.$store.state.currentUser.color },
    pluralLabels () { return utils.pluralize('Label', this.multipleConnectionsSelectedIds.length > 1) },
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal },

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
    selectedItemsIsCreatedByCurrentUser () {
      const cardsByCurrentUser = this.numberOfSelectedItemsCreatedByCurrentUser.cards === this.cards.length
      const connectionsByCurrentUser = this.numberOfSelectedItemsCreatedByCurrentUser.connections === this.connections.length
      if (cardsByCurrentUser && connectionsByCurrentUser) {
        return true
      } else {
        return false
      }
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
    connectionType (event) {
      const typePref = this.$store.state.currentUser.defaultConnectionTypeId
      const defaultType = this.$store.getters['currentSpace/connectionTypeById'](typePref)
      if (!defaultType && !event.shiftKey) {
        this.$store.dispatch('currentSpace/addConnectionType')
      }
      const connectionType = last(this.$store.state.currentSpace.connectionTypes)
      return defaultType || connectionType
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
    toggleConnectCards (event) {
      if (this.cardsIsConnected) {
        this.disconnectCards()
      } else {
        this.connectCards(event)
      }
      this.checkIsCardsConnected()
    },
    connectCards (event) {
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
      const connectionType = this.connectionType(event)
      connections.forEach(connection => {
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
      this.$store.dispatch('closeAllDialogs', 'MultipleSelectedActions.remove')
      this.$store.dispatch('clearMultipleSelected')
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
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
  .connector-icon
    width 11px
  .align-and-distribute + .move-or-copy-wrap
    margin-left 6px
</style>
