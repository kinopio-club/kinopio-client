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
      button(@click="disconnectCards") Disconnect
    .row(v-if="connectionsIsSelected")
      .button-wrap
        button.change-color(@click.stop="toggleMultipleConnectionsPickerVisible")
          .segmented-colors.icon
            template(v-for="type in connectionTypes")
              .current-color(:style="{ background: type.color}")
        MultipleConnectionsPicker(:visible="multipleConnectionsPickerVisible" :selectedConnections="connections" :selectedConnectionTypes="connectionTypes")
  section
    .row
      button(@click="remove")
        img.icon(src="@/assets/remove.svg")
        span {{ removeLabel }}
      .button-wrap
        button(@click.stop="toggleExportIsVisible" :class="{ active: exportIsVisible }")
          span Export
        Export(:visible="exportIsVisible" :exportTitle="exportTitle" :exportData="exportData" :exportScope="exportScope")
    .button-wrap
      button(@click.stop="toggleToAnotherSpaceIsVisible" :class="{ active: toAnotherSpaceIsVisible }")
        img.icon.move(src="@/assets/move.svg")
        span To Another Space
      ToAnotherSpace(:visible="toAnotherSpaceIsVisible")

</template>

<script>
import last from 'lodash-es/last'
import uniq from 'lodash-es/uniq'
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil

import utils from '@/utils.js'
import Export from '@/components/dialogs/Export.vue'
import ToAnotherSpace from '@/components/dialogs/ToAnotherSpace.vue'
import MultipleConnectionsPicker from '@/components/dialogs/MultipleConnectionsPicker.vue'

export default {
  name: 'MultipleSelectedActions',
  components: {
    Export,
    ToAnotherSpace,
    MultipleConnectionsPicker
  },
  data () {
    return {
      exportIsVisible: false,
      toAnotherSpaceIsVisible: false,
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
    userColor () {
      return this.$store.state.currentUser.color
    },

    // cards

    multipleCardsSelectedIds () {
      return this.$store.state.multipleCardsSelectedIds
    },
    multipleCardsIsSelected () {
      return Boolean(this.multipleCardsSelectedIds.length > 1)
    },

    // connections

    connections () {
      return this.multipleConnectionsSelectedIds.map(id => {
        return this.$store.getters['currentSpace/connectionById'](id)
      })
    },
    multipleConnectionsSelectedIds () {
      return this.$store.state.multipleConnectionsSelectedIds
    },
    connectionTypes () {
      return uniq(this.multipleConnectionsSelectedIds.map(id => {
        const connection = this.$store.getters['currentSpace/connectionById'](id)
        return this.$store.getters['currentSpace/connectionTypeById'](connection.connectionTypeId)
      }))
    },
    connectionsIsSelected () {
      return Boolean(this.multipleConnectionsSelectedIds.length)
    },

    // all

    multipleItemsSelected () {
      const total = this.multipleConnectionsSelectedIds.length + this.multipleCardsSelectedIds.length
      return Boolean(total > 1)
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
      if (this.multipleItemsSelected) {
        return 'Remove All'
      } else {
        return 'Remove'
      }
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
    toggleMultipleConnectionsPickerVisible () {
      const isVisible = this.multipleConnectionsPickerVisible
      this.closeDialogs()
      this.multipleConnectionsPickerVisible = !isVisible
    },
    closeDialogs () {
      this.exportIsVisible = false
      this.toAnotherSpaceIsVisible = false
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
      const cardIds = this.multipleCardsSelectedIds
      const connectionIds = this.multipleConnectionsSelectedIds
      cardIds.forEach(cardId => {
        const card = this.$store.getters['currentSpace/cardById'](cardId)
        this.$store.dispatch('currentSpace/removeCard', card)
      })
      connectionIds.forEach(connectionId => {
        const connection = this.$store.getters['currentSpace/connectionById'](connectionId)
        this.$store.dispatch('currentSpace/removeConnection', connection)
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
