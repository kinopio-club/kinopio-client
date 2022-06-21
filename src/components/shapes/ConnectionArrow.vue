<template lang="pug">
svg.connection-arrow(v-if="isVisible" :style="position" height="26" viewBox="0 0 16 26" width="16" ref="arrow")
  g(stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round")
    g(transform="translate(3 3)" :stroke="color" stroke-width="5")
      path(d="m10 0-10 10")
      path(d="m10 10-10 10" transform="matrix(1 0 0 -1 0 30)")
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'ConnectionArrowLeft',
  components: {
  },
  props: {
    connection: Object
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerUpdateConnectionPathWhileDragging') {
        if (mutation.payload.connectionId === this.connection.id) {
          this.draggingPath = mutation.payload.path
        }
      }
    })
  },
  mounted () {
    this.updateOffset()
  },
  data () {
    return {
      offset: {
        width: 0,
        height: 0
      },
      rectMiddle: {
        x: 0,
        y: 0
      },
      draggingPath: undefined
    }
  },
  computed: {
    isVisible () { return this.connection.directionIsLeft || this.connection.directionIsRight },
    position () {
      if (!this.isVisible) { return }
      this.updateOffset()
      this.updateRectMiddle()
      const path = this.draggingPath || this.connection.path
      let point = this.closestPointToRectMiddle(path)

      let anglePercent = point.percent - 0.05
      let anglePoint = utils.pointOnCurve(anglePercent, path)
      let angle = utils.angleBetweenTwoPoints(point, anglePoint)
      if (this.shouldReverseAngle()) {
        angle = -angle
      }
      let position = {
        x: point.x - this.offset.width,
        y: point.y - this.offset.height
      }
      const strokeWidth = 5
      position = {
        x: position.x + strokeWidth + 2,
        y: position.y + strokeWidth / 2
      }
      position = {
        left: position.x + 'px',
        top: position.y + 'px',
        transform: `rotate(${angle}deg)`
      }
      if (this.connection.directionIsRight) {
        position.transform = position.transform + ' scaleX(-1)'
      }
      return position
    },
    color () {
      const connectionType = this.$store.getters['currentConnections/typeByConnection'](this.connection)
      return connectionType.color
    }
  },
  methods: {
    closestPointToRectMiddle (path) {
      let percent // 0 to 1
      let point
      let distance
      const pointPercents = [0.4, 0.5, 0.6, 0.7, 0.8]
      pointPercents.forEach((currentPercent, index) => {
        if (index === 0) {
          percent = currentPercent
          point = utils.pointOnCurve(currentPercent, path)
          distance = utils.distanceBetweenTwoPoints(this.rectMiddle, point)
        } else {
          const currentPoint = utils.pointOnCurve(currentPercent, path)
          const currentDistance = utils.distanceBetweenTwoPoints(this.rectMiddle, currentPoint)
          if (currentDistance > distance) { return }
          percent = currentPercent
          point = currentPoint
          distance = currentDistance
        }
      })
      return {
        x: point.x,
        y: point.y,
        percent
      }
    },
    shouldReverseAngle () {
      let element = document.querySelector(`article [data-card-id="${this.connection.startCardId}"]`)
      if (!element) { return }
      const start = element.getBoundingClientRect()
      element = document.querySelector(`article [data-card-id="${this.connection.endCardId}"]`)
      const end = element.getBoundingClientRect()
      const endIsLeftOf = end.x < start.x
      const endIsAbove = end.y < start.y
      const endIsAboveAndLeftOf = endIsLeftOf && endIsAbove
      if (endIsAboveAndLeftOf) { return false }
      return endIsLeftOf || endIsAbove
    },
    updateOffset () {
      if (!this.isVisible) { return }
      const element = this.$refs.arrow
      if (!element) { return }
      const rect = element.getBoundingClientRect()
      this.offset = {
        width: Math.round(rect.width / 2),
        height: Math.round(rect.height / 2)
      }
    },
    updateRectMiddle () {
      if (!this.isVisible) { return }
      const element = document.querySelector(`svg .connection-path[data-id='${this.connection.id}']`)
      if (!element) { return }
      const rect = element.getBoundingClientRect()
      this.rectMiddle = {
        x: Math.round(rect.x + (rect.width / 2)),
        y: Math.round(rect.y + (rect.height / 2))
      }
    }
  },
  watch: {
    isVisible (value) {
      this.updateOffset()
    }
  }
}
</script>

<style lang="stylus">
.connection-arrow
  position absolute
  pointer-events all // temp?
</style>
