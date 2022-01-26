<template lang="pug">
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
    userCantEditSpace () { return !this.$store.getters['currentUser/canEditSpace']() }
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
</style>
