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

let prevCursor

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
    remoteCurrentConnections () { return this.$store.state.remoteCurrentConnections },
    spaceZoomDecimal () { return this.$store.getters.spaceZoomDecimal }
  },
  methods: {
    interact (event) {
      if (this.isDrawingConnection) {
        this.drawConnection()
      }
      prevCursor = utils.cursorPositionInViewport(event)
    },
    // same as Space
    cursor () {
      const zoom = this.$store.getters.spaceCounterZoomDecimal
      let cursor
      if (utils.objectHasKeys(prevCursor)) {
        cursor = prevCursor
      } else {
        cursor = this.startCursor
      }
      cursor = {
        x: cursor.x * zoom,
        y: cursor.y * zoom
      }
      return cursor
    },
    drawConnection () {
      const zoom = this.spaceZoomDecimal
      let end = this.cursor()
      if (zoom !== 1) {
        end = {
          x: end.x * zoom,
          y: end.y * zoom
        }
      }
      const startCardId = this.startCardId
      const start = utils.connectorCoords(startCardId)
      const path = utils.connectionPathBetweenCoords(start, end)
      this.checkCurrentConnectionSuccess()
      this.currentConnectionPath = path
      const connectionType = this.$store.getters['currentConnections/typeForNewConnections']
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
      const zoom = this.spaceZoomDecimal
      const cardElement = utils.cardElementFromPosition(cursor.x * zoom, cursor.y * zoom)
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
        this.$store.commit('currentConnectionSuccess', card)
        updates.endCardId = card.id
        this.$store.commit('broadcast/updateStore', { updates, type: 'updateRemoteCurrentConnection' })
      } else {
        this.$store.commit('currentConnectionSuccess', {})
      }
    },
    addConnection (connection) {
      const type = this.$store.getters['currentConnections/typeForNewConnections']
      this.$store.dispatch('currentConnections/add', { connection, type })
      this.$store.dispatch('currentConnections/addType', type)
    },
    createConnections () {
      const currentConnectionSuccess = this.$store.state.currentConnectionSuccess
      const startCardIds = this.$store.state.currentConnectionStartCardIds
      const endCardId = currentConnectionSuccess.id
      if (currentConnectionSuccess.id) {
        startCardIds.forEach(startCardId => {
          const path = utils.connectionBetweenCards(startCardId, endCardId)
          const connection = { startCardId, endCardId, path }
          this.addConnection(connection)
        })
      } else {
        this.$store.dispatch('currentConnections/removeUnusedTypes')
      }
    },
    stopInteractions (event) {
      if (this.isDrawingConnection) {
        this.createConnections()
        this.$store.dispatch('clearMultipleSelected')
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
    }
  }
}
</script>

<style lang="stylus">
.current-connection
  pointer-events none
</style>
