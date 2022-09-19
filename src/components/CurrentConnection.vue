<template lang="pug">
path.current-connection(
  v-if="isDrawingConnection"
  fill="none"
  stroke-width="5"
  :stroke="currentConnectionColor"
  :d="currentConnectionPath"
)

</template>

<script>
import utils from '@/utils.js'

import { nanoid } from 'nanoid'

let prevCursor, prevType

export default {
  name: 'CurrentConnection',
  props: {
    startCardId: String,
    startCursor: Object
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggeredDrawConnectionFrame') {
        prevCursor = this.$store.state.triggeredDrawConnectionFrame
        this.drawConnection()
      }
    })
  },

  mounted () {
    // bind events to window to receive events when mouse is outside window
    window.addEventListener('mousemove', this.interact)
    window.addEventListener('touchmove', this.interact)
    window.addEventListener('mouseup', this.stopInteractions)
    window.addEventListener('touchend', this.stopInteractions)
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        if (this.isDrawingConnection) {
          this.$store.commit('currentUserIsDrawingConnection', false)
          this.$store.dispatch('currentConnections/removeUnusedTypes')
        }
      }
    })
  },
  beforeUnmount () {
    window.removeEventListener('mousemove', this.interact)
    window.removeEventListener('touchmove', this.interact)
    window.removeEventListener('mouseup', this.stopInteractions)
    window.removeEventListener('touchend', this.stopInteractions)
  },
  data () {
    return {
      currentConnectionPath: undefined,
      currentConnectionColor: undefined
    }
  },
  computed: {
    isDrawingConnection () { return this.$store.state.currentUserIsDrawingConnection },
    connections () { return this.$store.getters['currentConnections/all'] },
    remoteCurrentConnections () { return this.$store.state.remoteCurrentConnections }
  },
  methods: {
    interact (event) {
      if (this.isDrawingConnection) {
        this.drawConnection()
      }
      prevCursor = utils.cursorPositionInSpace({ event })
    },
    // same as Space
    cursor () {
      let cursor
      if (utils.objectHasKeys(prevCursor)) {
        cursor = prevCursor
      } else {
        cursor = this.startCursor
      }
      return cursor
    },
    drawConnection () {
      let end = this.cursor()
      const startCardId = this.startCardId
      let start = utils.connectorCoords(startCardId)
      const path = utils.connectionPathBetweenCoords(start, end)
      // this.checkCurrentConnectionSuccess() TEMP
      this.currentConnectionPath = path
      const connectionType = this.$store.getters['currentConnections/typeForNewConnections']
      prevType = connectionType
      this.currentConnectionColor = connectionType.color
      this.$store.commit('currentConnectionColor', connectionType.color)
      const updates = {
        userId: this.$store.state.currentUser.id,
        connectionTypeId: connectionType.id,
        color: connectionType.color,
        startCardId,
        path
      }
      this.$store.commit('broadcast/updateStore', { updates, type: 'updateRemoteCurrentConnection' })
    },
    checkCurrentConnectionSuccess () {
      const cursor = this.cursor()
      // const zoom = this.spaceZoomDecimal
      const cardElement = utils.cardElementFromPosition(cursor.x, cursor.y)
      let updates = { userId: this.$store.state.currentUser.id }
      let isCurrentConnectionConnected
      if (cardElement) {
        isCurrentConnectionConnected = this.startCardId !== cardElement.dataset.cardId
      }
      if (!cardElement) {
        this.$store.commit('currentConnectionSuccess', {})
        updates.endCardId = null
        this.$store.commit('broadcast/updateStore', { updates, type: 'updateRemoteCurrentConnection' })
      } else if (isCurrentConnectionConnected) {
        const card = this.$store.getters['currentCards/byId'](cardElement.dataset.cardId)
        if (card.isLocked) {
          this.$store.commit('currentConnectionSuccess', {})
          return
        }
        this.$store.commit('currentConnectionSuccess', card)
        updates.endCardId = card.id
        this.$store.commit('broadcast/updateStore', { updates, type: 'updateRemoteCurrentConnection' })
      } else {
        this.$store.commit('currentConnectionSuccess', {})
      }
    },
    addConnection (connection) {
      this.$store.dispatch('currentConnections/addType', prevType)
      this.$store.dispatch('currentConnections/add', { connection, type: prevType })
    },
    createConnections (event) {
      const currentConnectionSuccess = this.$store.state.currentConnectionSuccess
      const startCardIds = this.$store.state.currentConnectionStartCardIds
      let endCardId
      if (currentConnectionSuccess.id) {
        endCardId = currentConnectionSuccess.id
      } else {
        let position = utils.cursorPositionInSpace({ event })
        endCardId = nanoid()
        this.$store.dispatch('currentCards/add', { position, id: endCardId })
      }
      // create connections to endCardId
      this.$nextTick(() => {
        startCardIds.forEach(startCardId => {
          const path = utils.connectionBetweenCards(startCardId, endCardId)
          const connection = { startCardId, endCardId, path }
          this.addConnection(connection)
        })
      })
    },
    stopInteractions (event) {
      if (this.isDrawingConnection) {
        this.$store.dispatch('clearMultipleSelected')
        this.createConnections(event)
      }
      this.$store.commit('currentConnectionSuccess', {})
      const isCurrentConnection = this.$store.state.currentConnectionStartCardIds.length
      if (isCurrentConnection) {
        this.$store.commit('currentConnectionStartCardIds', [])
        const updates = { userId: this.$store.state.currentUser.id }
        this.$store.commit('broadcast/updateStore', { updates, type: 'removeRemoteCurrentConnection' })
      }
      this.$store.commit('currentUserIsDrawingConnection', false)
      this.currentConnectionPath = undefined
      prevCursor = undefined
    }
  }
}
</script>

<style lang="stylus">
.current-connection
  pointer-events none
</style>
