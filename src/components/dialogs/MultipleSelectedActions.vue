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
      button(v-if="canEditSome" @click="disconnectCards") Disconnect
    .row(v-if="connectionsIsSelected && canEditConnections")
      .button-wrap
        button.change-color(@click.stop="toggleMultipleConnectionsPickerVisible")
          .segmented-colors.icon
            template(v-for="type in connectionTypes")
              .current-color(:style="{ background: type.color}")
        MultipleConnectionsPicker(:visible="multipleConnectionsPickerVisible" :selectedConnections="editableConnections" :selectedConnectionTypes="editableConnectionTypes")
      button(:class="{active: allLabelsAreVisible}" @click="toggleAllLabelsAreVisible")
        img.icon(src="@/assets/view.svg")
        span Labels

  section
    .row
      button(v-if="canEditSome" @click="remove")
        img.icon(src="@/assets/remove.svg")
        span {{ removeLabel }}
      .button-wrap
        button(@click.stop="toggleExportIsVisible" :class="{ active: exportIsVisible }")
          span Export
        Export(:visible="exportIsVisible" :exportTitle="exportTitle" :exportData="exportData" :exportScope="exportScope")
    .button-wrap(v-if="multipleCardsSelectedIds.length && canEditSome")
      button(@click.stop="toggleMoveToSpaceIsVisible" :class="{ active: moveToSpaceIsVisible }")
        img.icon.visit(src="@/assets/visit.svg")
        span Move
      MoveToSpace(:visible="moveToSpaceIsVisible")

    template(v-if="canEditAsNonMember")
      p
        span.badge.info
          img.icon.open(src="@/assets/open.svg")
          span In open spaces, you can only edit cards and connections you've made

        // caneditmultiple space is open, not a member
    //- [globe] can only perform bulk operations if you made the cards and connections that are selected

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
      const isSpaceMember = this.$store.getters['currentUser/isSpaceMember']()
      if (isSpaceMember) {
        return this.cards
      } else {
        return this.cards.filter(card => {
          return this.$store.getters['currentUser/cardIsCreatedByCurrentUser'](card)
        })
      }
    },
    canEditCards () {
      const isSpaceMember = this.$store.getters['currentUser/isSpaceMember']()
      if (isSpaceMember) { return true }
      const canEditSpace = this.$store.getters['currentUser/canEditSpace']()
      const cardsCreatedByCurrentUser = this.cards.filter(card => {
        return this.$store.getters['currentUser/cardIsCreatedByCurrentUser'](card)
      })
      if (canEditSpace && Boolean(cardsCreatedByCurrentUser.length)) { return true }
      return false
    },

    // connections

    connections () {
      return this.multipleConnectionsSelectedIds.map(id => {
        return this.$store.getters['currentSpace/connectionById'](id)
      })
    },
    editableConnections () {
      const isSpaceMember = this.$store.getters['currentUser/isSpaceMember']()
      if (isSpaceMember) {
        return this.connections
      } else {
        return this.connections.filter(connection => {
          return this.$store.getters['currentUser/connectionIsCreatedByCurrentUser'](connection)
        })
      }
    },
    multipleConnectionsSelectedIds () { return this.$store.state.multipleConnectionsSelectedIds },
    connectionTypes () {
      return uniq(this.multipleConnectionsSelectedIds.map(id => {
        const connection = this.$store.getters['currentSpace/connectionById'](id)
        if (!connection) { return }
        return this.$store.getters['currentSpace/connectionTypeById'](connection.connectionTypeId)
      }))
    },
    editableConnectionTypes () {
      return uniq(this.editableConnections.map(connection => {
        return this.$store.getters['currentSpace/connectionTypeById'](connection.connectionTypeId)
      }))
    },
    connectionsIsSelected () { return Boolean(this.multipleConnectionsSelectedIds.length) },
    allLabelsAreVisible () {
      const connections = this.editableConnections
      const labelled = connections.filter(connection => connection.labelIsVisible)
      return labelled.length === connections.length
    },
    canEditConnections () {
      const isSpaceMember = this.$store.getters['currentUser/isSpaceMember']()
      if (isSpaceMember) { return true }
      const canEditSpace = this.$store.getters['currentUser/canEditSpace']()
      const connectionsCreatedByCurrentUser = this.connections.filter(connection => {
        return this.$store.getters['currentUser/connectionIsCreatedByCurrentUser'](connection)
      })
      // const allConnectionsCreatedByCurrentUser = Boolean(connectionsCreatedByCurrentUser.length === this.connections.length)
      if (canEditSpace && Boolean(connectionsCreatedByCurrentUser.length)) { return true }
      return false
    },

    // all

    canEditAsNonMember () {
      const spaceIsOpen = this.$store.state.currentSpace.privacy === 'open'
      const isSpaceMember = this.$store.getters['currentUser/isSpaceMember']()
      return spaceIsOpen && !isSpaceMember
    },

    canEditSome () {
      return this.canEditCards || this.canEditConnections
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
      if (this.multipleItemsSelected) {
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
        // else {
        //   this.$store.commit('clearMultipleSelected')
        // }
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
