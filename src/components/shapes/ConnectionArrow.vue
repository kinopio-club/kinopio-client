<template lang="pug">
svg.connection-arrow(
  v-if="isVisible"
  :style="position"
  height="26"
  viewBox="0 0 16 26"
  width="16"
  ref="arrow"
  @mouseover.left="hover = true"
  @mouseleave.left="hover = false"
  @click.left="showConnectionDetails"
  @touchend.stop="showConnectionDetails"
  @touchstart="checkIsMultiTouch"
)
  g(stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round")
    g(transform="translate(3 3)" :stroke="color" stroke-width="5")
      path(d="m10 0-10 10")
      path(d="m10 10-10 10" transform="matrix(1 0 0 -1 0 30)")
</template>

<script>
import utils from '@/utils.js'

let isMultiTouch

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
          this.setPosition()
        }
      } else if (mutation.type === 'triggerUpdateConnectionArrowPositions') {
        this.$nextTick(() => {
          this.setPosition()
        })
      }
    })
  },
  mounted () {
    this.setPosition()
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
      draggingPath: undefined,
      hover: false,
      position: {}
    }
  },
  computed: {
    isVisible () { return this.directionIsLeft || this.directionIsRight },
    directionIsLeft () { return this.connection.directionIsLeft },
    directionIsRight () { return this.connection.directionIsRight },
    path () { return this.connection.path },
    color () {
      const connectionType = this.$store.getters['currentConnections/typeByConnection'](this.connection)
      return connectionType.color
    }
  },
  methods: {
    setPosition () {
      if (!this.isVisible) { return }
      this.$nextTick(() => {
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
        if (this.directionIsRight) {
          position.transform = position.transform + ' scaleX(-1)'
        }
        this.position = position
      })
    },

    checkIsMultiTouch (event) {
      isMultiTouch = false
      if (utils.isMultiTouch(event)) {
        isMultiTouch = true
      }
    },
    showConnectionDetails (event) {
      if (isMultiTouch) { return }
      this.$store.commit('triggerShowConnectionDetails', {
        connectionId: this.connection.id,
        event
      })
    },
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
    directionIsLeft (value) {
      if (!value) { return }
      this.setPosition()
    },
    directionIsRight (value) {
      if (!value) { return }
      this.setPosition()
    },
    path (value) {
      this.setPosition()
    },
    hover (value) {
      if (value) {
        this.$store.commit('currentUserIsHoveringOverConnectionId', this.connection.id)
      } else {
        this.$store.commit('currentUserIsHoveringOverConnectionId', '')
      }
    }
  }
}
</script>

<style lang="stylus">
.connection-arrow
  position absolute
  pointer-events all
  cursor pointer
</style>
