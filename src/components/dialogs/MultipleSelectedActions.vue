<template lang="pug">
dialog.narrow.multiple-selected-actions(
  v-if="visible"
  :open="visible"
  ref="dialog"
  @click.left="closeDialogs"
  :style="styles"
)
  section(v-if="cardsIsSelected || connectionsIsSelected")
    //- Edit Cards
    .row(v-if="cardsIsSelected")
      //- [·]
      .button-wrap.cards-checkboxes(:class="{ disabled: !canEditAll.cards }")
        label(v-if="cardsHaveCheckboxes" :class="{active: cardsCheckboxIsChecked}" tabindex="0")
          input(type="checkbox" v-model="cardCheckboxes" tabindex="-1")
        label(v-if="!cardsHaveCheckboxes" @click.left.prevent="addCheckboxToCards" @keydown.stop.enter="addCheckboxToCards" tabindex="0")
          input.add(type="checkbox" tabindex="-1")
      //- Connect
      button(v-if="multipleCardsIsSelected" :class="{active: cardsIsConnected}" @click.left.prevent="toggleConnectCards" @keydown.stop.enter="toggleConnectCards" :disabled="!canEditAll.cards")
        img.icon.connector-icon(v-if="cardsIsConnected" src="@/assets/connector-closed.svg")
        img.icon.connector-icon(v-else src="@/assets/connector-open.svg")
        span Connect
      //- Style
      .button-wrap
        button(:disabled="!canEditAll.cards" @click.left.stop="toggleCardStyleActionsIsVisible" :class="{active : cardStyleActionsIsVisible}")
          span Style

    CardStyleActions(:visible="cardStyleActionsIsVisible" :cards="cards" @closeDialogs="closeDialogs" :class="{ 'last-row': !connectionsIsSelected }")

    //- Edit Connections
    .row.edit-connection-types(v-if="connectionsIsSelected")
      //- Type Color
      .button-wrap
        button.change-color(:disabled="!canEditAll.connections" @click.left.stop="toggleMultipleConnectionsPickerVisible")
          img.icon(src="@/assets/connection-path.svg")
          .segmented-colors.icon
            template(v-for="type in connectionTypes")
              .current-color(:style="{ background: type.color }")
        MultipleConnectionsPicker(:visible="multipleConnectionsPickerVisible" :selectedConnections="editableConnections" :selectedConnectionTypes="editableConnectionTypes")
      //- Arrows or Label
      ConnectionDecorators(:connections="editableConnections")

  section
    .row
      //- Remove
      button(:disabled="!canEditAll.all" @click.left="remove")
        img.icon(src="@/assets/remove.svg")
        span Remove All
      //- Merge
      button(v-if="multipleCardsIsSelected" @click="mergeSelectedCards" :disabled="!canEditAll.cards")
        img.icon(src="@/assets/merge.svg")
        span Merge
      //- Split
      button(v-if="cardCanBeSplit" @click="splitCard" :disabled="!canEditAll.cards")
        img.icon(src="@/assets/split.svg")
        span Split

    template(v-if="multipleCardsSelectedIds.length")
      .row
        //- Align And Distribute
        AlignAndDistribute(:visible="multipleCardsIsSelected" :shouldHideMoreOptions="true" :shouldAutoDistribute="true" :numberOfSelectedItemsCreatedByCurrentUser="numberOfSelectedItemsCreatedByCurrentUser")
        //- Move/Copy
        .segmented-buttons.move-or-copy-wrap
          button(@click.left.stop="toggleCopyCardsIsVisible" :class="{ active: copyCardsIsVisible }")
            span Copy
            MoveOrCopyCards(:visible="copyCardsIsVisible" :actionIsMove="false" :exportData="exportData")
          button(@click.left.stop="toggleMoveCardsIsVisible" :class="{ active: moveCardsIsVisible }" :disabled="!canEditAll.cards")
            span Move
            MoveOrCopyCards(:visible="moveCardsIsVisible" :actionIsMove="true" :exportData="exportData")
      //- More Options
      AlignAndDistribute(:visible="multipleCardsIsSelected && moreOptionsIsVisible" :numberOfSelectedItemsCreatedByCurrentUser="numberOfSelectedItemsCreatedByCurrentUser")

    p(v-if="canEditAsNonMember && !selectedItemsIsCreatedByCurrentUser")
      span.badge.info
        img.icon.open(src="@/assets/open.svg")
        span In open spaces, you can only edit cards and connections you've made
</template>

<script>
import utils from '@/utils.js'
import MoveOrCopyCards from '@/components/dialogs/MoveOrCopyCards.vue'
import MultipleConnectionsPicker from '@/components/dialogs/MultipleConnectionsPicker.vue'
import CardStyleActions from '@/components/CardStyleActions.vue'
import AlignAndDistribute from '@/components/AlignAndDistribute.vue'
import ConnectionDecorators from '@/components/ConnectionDecorators.vue'

import { nanoid } from 'nanoid'
import last from 'lodash-es/last'
import uniq from 'lodash-es/uniq'
import uniqBy from 'lodash-es/uniqBy'

let prevCards

export default {
  name: 'MultipleSelectedActions',
  components: {
    MoveOrCopyCards,
    MultipleConnectionsPicker,
    CardStyleActions,
    AlignAndDistribute,
    ConnectionDecorators
  },
  data () {
    return {
      copyCardsIsVisible: false,
      moveCardsIsVisible: false,
      multipleConnectionsPickerVisible: false,
      cardsIsConnected: false,
      cardsHaveCheckboxes: false,
      cardsCheckboxIsChecked: false,
      copyOnly: false
    }
  },
  computed: {
    maxCardLength () { return utils.maxCardLength() },
    cardStyleActionsIsVisible () { return this.$store.state.currentUser.shouldShowMultiCardStyleActions && this.cardsIsSelected },
    visible () { return this.$store.state.multipleSelectedActionsIsVisible },
    moreOptionsIsVisible () { return this.$store.state.currentUser.shouldShowMoreAlignOptions },
    position () {
      const cursor = this.$store.state.multipleSelectedActionsPosition
      const zoom = this.$store.getters.spaceCounterZoomDecimal
      return {
        left: `${cursor.x * zoom}px`,
        top: `${cursor.y * zoom}px`
      }
    },
    userColor () { return this.$store.state.currentUser.color },
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal },
    pinchCounterZoomDecimal () { return this.$store.state.pinchCounterZoomDecimal },
    spaceZoomDecimal () { return this.$store.getters.spaceZoomDecimal },

    // cards

    multipleCardsSelectedIds () { return this.$store.state.multipleCardsSelectedIds },
    cardCanBeSplit () {
      if (!this.oneCardIsSelected) { return }
      if (!this.cards.length) { return }
      if (!this.cards[0].name) { return }
      return this.cards[0].name.includes('\n')
    },
    oneCardIsSelected () { return this.multipleCardsSelectedIds.length === 1 },
    cardsIsSelected () { return this.multipleCardsSelectedIds.length > 0 },
    multipleCardsIsSelected () { return this.multipleCardsSelectedIds.length > 1 },
    cards () {
      let cards = this.multipleCardsSelectedIds.map(cardId => {
        return this.$store.getters['currentCards/byId'](cardId)
      })
      cards = cards.filter(card => Boolean(card))
      prevCards = cards
      return cards
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
        if (this.cardsCheckboxIsChecked) {
          this.cards.forEach(card => {
            this.$store.dispatch('currentCards/removeChecked', card.id)
          })
        } else {
          this.cards.forEach(card => {
            this.$store.dispatch('currentCards/toggleChecked', { cardId: card.id, value })
          })
        }
        this.checkCardsHaveCheckboxes()
        this.checkCardsCheckboxIsChecked()
      }
    },

    // connections

    multipleConnectionsSelectedIds () { return this.$store.state.multipleConnectionsSelectedIds },
    connectionsIsSelected () { return Boolean(this.multipleConnectionsSelectedIds.length) },
    connections () {
      let connections = this.multipleConnectionsSelectedIds.map(id => {
        return this.$store.getters['currentConnections/byId'](id)
      })
      connections = connections.filter(connection => Boolean(connection))
      return connections
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
      let types = uniq(this.multipleConnectionsSelectedIds)
      types = types.map(id => {
        const connection = this.$store.getters['currentConnections/byId'](id)
        if (!connection) { return }
        return this.$store.getters['currentConnections/typeByTypeId'](connection.connectionTypeId)
      })
      types = types.filter(type => Boolean(type))
      types = uniqBy(types, 'id')
      types = uniqBy(types, 'color')
      return types
    },
    editableConnectionTypes () {
      return uniq(this.editableConnections.map(connection => {
        return this.$store.getters['currentConnections/typeByTypeId'](connection.connectionTypeId)
      }))
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
    exportData () {
      const cards = this.multipleCardsSelectedIds.map(cardId => {
        return this.$store.getters['currentCards/byId'](cardId)
      })
      return { 'cards': cards }
    },
    styles () {
      let zoom
      if (utils.isSignificantlyPinchZoomed()) {
        zoom = this.pinchCounterZoomDecimal
      } else {
        zoom = this.spaceCounterZoomDecimal
      }
      return {
        backgroundColor: this.userColor,
        left: this.position.left,
        top: this.position.top,
        transform: `scale(${zoom})`
      }
    }
  },
  methods: {
    splitCard () {
      // open card details and trigger the split from there
      const cardId = this.cards[0].id
      this.$store.dispatch('clearMultipleSelected')
      this.$store.dispatch('closeAllDialogs', 'MultipleSelectedActions.splitCard')
      this.$store.commit('preventCardDetailsOpeningAnimation', true)
      this.$store.commit('cardDetailsIsVisibleForCardId', cardId)
      this.$store.commit('triggerSplitCard', cardId)
    },
    positionNewCards (newCards) {
      const spaceBetweenCards = 12
      this.$nextTick(() => {
        newCards = newCards.map((card, index) => {
          if (!index) { return card }
          const prevCard = newCards[index - 1]
          const element = document.querySelector(`article [data-card-id="${prevCard.id}"]`)
          const prevCardRect = element.getBoundingClientRect()
          card.y = prevCard.y + (prevCardRect.height * this.spaceCounterZoomDecimal) + spaceBetweenCards
          return card
        })
        newCards = newCards.map(card => {
          card = utils.updateCardDimensions(card)
          this.$store.dispatch('currentCards/update', {
            id: card.id,
            name: card.name,
            y: card.y,
            width: card.width,
            height: card.height
          })
          return card
        })
        this.$store.dispatch('closeAllDialogs', 'MultipleSelectedActions.positionNewCards')
      })
    },
    cardsSortedByY () {
      return this.cards.sort((a, b) => {
        return a.y - b.y
      })
    },
    mergeSelectedCards () {
      let name = ''
      const cards = this.cardsSortedByY()
      cards.forEach(card => {
        name = `${name}\n\n${card.name.trim()}`
      })
      name = name.trim()
      let newNames = []
      // split names while > maxCardLength
      do {
        let newName = name.substring(0, this.maxCardLength)
        const lastSpace = newName.lastIndexOf(' ')
        const lastLineBreak = newName.lastIndexOf('\n')
        const shouldSplitByMaxLength = lastSpace === -1 && lastLineBreak === -1
        if (name.length < this.maxCardLength) {
          newName = name
          name = ''
        } else if (shouldSplitByMaxLength) {
          // newName = newName
          name = name.substring(this.maxCardLength)
        } else if (lastSpace >= lastLineBreak) {
          newName = name.substring(0, lastSpace)
          name = name.substring(lastSpace)
        } else {
          newName = name.substring(0, lastLineBreak)
          name = name.substring(lastLineBreak)
        }
        newNames.push(newName)
      } while (name.length > this.maxCardLength)

      newNames.push(name)
      newNames = newNames.filter(name => Boolean(name))
      let position = { x: cards[0].x, y: cards[0].y }
      let newCards = []
      this.remove()
      // create merged cards
      newNames.forEach((newName, index) => {
        let newCard = {
          id: nanoid(),
          name: newName,
          x: position.x,
          y: position.y
        }
        newCards.push(newCard)
      })
      this.$store.dispatch('currentCards/addMultiple', newCards)
      prevCards = newCards // for history
      this.positionNewCards(newCards)
    },
    toggleCopyCardsIsVisible () {
      const isVisible = this.copyCardsIsVisible
      this.closeDialogs()
      this.copyCardsIsVisible = !isVisible
    },
    toggleMoveCardsIsVisible () {
      const isVisible = this.moveCardsIsVisible
      this.closeDialogs()
      this.moveCardsIsVisible = !isVisible
    },
    toggleMultipleConnectionsPickerVisible () {
      const isVisible = this.multipleConnectionsPickerVisible
      this.closeDialogs()
      this.multipleConnectionsPickerVisible = !isVisible
    },
    toggleCardStyleActionsIsVisible () {
      this.closeDialogs()
      const isVisible = !this.$store.state.currentUser.shouldShowMultiCardStyleActions
      this.$store.dispatch('currentUser/shouldShowMultiCardStyleActions', isVisible)
      this.$nextTick(() => {
        this.scrollIntoView()
      })
    },
    closeDialogs () {
      this.copyCardsIsVisible = false
      this.moveCardsIsVisible = false
      this.multipleConnectionsPickerVisible = false
      this.$store.commit('triggerCardDetailsCloseDialogs')
    },
    connectionType (event) {
      let connectionType = last(this.$store.getters['currentConnections/allTypes'])
      const shouldUseLastConnectionType = this.$store.state.currentUser.shouldUseLastConnectionType
      const shiftKey = event.shiftKey
      const shouldAddType = !connectionType || (shouldUseLastConnectionType && shiftKey) || (!shouldUseLastConnectionType && !shiftKey)
      if (shouldAddType) {
        this.$store.dispatch('currentConnections/addType')
      }
      connectionType = last(this.$store.getters['currentConnections/allTypes'])
      return connectionType
    },
    connectionAlreadyExists (startCardId, endCardId) {
      const connections = this.$store.getters['currentConnections/all']
      const existingConnection = connections.find(connection => {
        const isStart = connection.startCardId === startCardId
        const isEnd = connection.endCardId === endCardId
        return isStart && isEnd
      })
      return Boolean(existingConnection)
    },
    checkCardsHaveCheckboxes () {
      const cardsWithCheckboxes = this.cards.filter(card => {
        if (!card) { return }
        return utils.checkboxFromString(card.name)
      })
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
          this.$store.dispatch('currentCards/update', update)
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
      this.$store.dispatch('history/resume')
      if (this.cardsIsConnected) {
        this.disconnectCards()
      } else {
        this.connectCards(event)
      }
      this.checkIsCardsConnected()
      this.$store.dispatch('history/pause')
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
      const type = this.connectionType(event)
      connections.forEach(connection => {
        this.$store.dispatch('currentConnections/add', { connection, type })
        this.$store.dispatch('addToMultipleConnectionsSelected', connection.id)
      })
    },
    disconnectCards () {
      const cardIds = this.multipleCardsSelectedIds
      cardIds.forEach(cardId => {
        this.$store.dispatch('currentConnections/removeFromSelectedCard', cardId)
      })
      this.$store.dispatch('currentConnections/removeUnusedTypes')
    },
    remove () {
      this.$store.dispatch('history/resume')
      this.editableConnections.forEach(connection => this.$store.dispatch('currentConnections/remove', connection))
      this.editableCards.forEach(card => this.$store.dispatch('currentCards/remove', card))
      this.$store.dispatch('closeAllDialogs', 'MultipleSelectedActions.remove')
      this.$store.dispatch('clearMultipleSelected')
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      utils.scrollIntoView(element)
    },
    updatePinchCounterZoomDecimal () {
      this.$store.commit('pinchCounterZoomDecimal', utils.pinchCounterZoomDecimal())
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.checkCardsHaveCheckboxes()
        this.checkCardsCheckboxIsChecked()
        this.$nextTick(() => {
          this.updatePinchCounterZoomDecimal()
          this.checkIsCardsConnected()
          this.$store.dispatch('currentConnections/removeUnusedTypes')
          this.scrollIntoView()
          this.closeDialogs()
        })
        this.$store.dispatch('history/snapshots')
      } else {
        this.$store.dispatch('history/resume')
        this.$store.dispatch('history/add', { cards: prevCards, useSnapshot: true })
      }
    }
  }
}
</script>

<style lang="stylus">
.multiple-selected-actions
  transform-origin top left
  .segmented-colors
    display inline-block
    vertical-align middle
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
  .edit-connection-types
    .change-color
      height 24px
      max-width 50px
      padding-top 3px
      display flex
      overflow hidden
      img
        margin-top 3px
      .segmented-colors
        margin-left 5px
        max-width 56px
        margin-top 1px
  .button-wrap.disabled
    opacity 0.5
    pointer-events none

</style>
