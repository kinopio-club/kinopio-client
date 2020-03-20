<template lang="pug">
dialog.narrow.multiple-selected-actions(
  v-if="visible"
  :open="visible"
  ref="dialog"
  @click="closeDialogs"
  :style="{backgroundColor: userColor, left: position.left, top: position.top}"
)
  section(v-if="multipleCardsIsSelected || connectionsIsSelected")
    .row(v-if="multipleCardsIsSelected")
      button(@click="connectCards") Connect
      button(:disabled="!canEditSome.cards" @click="disconnectCards") Disconnect
    .row(v-if="connectionsIsSelected")
      .button-wrap
        button.change-color(:disabled="!canEditSome.connections" @click.stop="toggleMultipleConnectionsPickerVisible")
          .segmented-colors.icon
            template(v-for="type in connectionTypes")
              .current-color(:style="{ background: type.color }")
        MultipleConnectionsPicker(:visible="multipleConnectionsPickerVisible" :selectedConnections="editableConnections" :selectedConnectionTypes="editableConnectionTypes")
      button(:disabled="!canEditSome.connections" :class="{active: allLabelsAreVisible}" @click="toggleAllLabelsAreVisible")
        img.icon(src="@/assets/view.svg")
        span Labels

  section
    .row
      button(:disabled="!canEditSome.any" @click="remove")
        img.icon(src="@/assets/remove.svg")
        span {{ removeLabel }}
      .button-wrap
        button(@click.stop="toggleExportIsVisible" :class="{ active: exportIsVisible }")
          span Export
        Export(:visible="exportIsVisible" :exportTitle="exportTitle" :exportData="exportData" :exportScope="exportScope")
    .button-wrap(v-if="multipleCardsSelectedIds.length")
      button(:disabled="!canEditAll.cards" @click.stop="toggleMoveToSpaceIsVisible" :class="{ active: moveToSpaceIsVisible }")
        img.icon.visit(src="@/assets/visit.svg")
        span Move
      MoveToSpace(:visible="moveToSpaceIsVisible")

    template(v-if="canEditAsNonMember")
      p
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
import MoveToSpace from '@/components/dialogs/MoveToSpace.vue'
import MultipleConnectionsPicker from '@/components/dialogs/MultipleConnectionsPicker.vue'

export default {
  name: 'MultipleSelectedActions',
  components: {
    Export,
    MoveToSpace,
    MultipleConnectionsPicker
  },
  data () {
    return {
      exportIsVisible: false,
      moveToSpaceIsVisible: false,
      multipleConnectionsPickerVisible: false
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

    // cards

    multipleCardsSelectedIds () { return this.$store.state.multipleCardsSelectedIds },
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
    toggleMoveToSpaceIsVisible () {
      const isVisible = this.moveToSpaceIsVisible
      this.closeDialogs()
      this.moveToSpaceIsVisible = !isVisible
    },
    toggleMultipleConnectionsPickerVisible () {
      const isVisible = this.multipleConnectionsPickerVisible
      this.closeDialogs()
      this.multipleConnectionsPickerVisible = !isVisible
    },
    closeDialogs () {
      this.exportIsVisible = false
      this.moveToSpaceIsVisible = false
      this.multipleConnectionsPickerVisible = false
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
        this.$store.commit('addToMultipleConnectionsSelected', connection.id)
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
      this.$store.commit('closeAllDialogs')
      this.$store.commit('clearMultipleSelected')
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

</style>
