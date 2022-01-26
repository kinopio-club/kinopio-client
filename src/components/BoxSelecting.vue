<template lang="pug">
.box-selecting
  .box-select(v-if="currentUserIsBoxSelecting" :style="currentUserStyles")
</template>

<script>

export default {
  name: 'BoxSelecting',
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'currentUserBoxSelectEnd') {
        this.selectCards()
      }
    })
  },
  // TODO on mouse up/currentbox select end if selections = open multi actions
  computed: {
    currentUserIsBoxSelecting () { return this.$store.state.currentUserIsBoxSelecting },
    start () { return this.$store.state.currentUserBoxSelectStart },
    end () { return this.$store.state.currentUserBoxSelectEnd },
    userCantEditSpace () { return !this.$store.getters['currentUser/canEditSpace']() },
    currentUserStyles () {
      const { start, end } = this.orderedPoints(this.start, this.end)
      console.log('🍅', start, end)
      const styles = {
        left: start.x + 'px',
        top: start.y + 'px',
        width: Math.abs(start.x - end.x) + 'px',
        height: Math.abs(start.y - end.y) + 'px',
        backgroundColor: this.$store.state.currentUser.color
      }
      // console.log(styles)
      return styles
    }
  },
  methods: {
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
      let relativePosition
      if (end.x <= start.x && end.y <= start.y) {
        relativePosition = 'topLeft'
      } else if (end.x >= start.x && end.y <= start.y) {
        relativePosition = 'topRight'
      } else if (end.x <= start.x && end.y >= start.y) {
        relativePosition = 'bottomleft'
      }
      let newStart, newEnd
      if (relativePosition === 'topLeft') {
        newStart = end
        newEnd = start
      } else if (relativePosition === 'topRight') {
        newStart = { x: start.x, y: end.y }
        newEnd = { x: end.x, y: start.y }
      } else if (relativePosition === 'bottomleft') {
        newStart = { x: end.x, y: start.y }
        newEnd = { x: start.x, y: end.y }
      } else {
        newStart = start
        newEnd = end
      }
      return { start: newStart, end: newEnd }
    },
    selectCards () {
      // const { start, end } = this.orderedPoints(this.start, this.end)

      // const cardMap = this.$store.state.currentCards.cardMap
    }
    // selectCards (point, shouldToggle) {
    //   if (this.userCantEditSpace) { return }
    //   const cardMap = this.$store.state.currentCards.cardMap

    // cardMap.forEach(card => {
    //   const cardX = card.x
    //   const cardY = card.y
    //   const pointX = (point.x + window.scrollX) * zoom
    //   const pointY = (point.y + window.scrollY) * zoom
    //   const x = {
    //     value: pointX,
    //     min: cardX - circleSelectionRadius,
    //     max: cardX + card.width + circleSelectionRadius
    //   }
    //   const y = {
    //     value: pointY,
    //     min: cardY - circleSelectionRadius,
    //     max: cardY + card.height + circleSelectionRadius
    //   }
    //   const isBetweenX = utils.isBetween(x)
    //   const isBetweenY = utils.isBetween(y)
    //   if (isBetweenX && isBetweenY) {
    //     if (shouldToggle) {
    //       this.$store.dispatch('toggleCardSelected', card.id)
    //     } else {
    //       this.$store.dispatch('addToMultipleCardsSelected', card.id)
    //     }
    //   }
    // })
    // },

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
