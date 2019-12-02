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
  :class="{active: isSelected || detailsIsVisible}"
  ref="connection"
)
</template>

<script>
import utils from '@/utils.js'

let animationTimer
let frameCount = 0

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
      curvedPath: ''
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

    // isEvenNumber (number) { // in utils.isEvenNumber
    //   if (number % 2 === 0) {
    //     return true
    //   }
    // },

    ///    // pointDelta () {
    //   const framesPerDirection = 60 // 60fps
    //   const completedCycles = Math.floor(frameCount / framesPerDirection)
    //   const pointPattern = new RegExp(/([0-9]+)\w+/g) // "90" and "40" from "q90,40"
    //   const point = this.controlPoint.match(pointPattern)
    //   if (this.isEvenNumber(completedCycles)) {
    //     // return + object x,y
    //     return {
    //       x: point[0] + 1,
    //       y: point[1] + 1
    //     }
    //   } else {
    //     // return - object x,y
    //     return {
    //       x: point[0] - 1,
    //       y: point[1] - 1
    //     }
    //   }

    // },

    controlPointPosition (point) {
      const framesPerDirection = 60
      const completedCycles = Math.floor(frameCount / framesPerDirection)

      // this.controlCurve

      // console.log('🌸', parseInt(point), parseInt(point) + 1)
      if (utils.isEvenNumber(completedCycles)) {
        return parseInt(point) + 1
      } else {
        return parseInt(point) - 1
      }
    },
    animationFrame () {
      frameCount++
      this.curvedPath = this.path
      const curvePattern = new RegExp(/(q[0-9]+,)\w+/) // "q90,40" from "m747,148 q90,40 -85,75"
      const pointPattern = new RegExp(/([0-9]+)\w+/g) // "90" and "40" from "q90,40"
      const curveMatch = this.curvedPath.match(curvePattern)
      const pointMatch = curveMatch[0].match(pointPattern)
      this.controlCurve = {
        controlPoint: curveMatch[0], // q90, 40
        x: this.controlPointPosition(pointMatch[0]),
        y: this.controlPointPosition(pointMatch[1]),
        index: curveMatch.index,
        length: curveMatch[0].length
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
      frameCount = 0
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
