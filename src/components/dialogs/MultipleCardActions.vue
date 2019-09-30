<template lang="pug">
dialog.narrow(v-if="visible" :open="visible" :style="position" ref="dialog" @click="closeDialogs")
  section(:style="{backgroundColor: userColor}" v-if="multipleCardsIsSelected")
    button(@click="connectCards") Connect
    button(@click="disconnectCards") Disconnect
  section(:style="{backgroundColor: userColor}")
    button(@click="removeCards")
      img.icon(src="@/assets/remove.svg")
      span Remove
    .button-wrap
      button(@click.stop="toggleExportIsVisible" :class="{ active: exportIsVisible }")
        span Export
      Export(:visible="exportIsVisible" :exportTitle="exportTitle" :exportData="exportData" :exportScope="exportScope")
  section(:style="{backgroundColor: userColor}")
    .button-wrap
      button(@click.stop="toggleToAnotherSpaceIsVisible" :class="{ active: toAnotherSpaceIsVisible }")
        img.icon.move(src="@/assets/move.svg")
        span To Another Space
      ToAnotherSpace(:visible="toAnotherSpaceIsVisible")

</template>

<script>
import _ from 'lodash'
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil

import utils from '@/utils.js'
import Export from '@/components/dialogs/Export.vue'
import ToAnotherSpace from '@/components/dialogs/ToAnotherSpace.vue'

export default {
  name: 'MultipleCardActions',
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
    visible () { return this.$store.state.multipleCardActionsIsVisible },
    position () {
      const cursor = this.$store.state.multipleCardActionsPosition
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
    multipleCardsIsSelected () {
      const numberOfCards = this.multipleCardsSelectedIds.length
      return Boolean(numberOfCards > 1)
    },
    exportScope () {
      return 'cards'
    },
    exportTitle () {
      const numberOfCards = this.multipleCardsSelectedIds.length
      let title = 'Card'
      if (numberOfCards > 1) { title = `${numberOfCards} Cards` }
      return title
    },
    exportData () {
      const cards = this.multipleCardsSelectedIds.map(cardId => {
        return this.$store.getters['currentSpace/cardById'](cardId)
      })
      return { 'cards': cards }
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
        this.$store.commit('currentSpace/addConnectionType', {})
      }
      const newConnectionType = _.last(this.$store.state.currentSpace.connectionTypes)
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
      this.$store.commit('currentSpace/removeUnusedConnectionTypes')
    },
    removeCards () {
      const cardIds = this.multipleCardsSelectedIds
      cardIds.forEach(cardId => {
        this.$store.dispatch('currentSpace/removeCard', cardId)
      })
      this.$store.commit('closeAllDialogs')
      this.$store.commit('multipleCardsSelectedIds', [])
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
</style>
