<template lang="pug">
main#space.space(
  :class="{'is-interacting': isInteracting, 'is-not-interacting': isPainting || isPanningReady, 'hidden-by-mindmap': minimapIsVisible}"
  @mousedown.left="initInteractions"
  @touchstart="initInteractions"
  :style="styles"
  :data-zoom="spaceZoomDecimal"
)
  Connections(:startCursor="startCursor")
  Boxes
  Cards
  LockedItemButtons
  //- Presence
  template(v-for="user in spaceMembers")
    UserLabelCursor(:user="user")
  BoxDetails
  CardDetails
  ConnectionDetails
  MultipleSelectedActions
  ScrollAtEdgesHandler
  NotificationsWithPosition(layer="space")
  BoxSelecting
</template>

<script>
import Card from '@/components/Card.vue'
import CardDetails from '@/components/dialogs/CardDetails.vue'
import BoxDetails from '@/components/dialogs/BoxDetails.vue'
import UserLabelCursor from '@/components/UserLabelCursor.vue'
import ConnectionDetails from '@/components/dialogs/ConnectionDetails.vue'
import MultipleSelectedActions from '@/components/dialogs/MultipleSelectedActions.vue'
import ScrollAtEdgesHandler from '@/components/ScrollAtEdgesHandler.vue'
import NotificationsWithPosition from '@/components/NotificationsWithPosition.vue'
import BoxSelecting from '@/components/BoxSelecting.vue'
import Boxes from '@/components/Boxes.vue'
import Cards from '@/components/Cards.vue'
import Connections from '@/components/Connections.vue'
import LockedItemButtons from '@/components/LockedItemButtons.vue'
import utils from '@/utils.js'

import sortBy from 'lodash-es/sortBy'
import uniq from 'lodash-es/uniq'
import debounce from 'lodash-es/debounce'

let prevCursor, endCursor, shouldCancel
let processQueueIntervalTimer

export default {
  name: 'Space',
  components: {
    Card,
    CardDetails,
    BoxDetails,
    UserLabelCursor,
    ConnectionDetails,
    MultipleSelectedActions,
    ScrollAtEdgesHandler,
    NotificationsWithPosition,
    BoxSelecting,
    Boxes,
    Cards,
    LockedItemButtons,
    Connections
  },
  beforeCreate () {
    this.$store.dispatch('currentUser/init')
    this.$store.dispatch('currentSpace/init')
    const currentUserIsSignedIn = this.$store.getters['currentUser/isSignedIn']
    if (currentUserIsSignedIn) {
      this.$store.commit('broadcast/connect')
    }
  },
  mounted () {
    // bind events to window to receive events when mouse is outside window
    window.addEventListener('mousemove', this.interact)
    window.addEventListener('touchmove', this.interact)
    window.addEventListener('mouseup', this.stopInteractions)
    window.addEventListener('touchend', this.stopInteractions)
    // keep space element updated to viewport size so connections show up
    this.updatePageSizes()
    window.addEventListener('resize', this.updatePageSizesDebounced)

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

    this.$store.dispatch('currentUser/restoreUserFavorites')

    // retry failed sync operations every 5 seconds
    processQueueIntervalTimer = setInterval(() => {
      this.$store.dispatch('api/processQueueOperations')
    }, 5000)
  },
  beforeUnmount () {
    window.removeEventListener('mousemove', this.interact)
    window.removeEventListener('touchmove', this.interact)
    window.removeEventListener('mouseup', this.stopInteractions)
    window.removeEventListener('touchend', this.stopInteractions)
    window.removeEventListener('resize', this.updatePageSizesDebounced)
    window.removeEventListener('online', this.updateIsOnline)
    window.removeEventListener('offline', this.updateIsOnline)
    window.removeEventListener('unload', this.unloadPage)
    window.removeEventListener('popstate', this.loadSpaceOnBackOrForward)
    clearInterval(processQueueIntervalTimer)
  },
  data () {
    return {
      startCursor: {}
    }
  },
  computed: {
    styles () {
      const transform = this.$store.getters.transformZoom
      return {
        width: `${this.pageWidth}px`,
        height: `${this.pageHeight}px`,
        transform: transform
      }
    },
    minimapIsVisible () { return this.$store.state.minimapIsVisible },
    unlockedCards () { return this.$store.getters['currentCards/isNotLocked'] },
    isPainting () { return this.$store.state.currentUserIsPainting },
    isPanningReady () { return this.$store.state.currentUserIsPanningReady },
    spaceIsReadOnly () { return !this.$store.getters['currentUser/canEditSpace']() },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    isDrawingConnection () { return this.$store.state.currentUserIsDrawingConnection },
    isResizingCard () { return this.$store.state.currentUserIsResizingCard },
    isDraggingCard () { return this.$store.state.currentUserIsDraggingCard },
    isResizingBox () { return this.$store.state.currentUserIsResizingBox },
    isDraggingBox () { return this.$store.state.currentUserIsDraggingBox },
    viewportHeight () { return this.$store.state.viewportHeight },
    viewportWidth () { return this.$store.state.viewportWidth },
    pageHeight () { return this.$store.state.pageHeight },
    pageWidth () { return this.$store.state.pageWidth },
    currentUser () { return this.$store.state.currentUser },
    isInteracting () {
      if (this.isDraggingCard || this.isDrawingConnection || this.isResizingCard || this.isResizingBox || this.isDraggingBox) {
        return true
      } else { return false }
    },
    spaceMembers () {
      const excludeCurrentUser = true
      return this.$store.getters['currentSpace/members'](excludeCurrentUser)
    },
    spaceZoomDecimal () { return this.$store.getters.spaceZoomDecimal }
  },
  methods: {
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
    updatePageSizesDebounced: debounce(function () {
      this.updatePageSizes()
    }, 500),
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
      if (this.$store.state.currentUserIsDraggingBox) { return }
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

    // cards

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

    // boxes

    resizeBoxes () {
      if (!prevCursor) { return }
      const boxIds = this.$store.state.currentUserIsResizingBoxIds
      const delta = {
        x: Math.round(endCursor.x - prevCursor.x),
        y: Math.round(endCursor.y - prevCursor.y)
      }
      this.$store.dispatch('currentBoxes/resize', { boxIds, delta })
    },
    stopResizingBoxes () {
      if (!this.$store.state.currentUserIsResizingBox) { return }
      this.$store.dispatch('history/resume')
      const boxIds = this.$store.state.currentUserIsResizingBoxIds
      const boxes = boxIds.map(id => this.$store.getters['currentBoxes/byId'](id))
      this.$store.dispatch('history/add', { boxes, useSnapshot: true })
      this.$store.commit('currentUserIsResizingBox', false)
      this.$store.commit('currentUserToolbar', 'card')
      this.$store.commit('broadcast/updateStore', { updates: { userId: this.currentUser.id }, type: 'removeRemoteUserResizingBoxes' })
      this.$store.dispatch('checkIfItemShouldIncreasePageSize', boxes[0])
    },

    dragItems () {
      this.$store.dispatch('history/pause')
      const prevCursor = this.cursor()
      const shouldPrevent = this.checkIfShouldPreventInteraction()
      if (shouldPrevent) { return }
      this.$store.dispatch('currentCards/move', {
        endCursor,
        prevCursor: prevCursor
      })
      this.checkShouldShowDetails()
      this.$store.dispatch('currentBoxes/move', {
        endCursor,
        prevCursor: prevCursor
      })
    },
    interact (event) {
      endCursor = utils.cursorPositionInViewport(event)
      if (this.isDraggingCard || this.isDraggingBox) {
        this.constrainCursorToAxis(event)
        this.dragItems()
      }
      if (this.isResizingCard) {
        this.resizeCards()
      }
      if (this.isResizingBox) {
        this.resizeBoxes()
      }
      prevCursor = utils.cursorPositionInViewport(event)
    },
    checkShouldShowDetails () {
      const shouldShow = !utils.cursorsAreClose(this.startCursor, endCursor)
      if (!shouldShow) { return }
      if (this.$store.state.currentUserIsDraggingCard) {
        this.$store.commit('preventDraggedCardFromShowingDetails', true)
      } else if (this.$store.state.currentUserIsDraggingBox) {
        this.$store.commit('preventDraggedBoxFromShowingDetails', true)
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
    checkIfShouldPreventInteraction () {
      if (this.spaceIsReadOnly) {
        const position = this.cursor()
        const notificationWithPosition = document.querySelector('.notifications-with-position .item')
        if (!notificationWithPosition) {
          this.$store.commit('addNotificationWithPosition', { message: 'Space is Read Only', position, type: 'info', layer: 'space', icon: 'cancel' })
        }
        return true
      }
    },
    normalizeSpaceCardsZ () {
      const sorted = sortBy(this.unlockedCards, ['z'])
      const zList = sorted.map(card => card.z)
      const isNormalized = uniq(zList).length === zList.length
      if (isNormalized) { return }
      sorted.forEach((card, index) => {
        this.$store.dispatch('currentCards/update', { id: card.id, z: index })
      })
    },
    addCard (event) {
      let position = utils.cursorPositionInSpace({ event })
      const isParentCard = true
      position = {
        x: position.x,
        y: position.y
      }
      if (this.spaceIsReadOnly) {
        this.$store.commit('addNotificationWithPosition', { message: 'Space is Read Only', position, type: 'info', layer: 'space', icon: 'cancel' })
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
      if (this.$store.state.preventMultipleSelectedActionsIsVisible) { return }
      const isMultipleSelected = this.$store.state.multipleCardsSelectedIds.length || this.$store.state.multipleConnectionsSelectedIds.length || this.$store.state.multipleBoxesSelectedIds.length
      if (isMultipleSelected) {
        const position = utils.cursorPositionInSpace({ event })
        this.$store.commit('multipleSelectedActionsPosition', position)
        this.$store.commit('multipleSelectedActionsIsVisible', true)
      }
    },
    addOrCloseCard (event) {
      if (this.$store.state.shouldAddCard) {
        let position = utils.cursorPositionInSpace({ event })
        // prevent addCard if position is outside space
        if (utils.isPositionOutsideOfSpace(position)) {
          position = utils.cursorPositionInPage(event)
          this.$store.commit('addNotificationWithPosition', { message: 'Outside Space', position, type: 'info', icon: 'cancel', layer: 'app' })
          return
        }
        // add card
        this.addCard(event)
      // close item details
      } else if (this.$store.state.cardDetailsIsVisibleForCardId || this.$store.state.boxDetailsIsVisibleForBoxId) {
        this.$store.dispatch('closeAllDialogs', 'Space.stopInteractions')
      }
    },
    unselectCardsInDraggedBox () {
      if (!this.$store.state.currentDraggingBoxId) { return }
      if (this.$store.state.multipleBoxesSelectedIds.length) { return }
      this.$store.dispatch('clearMultipleSelected')
    },
    showBoxDetails (event) {
      if (!this.$store.state.currentBoxIsNew) { return }
      if (utils.isMobile()) { return }
      const boxId = this.$store.state.currentUserIsResizingBoxIds[0]
      this.$nextTick(() => {
        this.$nextTick(() => {
          this.$store.commit('boxDetailsIsVisibleForBoxId', boxId)
        })
      })
    },

    // 💣 stopInteractions and Space/stopPainting are run on all mouse and touch end events

    stopInteractions (event) {
      console.log('💣 stopInteractions')
      this.$store.dispatch('currentCards/afterMove')
      this.$store.dispatch('currentBoxes/afterMove')
      this.addInteractionBlur()
      if (event.touches) {
        this.$store.commit('triggerUpdatePositionInVisualViewport')
      }
      this.checkIfShouldHideFooter(event)
      if (this.shouldCancel(event)) { return }
      this.addOrCloseCard(event)
      this.unselectCardsInDraggedBox()
      this.showMultipleSelectedActions(event)
      this.showBoxDetails(event)
      this.$store.commit('preventMultipleSelectedActionsIsVisible', false)
      this.$store.commit('importArenaChannelIsVisible', false)
      this.$store.commit('shouldAddCard', false)
      this.$store.commit('preventDraggedCardFromShowingDetails', false)
      this.$store.commit('preventDraggedBoxFromShowingDetails', false)
      this.stopResizingCards()
      this.stopResizingBoxes()
      this.$store.commit('currentUserIsPainting', false)
      this.$store.commit('currentUserIsPaintingLocked', false)
      this.$store.commit('currentUserIsDraggingCard', false)
      this.$store.commit('currentUserIsDraggingBox', false)
      this.$store.commit('boxesWereDragged', false)
      this.updatePageSizes()
      this.$store.commit('prevCursorPosition', utils.cursorPositionInPage(event))
      prevCursor = undefined
      this.$store.commit('clearDraggingItems')
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
    opacity 0.4
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

</style>
