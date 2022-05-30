<template lang="pug">
main.space(
  :class="{'is-interacting': isInteracting, 'is-not-interacting': isPainting || isPanningReady, 'hidden-by-mindmap': minimapIsVisible}"
  @mousedown.left="initInteractions"
  @touchstart="initInteractions"
  :style="styles"
)
  svg.connections
    template(v-for="startCardId in currentConnectionStartCardIds")
      CurrentConnection(:startCardId="startCardId" :startCursor="startCursor")
    template(v-for="connection in remoteCurrentConnections")
      Connection(:connection="connection")
    template(v-for="connection in connections")
      Connection(:connection="connection")
  template(v-for="connection in connections")
    ConnectionLabel(:connection="connection")
  template(v-for="user in spaceMembers")
    UserLabel(:user="user")
  .cards
    template(v-for="overlap in cardOverlaps")
      .badge.label-badge.card-overlap-indicator(v-if="canEditSpace" :style="{ left: overlap.x + 'px', top: overlap.y + 'px' }" @click.left="selectOverlap(overlap)")
        span {{overlap.length}}
    template(v-for="card in cards")
      Card(:card="card")
  CardDetails
  CardUserDetails
  ConnectionDetails
  MultipleSelectedActions
  ScrollAtEdgesHandler
  NotificationsWithPosition
  BoxSelecting
</template>

<script>
import Card from '@/components/Card.vue'
import CardDetails from '@/components/dialogs/CardDetails.vue'
import CardUserDetails from '@/components/dialogs/CardUserDetails.vue'
import CurrentConnection from '@/components/CurrentConnection.vue'
import Connection from '@/components/Connection.vue'
import ConnectionLabel from '@/components/ConnectionLabel.vue'
import UserLabel from '@/components/UserLabel.vue'
import ConnectionDetails from '@/components/dialogs/ConnectionDetails.vue'
import MultipleSelectedActions from '@/components/dialogs/MultipleSelectedActions.vue'
import ScrollAtEdgesHandler from '@/components/ScrollAtEdgesHandler.vue'
import NotificationsWithPosition from '@/components/NotificationsWithPosition.vue'
import BoxSelecting from '@/components/BoxSelecting.vue'
import utils from '@/utils.js'

import sortBy from 'lodash-es/sortBy'
import uniq from 'lodash-es/uniq'

const cardOverlaps = new Worker('/web-workers/card-overlaps.js')

let prevCursor, endCursor, shouldCancel
let processQueueIntervalTimer

export default {
  name: 'Space',
  components: {
    Card,
    CardDetails,
    CardUserDetails,
    CurrentConnection,
    Connection,
    ConnectionLabel,
    UserLabel,
    ConnectionDetails,
    MultipleSelectedActions,
    ScrollAtEdgesHandler,
    NotificationsWithPosition,
    BoxSelecting
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
      if (mutation.type === 'triggerUpdateCardOverlaps') {
        this.updateCardOverlaps()
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

    window.addEventListener('unload', this.unloadPage)
    window.addEventListener('popstate', this.loadSpaceOnBackOrForward)

    document.fonts.ready.then(event => {
      this.$store.commit('webfontIsLoaded', true)
      this.correctCardConnectionPaths()
    })
    if (utils.isAndroid()) {
      this.$store.commit('addNotification', { message: 'Android is currenly only partially supported. You may experience scrolling issues', type: 'danger' })
    }

    this.$store.dispatch('currentUser/restoreUserFavorites')
    window.addEventListener('scroll', this.updateCardOverlaps)
    window.addEventListener('resize', this.updateCardOverlaps)
    this.updateCardOverlaps()

    // retry failed sync operations every 5 seconds
    processQueueIntervalTimer = setInterval(() => {
      this.$store.dispatch('api/processQueueOperations')
    }, 5000)

    cardOverlaps.addEventListener('message', event => {
      this.cardOverlaps = event.data
    })
  },
  beforeUnmount () {
    window.removeEventListener('mousemove', this.interact)
    window.removeEventListener('touchmove', this.interact)
    window.removeEventListener('mouseup', this.stopInteractions)
    window.removeEventListener('touchend', this.stopInteractions)
    window.removeEventListener('resize', this.updatePageSizes)
    window.removeEventListener('online', this.updateIsOnline)
    window.removeEventListener('offline', this.updateIsOnline)
    window.removeEventListener('unload', this.unloadPage)
    window.removeEventListener('popstate', this.loadSpaceOnBackOrForward)
    window.removeEventListener('scroll', this.updateCardOverlaps)
    window.removeEventListener('resize', this.updateCardOverlaps)
    clearInterval(processQueueIntervalTimer)
  },
  data () {
    return {
      startCursor: {},
      cardOverlaps: []
    }
  },
  computed: {
    styles () {
      const zoom = 1 / this.spaceZoomDecimal
      return {
        width: `${this.pageWidth * zoom}px`,
        height: `${this.pageHeight * zoom}px`,
        transform: `scale(${this.spaceZoomDecimal})`
      }
    },
    minimapIsVisible () { return this.$store.state.minimapIsVisible },
    cards () { return this.$store.getters['currentCards/all'] },
    currentConnectionStartCardIds () { return this.$store.state.currentConnectionStartCardIds },
    isPainting () { return this.$store.state.currentUserIsPainting },
    isPanningReady () { return this.$store.state.currentUserIsPanningReady },
    spaceIsReadOnly () { return !this.$store.getters['currentUser/canEditSpace']() },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    isDrawingConnection () { return this.$store.state.currentUserIsDrawingConnection },
    isResizingCard () { return this.$store.state.currentUserIsResizingCard },
    isDraggingCard () { return this.$store.state.currentUserIsDraggingCard },
    connections () { return this.$store.getters['currentConnections/all'] },
    viewportHeight () { return this.$store.state.viewportHeight },
    viewportWidth () { return this.$store.state.viewportWidth },
    pageHeight () { return this.$store.state.pageHeight },
    pageWidth () { return this.$store.state.pageWidth },
    currentUser () { return this.$store.state.currentUser },
    isInteracting () {
      if (this.isDraggingCard || this.isDrawingConnection || this.isResizingCard) {
        return true
      } else { return false }
    },
    remoteCurrentConnections () { return this.$store.state.remoteCurrentConnections },
    spaceMembers () {
      const excludeCurrentUser = true
      return this.$store.getters['currentSpace/members'](excludeCurrentUser)
    },
    spaceZoomDecimal () { return this.$store.getters.spaceZoomDecimal }
  },
  methods: {
    updateCardOverlaps () {
      let cards = this.$store.getters['currentCards/all']
      cards = utils.clone(cards)
      const viewport = utils.visualViewport()
      const zoom = this.$store.getters.spaceCounterZoomDecimal
      cardOverlaps.postMessage({ cards, viewport, zoom })
    },
    mergeOverlapGroup (previousValue, currentValue) {
      let x = previousValue.x || 0
      if (currentValue.x > x) {
        x = currentValue.x
      }
      let y = previousValue.y || 0
      if (currentValue.y > y) {
        y = currentValue.y
      }
      return { x, y }
    },
    correctCardConnectionPaths () {
      const space = utils.clone(this.$store.state.currentSpace)
      const user = utils.clone(this.$store.state.currentUser)
      const currentSpaceIsRemote = utils.currentSpaceIsRemote(space, user)
      this.$store.dispatch('currentConnections/correctPaths', { shouldUpdateApi: currentSpaceIsRemote })
    },
    loadSpaceOnBackOrForward (event) {
      const url = window.location.href
      if (!utils.urlIsSpace(url)) { return }
      const spaceId = utils.spaceIdFromUrl(url)
      const space = { id: spaceId }
      this.$store.dispatch('currentSpace/loadSpace', { space })
    },
    unloadPage () {
      this.$store.commit('broadcast/close')
      this.$store.dispatch('currentSpace/removeEmptyCards')
      this.$store.commit('triggerUnloadPage')
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
    initInteractions (event) {
      if (this.eventIsFromTextarea(event)) {
        shouldCancel = true
      } else {
        shouldCancel = false
      }
      if (this.spaceIsReadOnly) { return }
      this.startCursor = utils.cursorPositionInViewport(event)
    },

    constrainCursorToAxis (event) {
      if (!event.shiftKey) { return }
      const delta = {
        x: Math.abs(endCursor.x - this.startCursor.x),
        y: Math.abs(endCursor.y - this.startCursor.y)
      }
      if (delta.x > delta.y) {
        endCursor.y = prevCursor.y
      } else {
        endCursor.x = prevCursor.x
      }
    },
    resizeCards () {
      if (!prevCursor) { return }
      const cardIds = this.$store.state.currentUserIsResizingCardIds
      const deltaX = endCursor.x - prevCursor.x
      this.$store.dispatch('currentCards/resize', { cardIds, deltaX })
    },
    stopResizingCards () {
      if (!this.$store.state.currentUserIsResizingCard) { return }
      this.$store.dispatch('history/resume')
      const cardIds = this.$store.state.currentUserIsResizingCardIds
      const cards = cardIds.map(id => this.$store.getters['currentCards/byId'](id))
      this.$store.dispatch('history/add', { cards, useSnapshot: true })
      this.$store.commit('currentUserIsResizingCard', false)
      this.$store.commit('broadcast/updateStore', { updates: { userId: this.currentUser.id }, type: 'removeRemoteUserResizingCards' })
    },
    interact (event) {
      endCursor = utils.cursorPositionInViewport(event)
      if (this.isDraggingCard) {
        this.constrainCursorToAxis(event)
        this.dragCard()
        this.updateCardOverlaps()
      }
      if (this.isResizingCard) {
        this.resizeCards()
        this.updateCardOverlaps()
      }
      prevCursor = utils.cursorPositionInViewport(event)
    },
    checkShouldShowDetails () {
      if (!utils.cursorsAreClose(this.startCursor, endCursor)) {
        this.$store.commit('preventDraggedCardFromShowingDetails', true)
      }
    },
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
    dragCard () {
      this.$store.dispatch('history/pause')
      const prevCursor = this.cursor()
      const shouldPrevent = this.checkIfShouldPreventInteraction()
      if (shouldPrevent) { return }
      this.$store.dispatch('currentCards/move', {
        endCursor,
        prevCursor: prevCursor
      })
      this.checkShouldShowDetails()
    },
    checkIfShouldPreventInteraction () {
      if (this.spaceIsReadOnly) {
        const position = this.cursor()
        const notificationWithPosition = document.querySelector('.notifications-with-position .item')
        if (!notificationWithPosition) {
          this.$store.commit('addNotificationWithPosition', { message: 'Space is Read Only', position, type: 'info' })
        }
        return true
      }
    },
    normalizeSpaceCardsZ () {
      const sorted = sortBy(this.cards, ['z'])
      const zList = sorted.map(card => card.z)
      const isNormalized = uniq(zList).length === zList.length
      if (isNormalized) { return }
      sorted.forEach((card, index) => {
        this.$store.dispatch('currentCards/update', { id: card.id, z: index })
      })
    },
    addCard (position) {
      const zoom = this.$store.getters.spaceCounterZoomDecimal
      const isParentCard = true
      position = {
        x: position.x * zoom,
        y: position.y * zoom
      }
      if (this.spaceIsReadOnly) {
        this.$store.commit('addNotificationWithPosition', { message: 'Space is Read Only', position, type: 'info' })
        return
      }
      this.normalizeSpaceCardsZ()
      this.$store.dispatch('currentCards/add', { position, isParentCard })
      this.$store.commit('childCardId', '')
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
      return Boolean(fromDialog || fromHeader || fromFooter)
    },
    checkIfShouldHideFooter (event) {
      if (event.target.nodeType !== 1) { return } // firefox check
      const isTouchDevice = this.$store.state.isTouchDevice
      if (!isTouchDevice) { return }
      const node = event.target.nodeName
      const isTextarea = node === 'TEXTAREA'
      const isInput = node === 'INPUT'
      if (isTextarea || isInput) {
        this.$store.commit('shouldHideFooter', true)
      } else {
        this.$store.commit('shouldHideFooter', false)
      }
    },
    showMultipleSelectedActions (event) {
      if (this.spaceIsReadOnly) { return }
      if (this.$store.state.preventDraggedCardFromShowingDetails) { return }
      if (this.$store.state.preventMultipleSelectedActionsIsVisible) { return }
      const isMultipleSelected = this.$store.state.multipleCardsSelectedIds.length || this.$store.state.multipleConnectionsSelectedIds.length
      if (isMultipleSelected) {
        const position = utils.cursorPositionInPage(event)
        this.$store.commit('multipleSelectedActionsPosition', position)
        this.$store.commit('multipleSelectedActionsIsVisible', true)
      }
    },
    selectOverlap (overlap) {
      this.$store.dispatch('closeAllDialogs', 'Space.selectOverlap')
      const threshold = 20
      const position = {
        x: overlap.x + threshold,
        y: overlap.y + threshold
      }
      this.$store.commit('multipleCardsSelectedIds', overlap.ids)
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
      //   preventDraggedCardFromShowingDetails: this.$store.state.preventDraggedCardFromShowingDetails,
      //   currentDraggingCardId: this.$store.state.currentDraggingCardId,
      //   currentUserIsPainting: this.$store.state.currentUserIsPainting,
      //   currentUserIsPaintingLocked: this.$store.state.currentUserIsPainting,
      //   isDraggingCard: this.isDraggingCard,
      // }
      console.log('💣 stopInteractions') // stopInteractions and Space/stopPainting are run on all mouse and touch end events
      this.addInteractionBlur()
      if (event.touches) {
        this.$store.commit('triggerUpdatePositionInVisualViewport')
      }
      this.checkIfShouldHideFooter(event)
      if (this.shouldCancel(event)) { return }
      // add or close card
      if (this.$store.state.shouldAddCard) {
        const position = utils.cursorPositionInPage(event)
        this.addCard(position)
      } else if (this.$store.state.cardDetailsIsVisibleForCardId) {
        this.$store.dispatch('closeAllDialogs', 'Space.stopInteractions')
      }
      this.showMultipleSelectedActions(event)
      this.$store.commit('importArenaChannelIsVisible', false)
      this.$store.commit('shouldAddCard', false)
      this.$store.commit('preventDraggedCardFromShowingDetails', false)
      this.stopResizingCards()
      this.$store.commit('currentUserIsPainting', false)
      this.$store.commit('currentUserIsPaintingLocked', false)
      if (this.isDraggingCard) {
        this.$store.dispatch('currentCards/afterMove')
        this.showMultipleSelectedActions(event)
      }
      this.$store.commit('currentUserIsDraggingCard', false)
      this.updatePageSizes()
      this.$store.commit('prevCursorPosition', utils.cursorPositionInPage(event))
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
  transform-origin top left
  &.hidden-by-mindmap
    opacity 0.2
  .card-overlap-indicator
    position absolute
    z-index calc(var(--max-z) - 70)
    pointer-events all
    cursor pointer
    span
      line-height 1.5

.is-interacting
  pointer-events all
.is-not-interacting
  *
    pointer-events none !important
    cursor default

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

</style>
