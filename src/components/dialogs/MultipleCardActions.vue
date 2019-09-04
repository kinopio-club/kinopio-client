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
</template>

<script>
import utils from '@/utils.js'
import Export from '@/components/dialogs/Export.vue'

import _ from 'lodash'

let observer

export default {
  name: 'MultipleCardActions',
  components: {
    Export
  },
  data () {
    return {
      exportIsVisible: false
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
    multipleCardsSelected () {
      return this.$store.state.multipleCardsSelected
    },
    multipleCardsIsSelected () {
      const numberOfCards = this.multipleCardsSelected.length
      return Boolean(numberOfCards > 1)
    },
    exportScope () {
      return 'cards'
    },
    exportTitle () {
      const numberOfCards = this.multipleCardsSelected.length
      let title = 'Card'
      if (numberOfCards > 1) { title = `${numberOfCards} Cards` }
      return title
    },
    exportData () {
      return {}
    }
  },
  methods: {
    toggleExportIsVisible () {
      const isVisible = this.exportIsVisible
      this.closeDialogs()
      this.exportIsVisible = !isVisible
    },
    closeDialogs () {
      this.exportIsVisible = false
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
      let connections = this.multipleCardsSelected.map((cardId, index, array) => {
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
      const cardIds = this.multipleCardsSelected
      cardIds.forEach(cardId => {
        this.$store.dispatch('currentSpace/removeSelectedConnectionsFromCard', cardId)
      })
      this.$store.commit('currentSpace/removeUnusedConnectionTypes')
    },
    removeCards () {
      const cardIds = this.multipleCardsSelected
      cardIds.forEach(cardId => {
        this.$store.dispatch('currentSpace/removeCard', cardId)
      })
      this.$store.commit('closeAllDialogs')
      this.$store.commit('multipleCardsSelected', [])
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      observer = new IntersectionObserver((entries) => {
        let top, left
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            const clientRect = entry.boundingClientRect
            const intersectionRect = entry.intersectionRect
            top = (clientRect.height - intersectionRect.height) + 8
            left = (clientRect.width - intersectionRect.width) + 8
            if (clientRect.x < 0) {
              left = -left
            }
            window.scrollBy({ top, left, behavior: 'smooth' })
          } else {
            observer.disconnect()
          }
        })
      }, { threshold: 1 })
      observer.observe(element)
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
