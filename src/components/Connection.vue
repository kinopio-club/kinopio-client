<template lang="pug">
path.path(
  fill="none"
  :stroke="typeColor"
  stroke-width="5"
  :data-start-card="startCardId"
  :data-end-card="endCardId"
  :data-id="id"
  :key="id"
  :d="path"
  @click="showConnectionDetails"
  @touchend.stop="showConnectionDetails"
  :class="{active: isSelected || detailsIsVisible, 'filtered-out': isFilteredOut}"
  ref="connection"
)
</template>

<script>
import utils from '@/utils.js'

let animationTimer

export default {
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
      }
      if (mutation.type === 'currentSpace/moveCard') {
        this.cancelAnimation()
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
    id () { return this.connection.id },
    connectionTypeId () { return this.connection.connectionTypeId },
    startCardId () { return this.connection.startCardId },
    endCardId () { return this.connection.endCardId },
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
    connectionType () { return this.$store.getters['currentSpace/connectionTypeById'](this.connectionTypeId) },
    typeColor () {
      if (this.connectionType) {
        return this.connectionType.color
      } else { return undefined }
    },
    isSelected () {
      const selectedIds = this.$store.state.multipleConnectionsSelectedIds
      return selectedIds.includes(this.id)
    },
    detailsIsVisible () {
      const detailsId = this.$store.state.connectionDetailsIsVisibleForConnectionId
      return detailsId === this.id
    },
    shouldAnimate () {
      return Boolean(this.isSelected || this.detailsIsVisible)
    },

    // filters
    filtersIsActive () {
      const types = this.$store.state.filteredConnectionTypeIds
      const frames = this.$store.state.filteredFrameIds
      return Boolean(types.length + frames.length)
    },
    isCardsFilteredByFrames () {
      const frameIds = this.$store.state.filteredFrameIds
      const cards = utils.clone(this.$store.state.currentSpace.cards)
      const startCard = cards.filter(card => card.id === this.startCardId)[0]
      const endCard = cards.filter(card => card.id === this.endCardId)[0]
      const startCardInFilter = frameIds.includes(startCard.frameId)
      const endCardInFilter = frameIds.includes(endCard.frameId)
      return startCardInFilter || endCardInFilter
    },
    isConnectionTypeFiltered () {
      const typeIds = this.$store.state.filteredConnectionTypeIds
      return typeIds.includes(this.connectionType.id)
    },
    isFilteredOut () {
      if (this.filtersIsActive) {
        return this.isCardsFilteredByFrames || this.isConnectionTypeFiltered
      } else { return false }
    }
  },
  methods: {
    showConnectionDetails (event) {
      const detailsPosition = utils.cursorPositionInPage(event)
      this.$store.commit('closeAllDialogs')
      this.$store.commit('connectionDetailsIsVisibleForConnectionId', this.id)
      this.$store.commit('connectionDetailsPosition', detailsPosition)
      this.$store.commit('clearMultipleSelected')
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
    }
  },
  watch: {
    shouldAnimate (shouldAnimate) {
      if (shouldAnimate) {
        animationTimer = window.requestAnimationFrame(this.animationFrame)
      }
    }
  }

}
</script>

<style lang="stylus">
.path
  &:hover,
  &.active
    stroke-width: 7
</style>
