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
        const start = this.currentUserBoxSelectStart
        const end = this.currentUserBoxSelectEnd
        this.selectCards(start, end)
        // this.selectConnectionPaths(start, end)
      }
    })
  },
  // on mouse up/currentbox select end if selections = open multi actions
  computed: {
    currentUserIsBoxSelecting () { return this.$store.state.currentUserIsBoxSelecting },
    currentUserBoxSelectStart () { return this.$store.state.currentUserBoxSelectStart },
    currentUserBoxSelectEnd () { return this.$store.state.currentUserBoxSelectEnd },
    userCantEditSpace () { return !this.$store.getters['currentUser/canEditSpace']() },
    currentUserStyles () {
      const x = {
        left: this.currentUserBoxSelectStart.x + 'px',
        top: this.currentUserBoxSelectStart.y + 'px',
        width: Math.abs(this.currentUserBoxSelectStart.x - this.currentUserBoxSelectEnd.x) + 'px',
        height: Math.abs(this.currentUserBoxSelectStart.y - this.currentUserBoxSelectEnd.y) + 'px',
        backgroundColor: this.$store.state.currentUser.color
      }
      console.log(x)
      return x
    }
  },
  methods: {
    selectCards (start, end) {
      // const cardMap = this.$store.state.currentCards.cardMap

      console.log(start, end)
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
