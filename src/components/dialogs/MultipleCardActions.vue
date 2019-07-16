<template lang="pug">
dialog(v-if="visible" :open="visible" :style="position")
  section(:style="{backgroundColor: userColor}")
    .row(v-if="multipleCardsSelected")
      button(@click="connectCards") Connect
      button(@click="disconnectCards") Disconnect
    button(@click="removeCards")
      img.icon(src="@/assets/remove.svg")
      span Remove
</template>

<script>
import utils from '@/utils.js'

import _ from 'lodash'

export default {
  name: 'MultipleCardActions',
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
      const numberOfCards = this.$store.state.multipleCardsSelected.length
      return Boolean(numberOfCards > 1)
    }
  },
  methods: {
    connectionType () {
      const typePref = utils.getUserPref('defaultConnectionTypeId')
      const defaultType = this.$store.getters['currentSpace/connectionTypeById'](typePref)
      if (!defaultType) {
        this.$store.commit('currentSpace/addConnectionType', {})
      }
      const newConnectionType = _.last(this.$store.state.currentSpace.connectionTypes)
      return defaultType || newConnectionType
    },
    connectCards () {
      const connectionType = this.connectionType()
      let connections = this.$store.state.multipleCardsSelected.map((cardId, index, array) => {
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
        this.$store.commit('currentSpace/addConnection', { connection, connectionType })
      })
      this.$store.commit('currentSpace/removeUnusedConnectionTypes')
    },
    disconnectCards () {
      const cardIds = this.$store.state.multipleCardsSelected
      cardIds.forEach(cardId => {
        this.$store.commit('currentSpace/removeCardConnections', cardId)
      })
      this.$store.commit('currentSpace/removeUnusedConnectionTypes')
    },
    removeCards () {
      const cardIds = this.$store.state.multipleCardsSelected
      cardIds.forEach(cardId => {
        this.$store.dispatch('currentSpace/removeCard', cardId)
      })
      this.$store.commit('closeAllDialogs')
    }
  }
}
</script>

<style lang="stylus">
</style>
