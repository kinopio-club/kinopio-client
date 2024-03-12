<template lang="pug">
dialog.narrow.multiple-selected-actions(
  v-if="visible"
  :open="visible"
  ref="dialog"
  @click.left="closeDialogs"
  :style="styles"
)
  .dark-theme-background-layer(v-if="isThemeDarkAndUserColorLight")
  section
    //- Edit Cards
    .row
      //- [·]
      .button-wrap.cards-checkboxes(v-if="cardsIsSelected" :class="{ disabled: !canEditAll.cards }")
        label(v-if="cardsHaveCheckboxes" :class="{active: cardsCheckboxIsChecked}" tabindex="0")
          input(type="checkbox" v-model="cardCheckboxes" tabindex="-1")
        label(v-if="!cardsHaveCheckboxes" @click.left.prevent="addCheckboxToCards" @keydown.stop.enter="addCheckboxToCards" tabindex="0")
          input.add(type="checkbox" tabindex="-1")
      //- Connect
      button(v-if="multipleCardsIsSelected" :class="{active: cardsIsConnected}" @click.left.prevent="toggleConnectCards" @keydown.stop.enter="toggleConnectCards" :disabled="!canEditAll.cards")
        img.icon.connector-icon(v-if="cardsIsConnected" src="@/assets/connector-closed.svg")
        img.icon.connector-icon(v-else src="@/assets/connector-open.svg")
        span Connect
      //- Share Card
      .button-wrap(v-if="oneCardIsSelected" @click.left.stop="toggleShareCardIsVisible")
        button(:class="{active: shareCardIsVisible}")
          span Share
        ShareCard(:visible="shareCardIsVisible" :card="cards[0]")

      //- More Options
      .button-wrap
        button(:disabled="!canEditAll.cards && !canEditAll.boxes" @click.left.stop="toggleShouldShowMultipleSelectedItemActions" :class="{active : shouldShowMultipleSelectedItemActions}")
          img.icon.down-arrow.button-down-arrow(src="@/assets/down-arrow.svg")

    CardOrBoxActions(:visible="shouldShowMultipleSelectedItemActions && (cardsIsSelected || boxesIsSelected)" :cards="cards" :boxes="boxes" @closeDialogs="closeDialogs" :class="{ 'last-row': !connectionsIsSelected }" :backgroundColor="userColor" :labelIsVisible="true")
    ConnectionActions(:visible="shouldShowMultipleSelectedItemActions && connectionsIsSelected" :connections="editableConnections" @closeDialogs="closeDialogs" :canEditAll="canEditAll" :backgroundColor="userColor")

  section
    template(v-if="oneCardOrMultipleBoxesIsSelected")
      .row
        //- Align And Distribute
        AlignAndDistribute(:visible="multipleCardOrBoxesIsSelected" :shouldHideMoreOptions="true" :shouldDistributeWithAlign="true" :numberOfSelectedItemsCreatedByCurrentUser="numberOfSelectedItemsCreatedByCurrentUser" :canEditAll="canEditAll" :cards="cards" :editableCards="cards" :connections="connections" :boxes="boxes" :editableBoxes="editableBoxes")
        //- Move/Copy
        .segmented-buttons.move-or-copy-wrap(v-if="cardsIsSelected")
          button(@click.left.stop="toggleCopyCardsIsVisible" :class="{ active: copyCardsIsVisible }")
            span Copy
            MoveOrCopyItems(:visible="copyCardsIsVisible" :actionIsMove="false")
          button(@click.left.stop="toggleMoveCardsIsVisible" :class="{ active: moveCardsIsVisible }" :disabled="!canEditAll.cards")
            span Move
            MoveOrCopyItems(:visible="moveCardsIsVisible" :actionIsMove="true")
      //- More Options
      AlignAndDistribute(:visible="multipleCardOrBoxesIsSelected && moreOptionsIsVisible" :numberOfSelectedItemsCreatedByCurrentUser="numberOfSelectedItemsCreatedByCurrentUser" :canEditAll="canEditAll" :cards="cards" :editableCards="cards" :connections="connections" :boxes="boxes" :editableBoxes="editableBoxes")

    .row
      //- Remove
      button.danger(:disabled="!canEditAll.all" @click.left="remove")
        img.icon(src="@/assets/remove.svg")
      //- Merge
      button(v-if="multipleCardsIsSelected" @click="mergeSelectedCards" :disabled="!canEditAll.cards")
        img.icon(src="@/assets/merge.svg")
        span Merge
      //- Split
      button(v-if="cardCanBeSplit" @click="splitCard" :disabled="!canEditAll.cards")
        img.icon(src="@/assets/split.svg")
        span Split

    p.badge.info(v-if="canEditAsNonMember && !selectedItemsIsCreatedByCurrentUser")
      img.icon.open(src="@/assets/open.svg")
      span In open spaces, you can only edit items you created
</template>

<script>
import utils from '@/utils.js'
import MoveOrCopyItems from '@/components/dialogs/MoveOrCopyItems.vue'
import CardOrBoxActions from '@/components/subsections/CardOrBoxActions.vue'
import ConnectionActions from '@/components/subsections/ConnectionActions.vue'
import AlignAndDistribute from '@/components/AlignAndDistribute.vue'
import ShareCard from '@/components/dialogs/ShareCard.vue'

import { nanoid } from 'nanoid'
import last from 'lodash-es/last'
import consts from '@/consts.js'

let prevCards, prevBoxes

export default {
  name: 'MultipleSelectedActions',
  components: {
    MoveOrCopyItems,
    CardOrBoxActions,
    ConnectionActions,
    AlignAndDistribute,
    ShareCard
  },
  data () {
    return {
      copyCardsIsVisible: false,
      moveCardsIsVisible: false,
      cardsIsConnected: false,
      cardsHaveCheckboxes: false,
      cardsCheckboxIsChecked: false,
      copyOnly: false,
      shareCardIsVisible: false
    }
  },
  computed: {
    isThemeDarkAndUserColorLight () {
      const isThemeDark = this.$store.state.currentUser.theme === 'dark'
      const userColorIsLight = !utils.colorIsDark(this.userColor)
      return isThemeDark && userColorIsLight
    },
    maxCardLength () { return consts.maxCardLength },
    shouldShowMultipleSelectedItemActions () { return this.$store.state.currentUser.shouldShowMultipleSelectedItemActions },
    visible () {
      const isSelectedItems = this.multipleConnectionsSelectedIds.length || this.multipleCardsSelectedIds.length || this.multipleBoxesSelectedIds.length
      return this.$store.state.multipleSelectedActionsIsVisible && isSelectedItems
    },
    moreOptionsIsVisible () { return this.$store.state.currentUser.shouldShowMoreAlignOptions },
    userColor () { return this.$store.state.currentUser.color },
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal },
    pinchCounterZoomDecimal () { return this.$store.state.pinchCounterZoomDecimal },
    spaceZoomDecimal () { return this.$store.getters.spaceZoomDecimal },
    oneCardOrMultipleBoxesIsSelected () { return this.cards.length || this.boxes.length > 1 },

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
        this.updateCardDimensions()
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

    // boxes

    boxesIsSelected () { return this.multipleBoxesSelectedIds.length > 0 },
    multipleBoxesSelectedIds () { return this.$store.state.multipleBoxesSelectedIds },
    boxes () {
      let boxes = this.multipleBoxesSelectedIds.map(boxId => {
        return this.$store.getters['currentBoxes/byId'](boxId)
      })
      boxes = boxes.filter(box => Boolean(box))
      prevBoxes = boxes
      return boxes
    },
    editableBoxes () {
      if (this.isSpaceMember) {
        return this.boxes
      } else {
        return this.boxes.filter(box => {
          return this.$store.getters['currentUser/boxIsCreatedByCurrentUser'](box)
        })
      }
    },

    // all

    multipleCardOrBoxesIsSelected () {
      const cards = this.multipleCardsIsSelected
      const boxes = this.multipleBoxesSelectedIds.length > 1
      return cards || boxes
    },
    canEditAsNonMember () {
      const spaceIsOpen = this.$store.state.currentSpace.privacy === 'open'
      const isSpaceMember = this.$store.getters['currentUser/isSpaceMember']()
      return spaceIsOpen && !isSpaceMember
    },
    selectedItemsIsCreatedByCurrentUser () {
      const { cards, connections, boxes } = this.numberOfSelectedItemsCreatedByCurrentUser
      const cardsByCurrentUser = cards === this.cards.length
      const connectionsByCurrentUser = connections === this.connections.length
      const boxesByCurrentUser = boxes === this.boxes.length
      if (cardsByCurrentUser && connectionsByCurrentUser && boxesByCurrentUser) {
        return true
      } else {
        return false
      }
    },
    numberOfSelectedItemsCreatedByCurrentUser () {
      const connections = this.connections.filter(Boolean)
      const cards = this.cards.filter(Boolean)
      const boxes = this.boxes.filter(Boolean)
      const connectionsCreatedByCurrentUser = connections.filter(connection => {
        return this.$store.getters['currentUser/connectionIsCreatedByCurrentUser'](connection)
      })
      const cardsCreatedByCurrentUser = cards.filter(card => {
        return this.$store.getters['currentUser/cardIsCreatedByCurrentUser'](card)
      })
      const boxesCreatedByCurrentUser = boxes.filter(box => {
        return this.$store.getters['currentUser/boxIsCreatedByCurrentUser'](box)
      })
      return {
        connections: connectionsCreatedByCurrentUser.length,
        cards: cardsCreatedByCurrentUser.length,
        boxes: boxesCreatedByCurrentUser.length
      }
    },
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    canEditAll () {
      if (this.isSpaceMember) { return { cards: true, connections: true, all: true } }
      const cards = this.multipleCardsSelectedIds.length === this.numberOfSelectedItemsCreatedByCurrentUser.cards
      const connections = this.multipleConnectionsSelectedIds.length === this.numberOfSelectedItemsCreatedByCurrentUser.connections
      const boxes = this.multipleBoxesSelectedIds.length === this.numberOfSelectedItemsCreatedByCurrentUser.boxes
      const all = cards && connections && boxes
      return { cards, connections, boxes, all }
    },
    multipleItemsSelected () {
      const total = this.multipleConnectionsSelectedIds.length + this.multipleCardsSelectedIds.length
      return Boolean(total > 1)
    },
    styles () {
      const position = this.$store.state.multipleSelectedActionsPosition
      let zoom = this.spaceCounterZoomDecimal
      if (this.$store.state.isTouchDevice) {
        zoom = 1 / utils.visualViewport().scale
      }
      return {
        backgroundColor: this.userColor,
        left: position.x + 'px',
        top: position.y + 'px',
        transform: `scale(${zoom})`
      }
    }
  },
  methods: {
    splitCard () {
      // open card details and trigger the split from there
      const cardId = this.cards[0].id
      this.$store.dispatch('clearMultipleSelected')
      this.$store.dispatch('closeAllDialogs')
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
          return {
            id: card.id,
            name: card.name,
            y: card.y,
            width: card.width,
            height: card.height
          }
        })
        this.$store.dispatch('currentCards/updateMultiple', newCards)
        this.$store.dispatch('closeAllDialogs')
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
      const urlPreview = {}
      cards.forEach(card => {
        name = `${name}\n\n${card.name.trim()}`

        Object.keys(card).forEach(key => {
          if (key.startsWith('urlPreview') && card[key] && !urlPreview[key]) {
            urlPreview[key] = card[key]
          }
        })
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
      this.remove({ shouldRemoveCardsOnly: true })
      // create merged cards
      newNames.forEach((newName, index) => {
        let newCard = {
          id: nanoid(),
          name: newName,
          x: position.x,
          y: position.y,
          ...urlPreview
        }
        newCards.push(newCard)
      })
      this.$store.dispatch('currentCards/addMultiple', { cards: newCards })
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
    toggleShareCardIsVisible () {
      const isVisible = this.shareCardIsVisible
      this.closeDialogs()
      this.shareCardIsVisible = !isVisible
    },
    toggleShouldShowMultipleSelectedItemActions () {
      this.closeDialogs()
      const isVisible = !this.shouldShowMultipleSelectedItemActions
      this.$store.dispatch('currentUser/shouldShowMultipleSelectedItemActions', isVisible)
      this.$nextTick(() => {
        this.scrollIntoView()
      })
    },
    closeDialogs () {
      this.copyCardsIsVisible = false
      this.moveCardsIsVisible = false
      this.shareCardIsVisible = false
      this.$store.commit('triggerCloseChildDialogs')
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
      let updatedCards = []
      this.cards.forEach(card => {
        if (!utils.checkboxFromString(card.name)) {
          const update = {
            id: card.id,
            name: `[] ${card.name}`
          }
          updatedCards.push(update)
        }
      })
      this.$store.dispatch('currentCards/updateMultiple', updatedCards)
      this.cardsHaveCheckboxes = true
    },
    updateCardDimensions () {
      const cards = utils.clone(this.cards)
      const cardIds = cards.map(card => card.id)
      this.$store.dispatch('currentCards/removeResize', { cardIds })
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
          const path = this.$store.getters['currentConnections/connectionPathBetweenCards'](startCardId, endCardId)
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
    remove ({ shouldRemoveCardsOnly }) {
      this.$store.dispatch('history/resume')
      this.editableConnections.forEach(connection => this.$store.dispatch('currentConnections/remove', connection))
      this.editableCards.forEach(card => this.$store.dispatch('currentCards/remove', card))
      if (!shouldRemoveCardsOnly) {
        this.editableBoxes.forEach(box => this.$store.dispatch('currentBoxes/remove', box))
      }
      this.$store.dispatch('closeAllDialogs')
      this.$store.dispatch('clearMultipleSelected')
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      utils.scrollIntoView({ element })
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
        this.$store.dispatch('history/add', { cards: prevCards, boxes: prevBoxes, useSnapshot: true })
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
        border-top-left-radius var(--small-entity-radius)
        border-bottom-left-radius var(--small-entity-radius)
      &:last-child
        border-top-right-radius var(--small-entity-radius)
        border-bottom-right-radius var(--small-entity-radius)
        margin-right 0
  .cards-checkboxes
    input
      margin 0
  .connector-icon
    width 11px
  .align-and-distribute + .move-or-copy-wrap
    margin-left 4px
  .more-options
    margin-bottom 10px
  .edit-connection-types
    flex-wrap wrap
    align-items flex-start
    .change-color
      display flex
      overflow hidden
      align-items center
      .segmented-colors
        max-width 14px
        margin-top 1px
        display flex

  .button-wrap.disabled
    opacity 0.5
    pointer-events none

  .style-actions + .connection-actions
    border-top 1px solid var(--primary-border)

</style>
