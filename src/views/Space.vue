<template lang="pug">
main.space(
  :class="{'is-interacting': isInteracting, 'is-painting': isPainting}"
  @mousedown="initInteractions"
  @touchstart="initInteractions"
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
  .cards
    template(v-for="card in cards")
      Card(:card="card")
  ConnectionDetails
  MultipleCardActions
  OffscreenMarkers
</template>

<script>
import Card from '@/components/Card.vue'
import Connection from '@/components/Connection.vue'
import ConnectionDetails from '@/components/dialogs/ConnectionDetails.vue'
import MultipleCardActions from '@/components/dialogs/MultipleCardActions.vue'
import OffscreenMarkers from '@/components/OffscreenMarkers.vue'

import utils from '@/utils.js'

import _ from 'lodash'

let startCursor, prevCursor, endCursor, scrollTimer, scrollAreaHeight, scrollAreaWidth
let movementDirection = {}

export default {
  components: {
    Card,
    Connection,
    ConnectionDetails,
    MultipleCardActions,
    OffscreenMarkers
  },
  name: 'Space',

  data () {
    return {
      currentConnectionPath: undefined,
      currentConnectionColor: undefined
    }
  },
  beforeCreate () {
    this.$store.dispatch('currentUser/init')
    this.$store.dispatch('currentSpace/init')
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

    initInteractions (event) {
      startCursor = utils.cursorPositionInViewport(event)
      if (this.$store.getters.shouldScrollAtEdges && !scrollTimer) {
        scrollAreaHeight = Math.min(100, this.viewportHeight / 6)
        scrollAreaWidth = Math.min(100, this.viewportWidth / 6)
        scrollTimer = window.requestAnimationFrame(this.scrollFrame)
      }
    },

    interact (event) {
      endCursor = utils.cursorPositionInViewport(event)
      if (this.isDraggingCard) {
        this.dragCard()
      }
      if (this.isDrawingConnection) {
        this.drawConnection()
      }
      if (this.$store.getters.shouldScrollAtEdges) {
        this.updateMovementDirection()
      }
      prevCursor = utils.cursorPositionInViewport(event)
    },

    checkShouldShowDetails () {
      if (!utils.cursorsAreClose(startCursor, endCursor)) {
        this.$store.commit('preventDraggedCardFromShowingDetails', true)
      }
    },

    scrollBy (delta) {
      delta.left = delta.x * 1.1
      delta.top = delta.y
      if (this.isDraggingCard) {
        this.$store.dispatch('currentSpace/dragCards', { delta })
      }
      window.scrollBy(delta)
    },

    speed (cursor, direction) {
      let multiplier
      const base = 10
      const viewportHeight = this.viewportHeight
      const viewportWidth = this.viewportWidth
      if (direction === 'up') {
        multiplier = (scrollAreaHeight - cursor.y) / scrollAreaHeight
      }
      if (direction === 'down') {
        multiplier = (cursor.y - (viewportHeight - scrollAreaHeight) / scrollAreaHeight) / viewportHeight
      }
      if (direction === 'left') {
        multiplier = (scrollAreaWidth - cursor.x) / scrollAreaWidth
      }
      if (direction === 'right') {
        multiplier = (cursor.x - (viewportWidth - scrollAreaWidth) / scrollAreaWidth) / viewportWidth
      }
      return base * (multiplier + (multiplier * 0.5))
    },

    increasePageSize (delta) {
      const pageWidth = this.pageWidth
      const pageHeight = this.pageHeight
      if (delta.x) {
        const width = pageWidth + delta.x
        this.$store.commit('pageWidth', width)
      }
      if (delta.y) {
        const height = pageHeight + delta.y
        this.$store.commit('pageHeight', height)
      }
    },

    scrollFrame () {
      let delta, speed
      const viewportHeight = this.viewportHeight
      const viewportWidth = this.viewportWidth
      const cursor = this.cursor()

      const cursorIsTopSide = cursor.y <= scrollAreaHeight
      const cursorIsBottomSide = cursor.y >= viewportHeight - scrollAreaHeight

      const cursorIsLeftSide = cursor.x <= scrollAreaWidth
      const cursorIsRightSide = cursor.x >= viewportWidth - scrollAreaWidth

      // ↑ up
      if (cursorIsTopSide && window.scrollY && movementDirection.y === 'up') {
        speed = this.speed(cursor, 'up')
        delta = {
          x: 0,
          y: -speed
        }
        this.scrollBy(delta)
      // ↓ down
      } else if (cursorIsBottomSide && movementDirection.y === 'down') {
        speed = this.speed(cursor, 'down')
        delta = {
          x: 0,
          y: speed
        }
        this.increasePageSize(delta)
        this.scrollBy(delta)
      }
      // ◀ left
      if (cursorIsLeftSide && window.scrollX && movementDirection.x === 'left') {
        speed = this.speed(cursor, 'left')
        delta = {
          x: -speed,
          y: 0
        }
        this.scrollBy(delta)
      // ▶ right
      } else if (cursorIsRightSide && movementDirection.x === 'right') {
        speed = this.speed(cursor, 'right')
        delta = {
          x: speed,
          y: 0
        }
        this.increasePageSize(delta)
        this.scrollBy(delta)
      }
      if (this.isDrawingConnection) {
        this.drawConnection()
      }

      if (scrollTimer) {
        window.requestAnimationFrame(this.scrollFrame)
      }
    },

    updateMovementDirection () {
      const cursor = this.cursor()
      const xMove = endCursor.x - cursor.x
      const yMove = endCursor.y - cursor.y
      if (Math.sign(yMove) === -1) {
        movementDirection.y = 'up'
      } else if (Math.sign(yMove) === 1) {
        movementDirection.y = 'down'
      }
      if (Math.sign(xMove) === -1) {
        movementDirection.x = 'left'
      } else if (Math.sign(xMove) === 1) {
        movementDirection.x = 'right'
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
      // type color
      const typePref = this.$store.state.currentUser.defaultConnectionTypeId
      const defaultType = this.$store.getters['currentSpace/connectionTypeById'](typePref)
      if (defaultType) {
        this.currentConnectionColor = defaultType.color
      } else {
        this.currentConnectionColor = this.$store.getters['currentSpace/lastConnectionType'].color
      }
    },

    connectors () {
      const connectorElements = document.querySelectorAll('.connector')
      const connectors = Array.from(connectorElements)
      return connectors.map(connector => {
        const element = connector.getBoundingClientRect()
        return {
          cardId: connector.dataset.cardId,
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height
        }
      })
    },

    checkCurrentConnectionSuccess () {
      const cursor = this.cursor()
      const connection = this.connectors().find(connector => {
        const xValues = {
          value: cursor.x,
          min: connector.x,
          max: (connector.x + connector.width)
        }
        const yValues = {
          value: cursor.y,
          min: connector.y,
          max: (connector.y + connector.height)
        }
        const inXRange = utils.between(xValues)
        const inYRange = utils.between(yValues)
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
      const typePref = this.$store.state.currentUser.defaultConnectionTypeId
      const defaultType = this.$store.getters['currentSpace/connectionTypeById'](typePref)
      const lastConnectionType = _.last(this.$store.state.currentSpace.connectionTypes)
      const connectionType = defaultType || lastConnectionType
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
        this.$store.commit('currentSpace/removeUnusedConnectionTypes')
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

    addNewCard (position) {
      const withinX = position.x > 0 && position.x < this.$store.state.pageWidth
      const withinY = position.y > 0 && position.y < this.$store.state.pageHeight
      if (withinX && withinY) {
        this.$store.dispatch('currentSpace/addCard', { position })
      }
    },

    shouldCancel (event) {
      const fromDialog = event.target.closest('dialog')
      const fromHeader = event.target.closest('header')
      const fromFooter = event.target.closest('footer')
      return fromDialog || fromHeader || fromFooter
    },

    showMultipleCardActions (position) {
      if (this.$store.state.preventDraggedCardFromShowingDetails) { return }
      this.$store.commit('multipleCardActionsPosition', position)
      this.$store.commit('multipleCardActionsIsVisible', true)
    },

    stopInteractions (event) {
      console.log('💣 stopInteractions') // stopInteractions and Space/stopPainting are run on all mouse and touch end events
      window.cancelAnimationFrame(scrollTimer)
      scrollTimer = undefined
      if (this.shouldCancel(event)) { return }
      if (this.shouldContinueConnecting(event)) { return }
      if (this.isDrawingConnection) {
        this.createConnection()
      }
      if (this.$store.state.shouldAddNewCard) {
        const position = utils.cursorPositionInPage(event)
        this.addNewCard(position)
      }
      if (this.$store.state.multipleCardsSelected.length) {
        const position = utils.cursorPositionInPage(event)
        this.showMultipleCardActions(position)
      }
      this.$store.commit('shouldAddNewCard', false)
      this.$store.commit('preventDraggedCardFromShowingDetails', false)
      this.$store.commit('currentUserIsDrawingConnection', false)
      this.$store.commit('currentUserIsPainting', false)
      this.$store.commit('currentUserIsPaintingLocked', false)
      this.$store.commit('currentUserIsDraggingCard', false)
      this.$store.commit('currentConnectionSuccess', {})
      this.$store.commit('currentConnection', {})
      this.updatePageSizes()
      this.currentConnectionPath = undefined
      prevCursor = undefined
      movementDirection = {}
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

svg.connections
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
