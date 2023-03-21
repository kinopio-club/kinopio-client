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

let prevType

export default {
  name: 'CurrentConnection',
  props: {
    startCardId: String,
    startCursor: Object
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggeredDrawConnectionFrame') {
        const event = this.$store.state.triggeredDrawConnectionFrame
        this.drawConnection(event)
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
    remoteCurrentConnections () { return this.$store.state.remoteCurrentConnections },
    spaceZoomDecimal () { return this.$store.getters.spaceZoomDecimal }
  },
  methods: {
    interact (event) {
      if (this.isDrawingConnection) {
        this.drawConnection(event)
      }
    },
    drawConnection (event) {
      let end = utils.cursorPositionInSpace(event)
      const startCardId = this.startCardId
      let start = utils.connectorCoords(startCardId) // TODO get real pos
      start = utils.cursorPositionInSpace(null, start)
      const controlPoint = this.$store.state.currentUser.defaultConnectionControlPoint
      const path = this.$store.getters['currentConnections/connectionPathBetweenCoords'](start, end, controlPoint)
      this.checkCurrentConnectionSuccess(event)
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
    checkCurrentConnectionSuccess (event) {
      if (!event) { return }
      const position = utils.cursorPositionInViewport(event)
      const cardElement = utils.cardElementFromPosition(position.x, position.y)
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
      let position = utils.cursorPositionInSpace(event)
      const shouldPreventCreate = utils.isPositionOutsideOfSpace(position)
      if (shouldPreventCreate) {
        position = utils.cursorPositionInPage(event)
        this.$store.commit('addNotificationWithPosition', { message: 'Outside Space', position, type: 'info', icon: 'cancel', layer: 'app' })
        return
      }
      if (currentConnectionSuccess.id) {
        endCardId = currentConnectionSuccess.id
      } else {
        // create card
        const startCard = this.$store.getters['currentCards/byId'](startCardIds[0])
        endCardId = nanoid()
        this.$store.dispatch('currentCards/add', { position, id: endCardId, isParentCard: true, backgroundColor: startCard.backgroundColor })
        this.$store.commit('childCardId', '')
      }
      // create connections to endCardId
      this.$nextTick(() => {
        startCardIds.forEach(startCardId => {
          const controlPoint = this.$store.state.currentUser.defaultConnectionControlPoint
          const path = this.$store.getters['currentConnections/connectionPathBetweenCards'](startCardId, endCardId, controlPoint)
          const connection = { startCardId, endCardId, path, controlPoint }
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
    }
  }
}
</script>

<style lang="stylus">
.current-connection
  pointer-events none
</style>
