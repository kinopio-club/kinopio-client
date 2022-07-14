<template lang="pug">
.box-selecting
  .box-select(v-if="currentUserIsBoxSelecting" :style="currentUserStyles")
  template(v-for="style in previousBoxStyles")
    .box-select.hide-me(:style="style" @animationend="removePreviousBoxStyle")
  //- remote
  template(v-for="style in remoteUserBoxSelectStyles")
    .box-select(:style="style")
  template(v-for="style in remotePreviousUserBoxSelectStyles")
    .box-select.hide-me(:style="style" @animationend="removePreviousRemoteBoxStyle")
</template>

<script>
import utils from '@/utils.js'

import { getOverlapSize } from 'overlap-area'
import uniqBy from 'lodash-es/uniqBy'
import quadratic from 'adaptive-quadratic-curve'
import hexToRgba from 'hex-to-rgba'
import { nanoid } from 'nanoid'

let shouldSelect, currentBoxSelectId
let selectableCards = {}
let selectableConnections = {}
let previouslySelectedCardIds = []
let previouslySelectedConnectionIds = []

export default {
  name: 'BoxSelecting',
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'currentUserIsBoxSelecting') {
        const isSelecting = mutation.payload
        // before start selection
        if (isSelecting) {
          shouldSelect = true
          currentBoxSelectId = nanoid()
          this.updatePreviouslySelectedItems()
        // end selection
        } else {
          if (!shouldSelect) { return }
          shouldSelect = false
          this.previousBoxStyles.push(this.currentUserStyles)
          this.broadcast('updateRemotePreviousBoxSelectStyles')
        }
      // start selection
      } else if (mutation.type === 'currentUserBoxSelectStart') {
        this.updateSelectableCards()
        this.updateSelectableConnections()
      // on move
      } else if (mutation.type === 'currentUserBoxSelectEnd') {
        const { start, end, relativePosition } = this.orderedPoints(this.start, this.end)
        const box = this.box(start, end)
        this.selectCards(box, relativePosition)
        this.selectconnections(box, relativePosition)
        this.$nextTick(() => {
          this.broadcast('updateRemoteUserBoxSelectStyles')
        })
      }
    })
  },
  data () {
    return {
      direction: 'to bottom right',
      previousBoxStyles: []
    }
  },
  computed: {
    currentUserIsBoxSelecting () { return this.$store.state.currentUserIsBoxSelecting },
    start () { return this.zoom(this.$store.state.currentUserBoxSelectStart) },
    end () { return this.zoom(this.$store.state.currentUserBoxSelectEnd) },
    userCantEditSpace () { return !this.$store.getters['currentUser/canEditSpace']() },
    currentUserStyles () {
      const { start, end } = this.orderedPoints(this.start, this.end)
      const { left, top, width, height } = this.box(start, end)
      const color = this.$store.state.currentUser.color
      const color1 = hexToRgba(color, 0.5)
      const color2 = hexToRgba(color, 1)
      const gradient = `radial-gradient(farthest-corner at ${this.direction}, ${color1}, ${color2})`
      let styles = {
        left: left + 'px',
        top: top + 'px',
        width: width + 'px',
        height: height + 'px',
        background: gradient,
        userId: this.$store.state.currentUser.id,
        currentBoxSelectId: currentBoxSelectId
      }
      return styles
    },
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal },
    remoteUserBoxSelectStyles () { return this.$store.state.remoteUserBoxSelectStyles },
    remotePreviousUserBoxSelectStyles () { return this.$store.state.remotePreviousUserBoxSelectStyles }
  },
  methods: {
    broadcast (operation) {
      this.$store.commit('broadcast/update', { updates: this.currentUserStyles, type: operation, handler: operation })
    },
    removePreviousBoxStyle () {
      this.previousBoxStyles.shift()
    },
    removePreviousRemoteBoxStyle () {
      this.$store.commit('removeRemotePreviousBoxSelectStyle')
    },
    zoom (point) {
      const zoom = this.spaceCounterZoomDecimal
      return {
        x: Math.ceil(point.x * zoom),
        y: Math.ceil(point.y * zoom)
      }
    },
    updatePreviouslySelectedItems () {
      previouslySelectedCardIds = this.$store.state.multipleCardsSelectedIds
      previouslySelectedConnectionIds = this.$store.state.multipleConnectionsSelectedIds
    },
    box (start, end) {
      return {
        x: start.x,
        y: start.y,
        left: start.x,
        top: start.y,
        width: Math.abs(start.x - end.x),
        height: Math.abs(start.y - end.y)
      }
    },
    updateDirection (position) {
      if (position === 'bottomLeft') {
        this.direction = 'right top'
      } else if (position === 'topLeft') {
        this.direction = 'right bottom'
      } else if (position === 'topRight') {
        this.direction = 'left bottom'
      } else {
        this.direction = 'left top'
      }
    },
    orderedPoints (start, end) {
      //                    │
      //                    │
      //       topLeft      │      topRight
      //                    │
      //                    │
      //   end: x less &    │   end: x greater &
      //       y less       │       y less
      //                    │
      //                    │
      // ───────────────────┼─────────────────────
      //                    │
      //                    │    bottomRight
      //      bottomLeft    │     (default)
      //                    │
      //                    │
      //    end: x less &   │   end: x greater &
      //      y greater     │      y greater
      //                    │
      //                    │
      let relativePosition = 'bottomRight'
      if (end.x <= start.x && end.y <= start.y) {
        relativePosition = 'topLeft'
      } else if (end.x >= start.x && end.y <= start.y) {
        relativePosition = 'topRight'
      } else if (end.x <= start.x && end.y >= start.y) {
        relativePosition = 'bottomLeft'
      }
      let newStart, newEnd
      if (relativePosition === 'topLeft') {
        newStart = end
        newEnd = start
      } else if (relativePosition === 'topRight') {
        newStart = { x: start.x, y: end.y }
        newEnd = { x: end.x, y: start.y }
      } else if (relativePosition === 'bottomLeft') {
        newStart = { x: end.x, y: start.y }
        newEnd = { x: start.x, y: end.y }
      } else {
        newStart = start
        newEnd = end
      }
      this.updateDirection(relativePosition)
      return { start: newStart, end: newEnd, relativePosition }
    },
    selectableItems (items) {
      const origin = this.start
      let selectableItems = { topLeft: [], topRight: [], bottomLeft: [], bottomRight: [] }
      items.forEach(item => {
        const { x, y, height, width } = item
        const isTop = y <= origin.y
        const isBottom = (y >= origin.y || y + height >= origin.y)
        const isLeft = x <= origin.x
        const isRight = (x >= origin.x || x + width >= origin.x)
        // group into quadrants
        if (isTop && isLeft) { selectableItems.topLeft.push(item) }
        if (isTop && isRight) { selectableItems.topRight.push(item) }
        if (isBottom && isLeft) { selectableItems.bottomLeft.push(item) }
        if (isBottom && isRight) { selectableItems.bottomRight.push(item) }
      })
      return selectableItems
    },
    updateSelectableCards () {
      const cards = this.$store.getters['currentCards/isNotLocked']
      selectableCards = this.selectableItems(cards)
    },
    updateSelectableConnections () {
      const paths = document.querySelectorAll('svg .connection-path')
      let connections = []
      paths.forEach(path => {
        const pathId = path.dataset.id
        const rect = path.getBoundingClientRect()
        const connection = {
          id: pathId,
          x: rect.x + window.scrollX,
          y: rect.y + window.scrollY,
          width: Math.ceil(rect.width),
          height: Math.ceil(rect.height)
        }
        connections.push(connection)
      })
      selectableConnections = this.selectableItems(connections)
    },
    points (rect) {
      const { x, y, height, width } = rect
      const x1 = x
      const x2 = x + width
      const y1 = y
      const y2 = y + height
      return [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2]
      ]
    },
    mergePreviouslySelected (selectedIds, type) {
      let previouslySelectedIds
      if (type === 'cards') {
        previouslySelectedIds = previouslySelectedCardIds
      } else {
        previouslySelectedIds = previouslySelectedConnectionIds
      }
      previouslySelectedIds.forEach(id => {
        const index = selectedIds.indexOf(id)
        if (index >= 0) {
          selectedIds.splice(index, 1)
        } else {
          selectedIds.push(id)
        }
      })
      return selectedIds
    },
    selectCards (box, relativePosition) {
      if (this.userCantEditSpace) { return }
      const boxPoints = this.points(box)
      let cards = selectableCards[relativePosition]
      if (!cards) { return }
      let selectedCards = cards.filter(card => {
        const cardPoints = this.points(card)
        return Boolean(getOverlapSize(boxPoints, cardPoints))
      })
      selectedCards = uniqBy(selectedCards, 'id')
      let selectedIds = selectedCards.map(card => card.id)
      selectedIds = this.mergePreviouslySelected(selectedIds, 'cards')
      this.$store.dispatch('multipleCardsSelectedIds', selectedIds)
    },
    pointsAlongPath (connection) {
      const element = document.querySelector(`svg .connection-path[data-id='${connection.id}']`)
      if (!element) { return }
      const pathData = element.getPathData()
      let m, q
      pathData.forEach(data => {
        if (data.type === 'm') {
          m = data.values
        } else if (data.type === 'q') {
          q = data.values
        }
      })
      const start = [m[0], m[1]]
      const startX = start[0]
      const startY = start[1]
      const c1 = [startX + q[0], startY + q[1]]
      const end = [startX + q[2], startY + q[3]]
      const scale = 2
      return quadratic(start, c1, end, scale) // [[x1,x2], [x2,x2], …]
    },
    selectconnections (box, relativePosition) {
      if (this.userCantEditSpace) { return }
      let connections = selectableConnections[relativePosition]
      if (!connections) { return }
      let selectedConnections = connections.filter(connection => {
        const pointsAlongPath = this.pointsAlongPath(connection)
        if (!pointsAlongPath) { return }
        if (!pointsAlongPath.length) { return }
        const isSelected = pointsAlongPath.find(point => {
          const x = Math.round(point[0])
          const y = Math.round(point[1])
          const xIsInBox = utils.isBetween({ value: x, min: box.x, max: box.x + box.width })
          const yIsInBox = utils.isBetween({ value: y, min: box.y, max: box.y + box.height })
          return xIsInBox && yIsInBox
        })
        return Boolean(isSelected)
      })
      selectedConnections = uniqBy(selectedConnections, 'id')
      let selectedIds = selectedConnections.map(connection => connection.id)
      selectedIds = this.mergePreviouslySelected(selectedIds, 'connections')
      this.$store.dispatch('multipleConnectionsSelectedIds', selectedIds)
    }
  }
}
</script>

<style lang="stylus">
.box-selecting
  z-index -1
  pointer-events none
  position absolute
  top 0
  left 0
  width 100%
  height 100%
  .box-select
    position absolute
  .hide-me
    animation-name hideme
    animation-duration 0.5s
    animation-iteration-count 1
    animation-direction forward
    animation-fill-mode forwards
    animation-timing-function ease-out
</style>
