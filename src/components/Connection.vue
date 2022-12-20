<template lang="pug">
template(v-if="isVisibleInViewport")
  g.connection
    path.connection-path(
      fill="none"
      :stroke="typeColor"
      stroke-width="5"
      :data-start-card="startCardId"
      :data-end-card="endCardId"
      :data-id="id"
      :data-type-name="typeName"
      :data-type-id="connectionTypeId"
      :data-is-hidden-by-comment-filter="isHiddenByCommentFilter"
      :key="id"
      :d="path"
      @mousedown.left="startDraggingConnection"
      @touchstart="startDraggingConnection"
      @mouseup.left="showConnectionDetails"
      @touchend.stop="showConnectionDetails"
      @keyup.stop.backspace="removeConnection"
      @keyup.stop.enter="showConnectionDetailsOnKeyup"
      :class="{active: isSelected || detailsIsVisible || remoteDetailsIsVisible || isRemoteSelected || isCurrentCardConnection, filtered: isFiltered, hover: isHovered, 'hide-connection-outline': shouldHideConnectionOutline, 'is-hidden-by-opacity': isHiddenByCommentFilter }"
      ref="connection"
      tabindex="0"
      @dragover.prevent
      @drop.prevent.stop="addCardsAndUploadFiles"
    )

  defs
    linearGradient(:id="gradientId")
      stop(offset="0%" :stop-color="typeColor" stop-opacity="0" fill-opacity="0")
      stop(offset="90%" :stop-color="typeColor")

  circle(v-if="directionIsVisible && !isUpdatingPath && isVisibleInViewport" r="7" :fill="gradientIdReference" :class="{filtered: isFiltered}")
    animateMotion(dur="3s" repeatCount="indefinite" :path="path" rotate="auto")
</template>

<script>
import utils from '@/utils.js'

let animationTimer, isMultiTouch, startCursor, currentCursor

export default {
  name: 'Connection',
  props: {
    connection: Object
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'clearMultipleSelected') {
        const selectedIds = this.$store.state.multipleConnectionsSelectedIds
        const selected = selectedIds.includes(this.id) || this.$store.state.connectionDetailsIsVisibleForConnectionId === this.id
        if (!selected) {
          this.cancelAnimation()
        }
      } else if (mutation.type === 'currentCards/move') {
        this.cancelAnimation()
      } else if (mutation.type === 'currentConnections/remove') {
        this.controlCurve = undefined
      } else if (mutation.type === 'triggerShowConnectionDetails') {
        if (mutation.payload.connectionId === this.id) {
          const isFromStore = true
          this.showConnectionDetails(mutation.payload.event, isFromStore)
        }
      }
    })
  },
  data () {
    return {
      controlCurve: undefined,
      curvedPath: '',
      frameCount: 0
    }
  },
  computed: {
    cards () {
      const cards = utils.clone(this.$store.getters['currentCards/all'])
      const startCard = cards.find(card => card.id === this.startCardId)
      const endCard = cards.find(card => card.id === this.endCardId)
      return { startCard, endCard }
    },
    isHiddenByCommentFilter () {
      const filterCommentsIsActive = this.$store.state.currentUser.filterComments
      if (!filterCommentsIsActive) { return }
      const startCard = this.cards.startCard
      const endCard = this.cards.endCard
      const startCardIsComment = startCard.isComment || utils.isNameComment(startCard.name)
      const endCardIsComment = startCard.isComment || utils.isNameComment(endCard.name)
      return startCardIsComment || endCardIsComment
    },
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    id () { return this.connection.id },
    gradientId () { return `gradient-${this.id}` },
    gradientIdReference () { return `url('#${this.gradientId}')` },
    connectionType () { return this.$store.getters['currentConnections/typeByTypeId'](this.connectionTypeId) },
    connectionTypeId () { return this.connection.connectionTypeId },
    startCardId () { return this.connection.startCardId },
    endCardId () { return this.connection.endCardId },
    connectionPath () { return this.connection.path },
    remoteCardsIsDragging () { return Boolean(this.$store.state.remoteCardsDragging.length) },
    path () {
      if (this.controlCurve) {
        const { controlPoint, x, y } = this.controlCurve
        const path = this.curvedPath || this.connection.path
        const curvedPath = this.updatedPath(path, controlPoint, x, y)
        return curvedPath
      } else {
        return this.connection.path
      }
    },
    typeColor () {
      if (!this.connectionType) { return }
      return this.connectionType.color
    },
    typeName () {
      if (!this.connectionType) { return }
      return this.connectionType.name
    },
    isSelected () {
      const selectedIds = this.$store.state.multipleConnectionsSelectedIds
      return selectedIds.includes(this.id)
    },
    isRemoteSelected () {
      const remoteConnections = this.$store.state.remoteConnectionsSelected
      const isSelected = remoteConnections.find(connection => connection.connectionId === this.id)
      return isSelected
    },
    isCurrentCardConnection () {
      const currentCardConnections = this.$store.state.currentCardConnections
      return currentCardConnections.includes(this.id)
    },
    detailsIsVisible () {
      const canEditSpace = this.$store.getters['currentUser/canEditSpace']()
      if (!canEditSpace) { return }
      const detailsId = this.$store.state.connectionDetailsIsVisibleForConnectionId
      return detailsId === this.id
    },
    remoteDetailsIsVisible () {
      const remoteConnections = this.$store.state.remoteConnectionDetailsVisible
      const isSelected = remoteConnections.find(connection => connection.connectionId === this.id)
      return isSelected
    },
    shouldAnimate () {
      if (this.$store.state.currentUserIsDraggingCard) { return }
      return Boolean(this.isSelected || this.detailsIsVisible || this.remoteDetailsIsVisible || this.isRemoteSelected)
    },
    isHovered () { return this.id === this.$store.state.currentUserIsHoveringOverConnectionId },
    shouldHideConnectionOutline () { return this.$store.state.shouldHideConnectionOutline },

    // filters
    filtersIsActive () {
      const types = this.$store.state.filteredConnectionTypeIds
      const frames = this.$store.state.filteredFrameIds
      const tags = this.$store.state.filteredTagNames
      return Boolean(types.length + frames.length + tags.length)
    },
    isCardsFilteredByFrame () {
      const frameIds = this.$store.state.filteredFrameIds
      const startCard = this.cards.startCard
      const endCard = this.cards.endCard
      const startCardInFilter = frameIds.includes(startCard.frameId)
      const endCardInFilter = frameIds.includes(endCard.frameId)
      return startCardInFilter || endCardInFilter
    },
    isConnectionFilteredByType () {
      const typeIds = this.$store.state.filteredConnectionTypeIds
      if (!this.connectionType) { return }
      return typeIds.includes(this.connectionType.id)
    },
    isFiltered () {
      if (this.filtersIsActive) {
        const isInFilter = this.isCardsFilteredByFrame || this.isConnectionFilteredByType
        if (isInFilter) {
          return false
        } else {
          return true
        }
      } else { return false }
    },
    directionIsVisible () {
      this.checkIfShouldPauseConnectionDirections()
      return this.connection.directionIsVisible
    },
    isUpdatingPath () {
      let shouldHide
      const currentUserIsDragging = this.$store.state.currentUserIsDraggingCard
      let cards = []
      const multipleCardsSelectedIds = this.$store.state.multipleCardsSelectedIds
      const currentCardId = this.$store.state.currentDraggingCardId
      const remoteCardsDragging = utils.clone(this.$store.state.remoteCardsDragging)
      const remoteCardsSelected = utils.clone(this.$store.state.remoteCardsSelected)
      // local multiple
      if (multipleCardsSelectedIds.length && currentUserIsDragging) {
        cards = multipleCardsSelectedIds.map(id => this.$store.getters['currentCards/byId'](id))
      // local single
      } else if (currentCardId && currentUserIsDragging) {
        const currentCard = this.$store.getters['currentCards/byId'](currentCardId)
        cards = [currentCard]
      // remote multiple
      } else if (this.remoteCardsIsDragging && remoteCardsSelected.length) {
        cards = remoteCardsSelected.map(card => {
          card.id = card.cardId
          return card
        })
      // remote single
      } else if (this.remoteCardsIsDragging) {
        cards = remoteCardsDragging.map(card => {
          card.id = card.cardId
          return card
        })
      }
      cards = cards.filter(card => Boolean(card))
      cards.forEach(card => {
        if (card.id === this.startCardId || card.id === this.endCardId) {
          shouldHide = true
        }
      })
      this.checkIfShouldPauseConnectionDirections()
      return shouldHide
    },
    isVisibleInViewport () {
      if (this.$store.state.disableViewportOptimizations) { return true }
      if (this.isUpdatingPath) { return true }
      if (!this.connection.path) {
        return
      }
      const threshold = 400 * this.$store.getters.spaceCounterZoomDecimal
      const viewport = this.$store.state.viewportHeight * this.$store.getters.spaceCounterZoomDecimal
      const scroll = this.$store.state.windowScroll.y
      let y1 = utils.coordsFromConnectionPath(this.connection.path).y
      let y2 = utils.endCoordsFromConnectionPath(this.connection.path).y + y1
      if (y1 > y2) {
        const y = y1
        y1 = y2
        y2 = y
      }
      //       ┌───┐
      //   y1  │\\\│
      //   ●   │\\\│
      //   │   │\\\│
      //   │   │\\\│  ┌───┐
      //   │   │\\\│  │\\\│
      //   │   └───┘  │\\\│
      //   │          │\\\│
      //   │          │\\\│ ┌───┐
      //   │          │\\\│ │\\\│
      //   │          └───┘ │\\\│
      //   │                │\\\│
      //   ●                │\\\│
      //   y2               │\\\│
      //                    └───┘
      const y1IsBelow = y1 - threshold > scroll + viewport
      const y2IsAbove = y2 + threshold < scroll
      const isNotInview = y1IsBelow || y2IsAbove
      return !isNotInview
    }

  },
  methods: {
    checkIfShouldPauseConnectionDirections () {
      this.$store.dispatch('currentSpace/unpauseConnectionDirections')
      this.$nextTick(() => {
        this.$store.dispatch('currentSpace/checkIfShouldPauseConnectionDirections')
      })
    },
    removeConnection () {
      if (!this.isSpaceMember) { return }
      this.$store.dispatch('currentConnections/remove', this.connection)
      this.$store.dispatch('currentConnections/removeUnusedTypes')
    },
    checkIsMultiTouch (event) {
      isMultiTouch = false
      if (utils.isMultiTouch(event)) {
        isMultiTouch = true
      }
    },
    showConnectionDetails (event, isFromStore) {
      if (isMultiTouch) { return }
      if (!this.canEditSpace) { this.$store.commit('triggerReadOnlyJiggle') }
      if (!isFromStore) {
        currentCursor = utils.cursorPositionInViewport(event)
        if (!utils.cursorsAreClose(startCursor, currentCursor)) { return }
      }
      this.$store.dispatch('closeAllDialogs', 'Connection.showConnectionDetails')
      if (event.shiftKey) {
        this.$store.dispatch('toggleMultipleConnectionsSelected', this.id)
        this.$store.commit('previousMultipleConnectionsSelectedIds', utils.clone(this.$store.state.multipleConnectionsSelectedIds))
        return
      }
      const dialogPosition = utils.cursorPositionInPage(event)
      this.$store.dispatch('connectionDetailsIsVisibleForConnectionId', this.id)
      this.$store.commit('connectionDetailsPosition', dialogPosition)
      this.$store.dispatch('clearMultipleSelected')
    },
    startDraggingConnection (event) {
      this.checkIsMultiTouch(event)
      this.$store.commit('shouldHideConnectionOutline', true)
      startCursor = utils.cursorPositionInViewport(event)
    },
    showConnectionDetailsOnKeyup (event) {
      this.showConnectionDetails(event)
      this.focusOnDialog(event)
    },
    focusOnDialog (event) {
      this.$nextTick(() => {
        document.querySelector('dialog.connection-details button').focus()
      })
    },
    updatedPath (path, controlPoint, x, y) {
      return path.replace(controlPoint, `q${x},${y}`)
    },
    newPointPosition (base, cycleProgress, isForwardCycle) {
      if (isForwardCycle) {
        return Math.round(base + Math.exp(cycleProgress / 6))
      } else {
        return Math.round(base - Math.exp(cycleProgress / 6))
      }
    },
    controlPointPosition ({ x, y }) {
      const framesPerDirection = 12
      const completedCycles = Math.floor(this.frameCount / framesPerDirection)
      const cycleProgress = (this.frameCount - completedCycles * framesPerDirection) / framesPerDirection
      const isForwardCycle = utils.isEvenNumber(completedCycles)
      x = this.newPointPosition(x, cycleProgress, isForwardCycle)
      y = this.newPointPosition(y, cycleProgress, isForwardCycle)
      return { x, y }
    },
    animationFrame () {
      this.frameCount++
      this.curvedPath = this.path
      const curvePattern = new RegExp(/(q[-0-9]*),([-0-9]*)\w+/)
      // "q90,40" from "m747,148 q90,40 -85,75"
      // "q-90,-40" from "m747,148 q-90,-40 -85,75" (negative)
      // "q-200,-0" from "m217,409 q200,1 492,-78" (variable length)
      const curveMatch = this.curvedPath.match(curvePattern)
      const points = curveMatch[0].substring(1, curveMatch[0].length).split(',')
      // ["90", "40"] from "q90,40"
      // ["90", "-40"] from "q-90,-40" (negative)
      // ["200", "1"] from "q200,1" (variable length)
      const { x, y } = this.controlPointPosition({
        x: parseInt(points[0]),
        y: parseInt(points[1])
      })
      this.controlCurve = {
        controlPoint: curveMatch[0], // "q90, 40"
        index: curveMatch.index,
        length: curveMatch[0].length,
        x,
        y
      }
      if (this.shouldAnimate) {
        window.requestAnimationFrame(this.animationFrame)
      }
    },
    cancelAnimation () {
      window.cancelAnimationFrame(animationTimer)
      animationTimer = undefined
      this.controlCurve = undefined
      this.curvedPath = undefined
      this.frameCount = 0
    },
    addCardsAndUploadFiles (event) {
      let files = event.dataTransfer.files
      files = Array.from(files)
      const currentCursor = utils.cursorPositionInViewport(event)
      this.$store.dispatch('upload/addCardsAndUploadFiles', { files, currentCursor })
    }
  },
  watch: {
    shouldAnimate (shouldAnimate) {
      if (shouldAnimate) {
        animationTimer = window.requestAnimationFrame(this.animationFrame)
      }
    },
    connectionPath (path) {
      this.curvedPath = path
    }
  }

}
</script>

<style lang="stylus">
.connection-path
  touch-action manipulation
  &:hover,
  &.hover,
  &.active,
  &:focus
    stroke-width 7
  &.hide-connection-outline
    outline none
</style>
