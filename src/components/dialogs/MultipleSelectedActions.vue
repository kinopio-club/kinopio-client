<template lang="pug">
dialog.narrow.multiple-selected-actions(v-if="visible" :open="visible" :style="position" ref="dialog" @click="closeDialogs")
  section(:style="{backgroundColor: userColor}")
    //- p 2 Cards
    //- .row(v-if="connectionTypes.length")
    //-   .button-wrap
    //-     button.change-color
    //-       .segmented-colors.icon
    //-         template(v-for="type in connectionTypes")
    //-           .current-color(:style="{ background: type.color}")

    .row(v-if="multipleCardsIsSelected")
      button(@click="connectCards") Connect
      button(@click="disconnectCards") Disconnect
    //- TODO if connectionsSelected
    //- section(:style="{backgroundColor: userColor}" v-if="multipleCardsIsSelected")
    //- p 2 Connections
    //- button blue/purp
        //-span Connections

    //- section(:style="{backgroundColor: userColor}")
    .row
      .button-wrap
        button(@click.stop="toggleToAnotherSpaceIsVisible" :class="{ active: toAnotherSpaceIsVisible }")
          img.icon.move(src="@/assets/move.svg")
          span To Another Space
        ToAnotherSpace(:visible="toAnotherSpaceIsVisible")

    .button-wrap
      button(@click.stop="toggleExportIsVisible" :class="{ active: exportIsVisible }")
        span Export
      Export(:visible="exportIsVisible" :exportTitle="exportTitle" :exportData="exportData" :exportScope="exportScope")

  section(:style="{backgroundColor: userColor}")
    button(@click="removeCards")
      img.icon(src="@/assets/remove.svg")
      span {{ removeLabel }}

</template>

<script>
import last from 'lodash-es/last'
import uniqBy from 'lodash-es/uniqBy'
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil

import utils from '@/utils.js'
import Export from '@/components/dialogs/Export.vue'
import ToAnotherSpace from '@/components/dialogs/ToAnotherSpace.vue'

export default {
  name: 'MultipleSelectedActions',
  components: {
    Export,
    ToAnotherSpace
  },
  data () {
    return {
      exportIsVisible: false,
      toAnotherSpaceIsVisible: false
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
    userColor () {
      return this.$store.state.currentUser.color
    },
    multipleCardsSelectedIds () {
      return this.$store.state.multipleCardsSelectedIds
    },
    numberOfCardsSelected () {
      return this.multipleCardsSelectedIds.length
    },
    multipleCardsIsSelected () {
      return Boolean(this.numberOfCardsSelected > 1)
    },
    exportScope () {
      return 'cards'
    },
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
      if (this.multipleCardsIsSelected) { // TODO: || multipleConnectionsIsSelected
        return 'Remove All'
      } else {
        return 'Remove'
      }
    },
    connections () {
      const connections = this.multipleCardsSelectedIds.map(cardId => this.$store.getters['currentSpace/cardConnections'](cardId))
      let normalized = connections.flat()
      normalized = uniqBy(normalized, 'id')
      return normalized
    },
    connectionTypes () {
      const connections = uniqBy(this.connections, 'connectionTypeId')
      return connections.map(connection => this.$store.getters['currentSpace/connectionTypeById'](connection.connectionTypeId))
    }
  },
  methods: {
    toggleExportIsVisible () {
      const isVisible = this.exportIsVisible
      this.closeDialogs()
      this.exportIsVisible = !isVisible
    },
    toggleToAnotherSpaceIsVisible () {
      const isVisible = this.toAnotherSpaceIsVisible
      this.closeDialogs()
      this.toAnotherSpaceIsVisible = !isVisible
    },
    closeDialogs () {
      this.exportIsVisible = false
      this.toAnotherSpaceIsVisible = false
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
    connectCards () {
      const connectionType = this.connectionType()
      let connections = this.multipleCardsSelectedIds.map((cardId, index, array) => {
        if (index + 1 < array.length) {
          const startCardId = cardId
          const endCardId = array[index + 1]
          const path = utils.connectionBetweenCards(startCardId, endCardId)
          return {
            startCardId, endCardId, path
          }
        }
      })
      connections = connections.filter(Boolean)
      connections.forEach(connection => {
        this.$store.dispatch('currentSpace/addConnection', { connection, connectionType })
      })
    },
    disconnectCards () {
      const cardIds = this.multipleCardsSelectedIds
      cardIds.forEach(cardId => {
        this.$store.dispatch('currentSpace/removeSelectedConnectionsFromCard', cardId)
      })
      this.$store.dispatch('currentSpace/removeUnusedConnectionTypes')
    },
    removeCards () {
      const cardIds = this.multipleCardsSelectedIds
      cardIds.forEach(cardId => {
        const card = this.$store.state.currentSpace.cards.find(card => card.id === cardId)
        this.$store.dispatch('currentSpace/removeCard', card)
      })
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
