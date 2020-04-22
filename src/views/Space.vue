<template lang="pug">
main.space(
  :class="{'is-interacting': isInteracting, 'is-painting': isPainting}"
  @mousedown="initInteractions"
  @touchstart="initInteractions"
  @mouseup="stopInteractions"
  @touchstop="stopInteractions"
  :style="size"
)
  svg.connections
    path.current-connection(
      v-if="isDrawingConnection"
      fill="none"
      stroke-width="5"
      :stroke="currentConnectionColor"
      :d="currentConnectionPath"
    )
    template(v-for="connection in connections")
      Connection(:connection="connection")
  template(v-for="connection in connections")
    ConnectionLabel(:connection="connection")
  .cards
    template(v-for="card in cards")
      Card(:card="card")
  ConnectionDetails
  MultipleSelectedActions
  OffscreenMarkers
  ScrollAtEdgesHandler
</template>

<script>
import Card from '@/components/Card.vue'
import Connection from '@/components/Connection.vue'
import ConnectionLabel from '@/components/ConnectionLabel.vue'
import ConnectionDetails from '@/components/dialogs/ConnectionDetails.vue'
import MultipleSelectedActions from '@/components/dialogs/MultipleSelectedActions.vue'
import OffscreenMarkers from '@/components/OffscreenMarkers.vue'
import ScrollAtEdgesHandler from '@/components/ScrollAtEdgesHandler.vue'
import utils from '@/utils.js'

let startCursor, prevCursor, endCursor

export default {
  name: 'Space',
  components: {
    Card,
    Connection,
    ConnectionLabel,
    ConnectionDetails,
    MultipleSelectedActions,
    OffscreenMarkers,
    ScrollAtEdgesHandler
  },
  beforeCreate () {
    this.$store.dispatch('currentUser/init')
    this.$store.dispatch('currentSpace/init')
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggeredPaintFramePosition') {
        const position = this.$store.state.triggeredPaintFramePosition
        const event = {
          clientX: position.x,
          clientY: position.y
        }
        this.createPaintingCircle(event)
      }
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
    // keep space element updated to viewport size so connections show up
    this.updatePageSizes()
    window.addEventListener('resize', this.updatePageSizes)
    window.addEventListener('scroll', this.updatePageSizes)

    this.updateIsOnline()
    window.addEventListener('online', this.updateIsOnline)
    window.addEventListener('offline', this.updateIsOnline)

    this.addInteractionBlur()
    this.startProcessQueueTimer()
  },
  data () {
    return {
      currentConnectionPath: undefined,
      currentConnectionColor: undefined
    }
  },
  computed: {
    size () {
      return {
        width: `${this.pageWidth}px`,
        height: `${this.pageHeight}px`
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
    }
  },
  methods: {
    updatePageSizes () {
      this.$store.commit('updatePageSizes')
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
      if (this.spaceIsReadOnly) { return }
      this.$store.commit('generateCardMap')
      startCursor = utils.cursorPositionInViewport(event)
    },

    interact (event) {
      endCursor = utils.cursorPositionInViewport(event)
      if (this.isDraggingCard) {
        this.dragCard()
      }
      if (this.isDrawingConnection) {
        this.drawConnection()
      }
      prevCursor = utils.cursorPositionInViewport(event)
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
      if (!connection) {
        this.$store.commit('currentConnectionSuccess', {})
        return
      }
      if (this.$store.state.currentConnection.startCardId !== connection.cardId) {
        this.$store.commit('currentConnectionSuccess', connection)
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
    shouldContinueConnecting (event) {
      const cursorStart = this.$store.state.currentConnectionCursorStart
      const cursorEnd = utils.cursorPositionInViewport(event)
      if (!this.isDrawingConnection) { return }
      if (cursorStart.x === cursorEnd.x && cursorStart.y === cursorEnd.y) {
        return true
      } else {
        return false
      }
    },
    addCard (position) {
      const isParentCard = true
      if (this.spaceIsReadOnly) { return }
      const withinX = position.x > 0 && position.x < this.$store.state.pageWidth
      const withinY = position.y > 0 && position.y < this.$store.state.pageHeight
      if (withinX && withinY) {
        this.$store.dispatch('currentSpace/addCard', { position, isParentCard })
        this.$store.commit('childCardId', '')
      }
    },
    shouldCancel (event) {
      if (event.target.nodeType !== 1) { return } // firefox check
      const fromDialog = event.target.closest('dialog')
      const fromHeader = event.target.closest('header')
      const fromFooter = event.target.closest('footer')
      return fromDialog || fromHeader || fromFooter
    },
    showMultipleSelectedActions (position) {
      if (this.spaceIsReadOnly) { return }
      if (this.$store.state.preventDraggedCardFromShowingDetails) { return }
      this.$store.commit('multipleSelectedActionsPosition', position)
      this.$store.commit('multipleSelectedActionsIsVisible', true)
    },
    stopInteractions (event) {
      console.log('💣 stopInteractions') // stopInteractions and Space/stopPainting are run on all mouse and touch end events
      this.addInteractionBlur()
      if (this.shouldCancel(event)) { return }
      if (this.shouldContinueConnecting(event)) { return }
      if (this.isDrawingConnection) {
        this.createConnection()
      }
      if (this.$store.state.shouldAddCard) {
        const position = utils.cursorPositionInPage(event)
        this.addCard(position)
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
      this.$store.commit('currentConnection', {})
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
