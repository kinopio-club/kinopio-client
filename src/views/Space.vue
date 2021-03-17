<template lang="pug">
main.space(
  :class="{'is-interacting': isInteracting, 'is-painting': isPainting}"
  @mousedown.left="initInteractions"
  @touchstart="initInteractions"
  @mouseup.left="stopInteractions"
  @touchstop="stopInteractions"
  :style="styles"
)
  svg.connections
    path.current-connection(
      v-if="isDrawingConnection"
      fill="none"
      stroke-width="5"
      :stroke="currentConnectionColor"
      :d="currentConnectionPath"
    )
    template(v-for="connection in remoteCurrentConnections")
      Connection(:connection="connection")
    template(v-for="connection in connections")
      Connection(:connection="connection")
  template(v-for="connection in connections")
    ConnectionLabel(:connection="connection")
  template(v-for="user in spaceMembers")
    UserLabel(:user="user")
  .cards
    template(v-for="card in cards")
      Card(:card="card")
  ConnectionDetails
  TagDetails
  LinkDetails
  MultipleSelectedActions
  OffscreenMarkers
  ScrollAtEdgesHandler
  NotificationsWithPosition
</template>

<script>
import Card from '@/components/Card.vue'
import Connection from '@/components/Connection.vue'
import ConnectionLabel from '@/components/ConnectionLabel.vue'
import UserLabel from '@/components/UserLabel.vue'
import ConnectionDetails from '@/components/dialogs/ConnectionDetails.vue'
import TagDetails from '@/components/dialogs/TagDetails.vue'
import LinkDetails from '@/components/dialogs/LinkDetails.vue'
import MultipleSelectedActions from '@/components/dialogs/MultipleSelectedActions.vue'
import OffscreenMarkers from '@/components/OffscreenMarkers.vue'
import ScrollAtEdgesHandler from '@/components/ScrollAtEdgesHandler.vue'
import NotificationsWithPosition from '@/components/NotificationsWithPosition.vue'
import utils from '@/utils.js'

import sortBy from 'lodash-es/sortBy'
import uniq from 'lodash-es/uniq'

let startCursor, prevCursor, endCursor, shouldCancel

export default {
  name: 'Space',
  components: {
    Card,
    Connection,
    ConnectionLabel,
    UserLabel,
    ConnectionDetails,
    TagDetails,
    LinkDetails,
    MultipleSelectedActions,
    OffscreenMarkers,
    ScrollAtEdgesHandler,
    NotificationsWithPosition
  },
  beforeCreate () {
    this.$store.dispatch('currentUser/init')
    this.$store.dispatch('currentSpace/init')
    const currentUserIsSignedIn = this.$store.getters['currentUser/isSignedIn']
    if (currentUserIsSignedIn) {
      this.$store.commit('broadcast/connect')
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggeredDrawConnectionFrame') {
        prevCursor = this.$store.state.triggeredDrawConnectionFrame
        this.drawConnection()
      }
      if (mutation.type === 'currentUserIsDrawingConnection') {
        if (mutation.payload === true) {
          this.$store.commit('updateCardMap')
        }
      }
    })
  },
  mounted () {
    // bind events to window to receive events when mouse is outside window
    window.addEventListener('mousemove', this.interact)
    window.addEventListener('touchmove', this.interact)
    window.addEventListener('mouseup', this.stopInteractions)
    window.addEventListener('touchend', this.stopInteractions)
    // keep space element updated to viewport size so connections show up
    this.updatePageSizes()
    window.addEventListener('resize', this.updatePageSizes)

    this.updateIsOnline()
    window.addEventListener('online', this.updateIsOnline)
    window.addEventListener('offline', this.updateIsOnline)

    this.addInteractionBlur()
    this.startProcessQueueTimer()

    window.addEventListener('unload', this.unloadPage)
    window.addEventListener('popstate', this.loadSpaceOnBackOrForward)
  },
  data () {
    return {
      currentConnectionPath: undefined,
      currentConnectionColor: undefined
    }
  },
  computed: {
    styles () {
      return {
        width: `${this.pageWidth}px`,
        height: `${this.pageHeight}px`,
        zoom: this.spaceZoomDecimal
      }
    },
    cards () { return this.$store.state.currentSpace.cards },
    isPainting () { return this.$store.state.currentUserIsPainting },
    spaceIsReadOnly () { return !this.$store.getters['currentUser/canEditSpace']() },
    isDrawingConnection () { return this.$store.state.currentUserIsDrawingConnection },
    isDraggingCard () { return this.$store.state.currentUserIsDraggingCard },
    connections () { return this.$store.state.currentSpace.connections },
    viewportHeight () { return this.$store.state.viewportHeight },
    viewportWidth () { return this.$store.state.viewportWidth },
    pageHeight () { return this.$store.state.pageHeight },
    pageWidth () { return this.$store.state.pageWidth },
    isInteracting () {
      if (this.isDraggingCard || this.isDrawingConnection) {
        return true
      } else { return false }
    },
    remoteCurrentConnections () { return this.$store.state.remoteCurrentConnections },
    spaceMembers () {
      const excludeCurrentUser = true
      return this.$store.getters['currentSpace/members'](excludeCurrentUser)
    },
    spaceZoomDecimal () { return (this.$store.state.spaceZoomPercent / 100) }
  },
  methods: {
    loadSpaceOnBackOrForward (event) {
      const url = window.location.href
      if (!utils.urlIsKinopioSpace(url)) { return }
      const spaceId = utils.spaceIdFromUrl(url)
      const space = { id: spaceId }
      this.$store.dispatch('currentSpace/loadSpace', { space })
    },
    unloadPage () {
      this.$store.commit('broadcast/close')
      this.$store.dispatch('currentSpace/removeEmptyCards')
    },
    updatePageSizes () {
      this.$nextTick(() => {
        this.$store.dispatch('updatePageSizes')
      })
    },
    updateIsOnline () {
      const status = window.navigator.onLine
      this.$store.commit('isOnline', status)
      if (status) {
        this.$store.dispatch('api/processQueueOperations')
      }
    },
    addInteractionBlur () {
      if (!utils.isMobile()) { return }
      const elements = document.querySelectorAll('button, li, label')
      elements.forEach(element => element.addEventListener('click', this.blur))
    },
    blur (event) {
      event.target.blur()
    },
    startProcessQueueTimer () {
      // retry failed sync operations every 5 seconds
      setInterval(() => {
        this.$store.dispatch('api/processQueueOperations')
      }, 5000)
    },

    initInteractions (event) {
      if (this.eventIsFromTextarea(event)) {
        shouldCancel = true
      } else {
        shouldCancel = false
      }
      if (this.spaceIsReadOnly) { return }
      startCursor = utils.cursorPositionInViewport(event)
    },

    constrainCursorToAxis (event) {
      if (!event.shiftKey) { return }
      const delta = {
        x: Math.abs(endCursor.x - startCursor.x),
        y: Math.abs(endCursor.y - startCursor.y)
      }
      if (delta.x > delta.y) {
        endCursor.y = prevCursor.y
      } else {
        endCursor.x = prevCursor.x
      }
    },
    interact (event) {
      endCursor = utils.cursorPositionInViewport(event)
      if (this.isDraggingCard) {
        this.constrainCursorToAxis(event)
        this.dragCard()
      }
      if (this.isDrawingConnection) {
        this.drawConnection()
      }
      prevCursor = utils.cursorPositionInViewport(event)
      this.$store.commit('prevCursorPosition', utils.cursorPositionInPage(event))
    },
    checkShouldShowDetails () {
      if (!utils.cursorsAreClose(startCursor, endCursor)) {
        this.$store.commit('preventDraggedCardFromShowingDetails', true)
      }
    },
    cursor () {
      if (utils.objectHasKeys(prevCursor)) {
        return prevCursor
      } else {
        return startCursor
      }
    },
    dragCard () {
      const prevCursor = this.cursor()
      this.$store.dispatch('currentSpace/dragCards', {
        endCursor,
        prevCursor: prevCursor
      })
      this.checkShouldShowDetails()
    },
    drawConnection () {
      const end = this.cursor()
      const startCardId = this.$store.state.currentConnection.startCardId
      const start = utils.connectorCoords(startCardId)
      const path = utils.connectionPathBetweenCoords(start, end)
      this.checkCurrentConnectionSuccess()
      this.currentConnectionPath = path
      const connectionType = this.$store.getters['currentSpace/connectionTypeForNewConnections']
      this.currentConnectionColor = connectionType.color
      this.$store.commit('currentConnectionColor', connectionType.color)
      const updates = {
        id: this.$store.state.currentUser.id,
        connectionTypeId: connectionType.id,
        color: connectionType.color,
        startCardId,
        path
      }
      this.$store.commit('broadcast/updateStore', { updates, type: 'updateRemoteCurrentConnection' })
    },
    checkCurrentConnectionSuccess () {
      const cursor = this.cursor()
      const cardMap = this.$store.state.cardMap
      const connection = cardMap.find(card => {
        const xValues = {
          value: cursor.x,
          min: (card.x - window.scrollX),
          max: (card.x - window.scrollX + card.width)
        }
        const yValues = {
          value: cursor.y,
          min: (card.y - window.scrollY),
          max: (card.y - window.scrollY + card.height)
        }
        const inXRange = utils.isBetween(xValues)
        const inYRange = utils.isBetween(yValues)
        return inXRange && inYRange
      })
      let updates = { id: this.$store.state.currentUser.id }
      if (!connection) {
        this.$store.commit('currentConnectionSuccess', {})
        updates.endCardId = null
        this.$store.commit('broadcast/updateStore', { updates, type: 'updateRemoteCurrentConnection' })
        return
      }
      if (this.$store.state.currentConnection.startCardId !== connection.cardId) {
        this.$store.commit('currentConnectionSuccess', connection)
        updates.endCardId = connection.cardId
        this.$store.commit('broadcast/updateStore', { updates, type: 'updateRemoteCurrentConnection' })
      } else {
        this.$store.commit('currentConnectionSuccess', {})
      }
    },
    addConnection (connection) {
      const connectionType = this.$store.getters['currentSpace/connectionTypeForNewConnections']
      this.$store.dispatch('currentSpace/addConnection', { connection, connectionType })
    },
    createConnection () {
      const currentConnectionSuccess = this.$store.state.currentConnectionSuccess
      const startCardId = this.$store.state.currentConnection.startCardId
      const endCardId = currentConnectionSuccess.cardId
      if (currentConnectionSuccess.cardId) {
        const path = utils.connectionBetweenCards(startCardId, endCardId)
        const connection = { startCardId, endCardId, path }
        this.addConnection(connection)
      } else {
        this.$store.dispatch('currentSpace/removeUnusedConnectionTypes')
      }
    },
    // shouldContinueConnecting (event) {
    //   const cursorStart = this.$store.state.currentConnectionCursorStart
    //   const cursorEnd = utils.cursorPositionInViewport(event)
    //   if (!this.isDrawingConnection) { return }
    //   if (cursorStart.x === cursorEnd.x && cursorStart.y === cursorEnd.y) {
    //     return true
    //   } else {
    //     return false
    //   }
    // },
    normalizeSpaceCardsZ () {
      const sorted = sortBy(this.cards, ['z'])
      const zList = sorted.map(card => card.z)
      const isNormalized = uniq(zList).length === zList.length
      if (isNormalized) { return }
      sorted.forEach((card, index) => {
        this.$store.dispatch('currentSpace/updateCard', { id: card.id, z: index })
      })
    },
    addCard (position) {
      const isParentCard = true
      if (this.spaceIsReadOnly) {
        this.$store.commit('addNotificationWithPosition', { message: 'Space is Read Only', position, type: 'info' })
        return
      }
      const withinX = position.x > 0 && position.x < this.$store.state.pageWidth
      const withinY = position.y > 0 && position.y < this.$store.state.pageHeight
      if (withinX && withinY) {
        this.normalizeSpaceCardsZ()
        this.$store.dispatch('currentSpace/addCard', { position, isParentCard })
        this.$store.commit('childCardId', '')
      }
    },
    eventIsFromTextarea (event) {
      if (event.target.nodeType !== 1) { return } // firefox check
      const node = event.target.nodeName
      const isTextarea = node === 'TEXTAREA'
      const isInput = node === 'INPUT'
      if (event.srcElement.type === 'range') { return false }
      if (isTextarea || isInput) {
        return true
      }
    },
    shouldCancel (event) {
      if (shouldCancel) {
        shouldCancel = false
        return true
      }
      if (this.eventIsFromTextarea(event)) { return true }
      if (event.target.nodeType === 9) { return true } // type 9 is Document
      const fromDialog = event.target.closest('dialog')
      const fromHeader = event.target.closest('header')
      const fromFooter = event.target.closest('footer')
      return fromDialog || fromHeader || fromFooter
    },
    checkIfShouldHideFooter (event) {
      if (event.target.nodeType !== 1) { return } // firefox check
      const node = event.target.nodeName
      const isTextarea = node === 'TEXTAREA'
      const isInput = node === 'INPUT'
      if (isTextarea || isInput) {
        this.$store.commit('shouldHideFooter', true)
      } else {
        this.$store.commit('shouldHideFooter', false)
      }
    },
    showMultipleSelectedActions (position) {
      if (this.spaceIsReadOnly) { return }
      if (this.$store.state.preventDraggedCardFromShowingDetails) { return }
      this.$store.commit('multipleSelectedActionsPosition', position)
      this.$store.commit('multipleSelectedActionsIsVisible', true)
    },
    stopInteractions (event) {
      // const temporaryDebugState = {
      //   event: event,
      //   shouldCancel: shouldCancel,
      //   eventIsFromTextarea: this.eventIsFromTextarea(event),
      //   currentUserIsDraggingCard: this.$store.state.currentUserIsDraggingCard,
      //   shouldAddCard: this.$store.state.shouldAddCard,
      //   cardDetailsIsVisibleForCardId: this.$store.state.cardDetailsIsVisibleForCardId,
      //   multipleCardsSelectedIds: this.$store.state.multipleCardsSelectedIds,
      //   multipleConnectionsSelectedIds: this.$store.state.multipleConnectionsSelectedIds,
      //   preventDraggedCardFromShowingDetails: this.$store.state.preventDraggedCardFromShowingDetails,
      //   currentDraggingCardId: this.$store.state.currentDraggingCardId,
      //   currentUserIsDrawingConnection: this.$store.state.currentUserIsDrawingConnection,
      //   currentUserIsPainting: this.$store.state.currentUserIsPainting,
      //   currentUserIsPaintingLocked: this.$store.state.currentUserIsPainting,
      //   isDraggingCard: this.isDraggingCard,
      //   currentConnection: this.$store.state.currentConnection
      // }
      console.log('💣 stopInteractions') // stopInteractions and Space/stopPainting are run on all mouse and touch end events
      this.addInteractionBlur()
      if (event.touches) {
        this.$store.commit('triggerUpdatePositionInVisualViewport')
      }
      this.checkIfShouldHideFooter(event)
      if (this.shouldCancel(event)) { return }
      // if (this.shouldContinueConnecting(event)) { return }
      if (this.isDrawingConnection) {
        this.createConnection()
      }
      // add or close card
      if (this.$store.state.shouldAddCard) {
        const position = utils.cursorPositionInPage(event)
        this.addCard(position)
      } else if (this.$store.state.cardDetailsIsVisibleForCardId) {
        this.$store.dispatch('closeAllDialogs', 'Space.stopInteractions')
      }
      if (this.$store.state.multipleCardsSelectedIds.length || this.$store.state.multipleConnectionsSelectedIds.length) {
        const position = utils.cursorPositionInPage(event)
        this.showMultipleSelectedActions(position)
      }
      this.$store.commit('importArenaChannelIsVisible', false)
      this.$store.commit('shouldAddCard', false)
      this.$store.commit('preventDraggedCardFromShowingDetails', false)
      this.$store.commit('currentUserIsDrawingConnection', false)
      this.$store.commit('currentUserIsPainting', false)
      this.$store.commit('currentUserIsPaintingLocked', false)
      if (this.isDraggingCard) {
        this.$store.dispatch('currentSpace/updateAfterDragWithPositions')
      }
      this.$store.commit('currentUserIsDraggingCard', false)
      this.$store.commit('currentConnectionSuccess', {})
      const isCurrentConnection = utils.objectHasKeys(this.$store.state.currentConnection)
      if (isCurrentConnection) {
        this.$store.commit('currentConnection', {})
        this.$store.commit('broadcast/updateStore', { updates: { id: this.$store.state.currentUser.id }, type: 'removeRemoteCurrentConnection' })
      }
      this.updatePageSizes()
      this.currentConnectionPath = undefined
      prevCursor = undefined
    }
  }
}
</script>

<style lang="stylus">
.space
  width 100%
  height 100vh
  pointer-events none // so that painting can receive events
  position relative // used by svg connections
.is-interacting
  pointer-events all
.is-painting
  *
    pointer-events: none !important

svg.connections,
.connection-labels
  position absolute
  top 0
  left 0
  width 100%
  height 100%
  path
    pointer-events all
    cursor pointer
    &.current-connection
      pointer-events none

</style>
