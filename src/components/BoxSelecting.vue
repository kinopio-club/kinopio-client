<template lang="pug">
.box-selecting
  .box-select(v-if="currentUserIsBoxSelecting" :style="currentUserStyles")
</template>

<script>
import { getOverlapSize } from 'overlap-area'
import uniqBy from 'lodash-es/uniqBy'

let selectableCards = {}
let selectableConnections = {}
let previouslySelectedCardIds = []

export default {
  name: 'BoxSelecting',
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'currentUserIsBoxSelecting' && mutation.payload) {
        this.updatePreviouslySelectedItems()
      } else if (mutation.type === 'currentUserBoxSelectStart') {
        this.updateSelectableCards()
        this.updateSelectableConnections()
        console.log('🌈', selectableConnections)
      } else if (mutation.type === 'currentUserBoxSelectEnd') {
        this.selectCards()
        this.selectconnections()
      }
    })
  },
  computed: {
    currentUserIsBoxSelecting () { return this.$store.state.currentUserIsBoxSelecting },
    start () { return this.zoom(this.$store.state.currentUserBoxSelectStart) },
    end () { return this.zoom(this.$store.state.currentUserBoxSelectEnd) },
    userCantEditSpace () { return !this.$store.getters['currentUser/canEditSpace']() },
    currentUserStyles () {
      const { start, end } = this.orderedPoints(this.start, this.end)
      const { left, top, width, height } = this.box(start, end)
      const styles = {
        left: left + 'px',
        top: top + 'px',
        width: width + 'px',
        height: height + 'px',
        backgroundColor: this.$store.state.currentUser.color
      }
      return styles
    },
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal }
  },
  methods: {
    zoom (point) {
      const zoom = this.spaceCounterZoomDecimal
      return {
        x: Math.ceil(point.x * zoom),
        y: Math.ceil(point.y * zoom)
      }
    },
    updatePreviouslySelectedItems () {
      previouslySelectedCardIds = this.$store.state.multipleCardsSelectedIds
      // TODO prevconnections
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
      const cards = this.$store.getters['currentCards/all']
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
    mergePreviouslySelectedCards (selectedCardIds) {
      previouslySelectedCardIds.forEach(id => {
        const index = selectedCardIds.indexOf(id)
        if (index >= 0) {
          selectedCardIds.splice(index, 1)
        } else {
          selectedCardIds.push(id)
        }
      })
      return selectedCardIds
    },
    selectCards () {
      const { start, end, relativePosition } = this.orderedPoints(this.start, this.end)
      const box = this.box(start, end)
      const boxPoints = this.points(box)
      let cards = selectableCards[relativePosition]
      if (!cards) { return }
      let selectedCards = cards.filter(card => {
        const cardPoints = this.points(card)
        return Boolean(getOverlapSize(boxPoints, cardPoints))
      })
      selectedCards = uniqBy(selectedCards, 'id')
      let selectedCardIds = selectedCards.map(card => card.id)
      selectedCardIds = this.mergePreviouslySelectedCards(selectedCardIds)
      this.$store.dispatch('multipleCardsSelectedIds', selectedCardIds)
    }

    // selectConnectionPaths (point, shouldToggle) {
    //   const zoom = this.spaceCounterZoomDecimal
    //   const paths = document.querySelectorAll('svg .connection-path')
    //   const pointX = (point.x + window.scrollX) * zoom
    //   const pointY = (point.y + window.scrollY) * zoom
    //   paths.forEach(path => {
    //     const pathId = path.dataset.id
    //     const svg = document.querySelector('svg.connections')
    //     let svgPoint = svg.createSVGPoint()
    //     svgPoint.x = pointX
    //     svgPoint.y = pointY
    //     const isSelected = path.isPointInStroke(svgPoint)
    //     if (isSelected) {
    //       if (shouldToggle) {
    //         this.$store.dispatch('toggleMultipleConnectionsSelected', pathId)
    //       } else {
    //         this.$store.dispatch('addToMultipleConnectionsSelected', pathId)
    //       }
    //     }
    //   })
    // },

  }
}
</script>

<style lang="stylus">
.box-selecting
  pointer-events none
  position absolute
  top 0
  left 0
  width 100%
  height 100%
  .box-select
    position absolute
</style>
