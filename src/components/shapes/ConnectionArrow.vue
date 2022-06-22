<template lang="pug">
svg.connection-arrow(
  v-if="isVisible"
  :style="position"
  ref="arrow"
  @mouseover.left="hover = true"
  @mouseleave.left="hover = false"
  @click.left="showConnectionDetails"
  @touchend.stop="showConnectionDetails"
  @touchstart="checkIsMultiTouch"
  width="13"
  height="20"
  viewBox="0 0 16 26"
)
  g(stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round")
    g(transform="translate(3 3)" :stroke="color" stroke-width="5")
      path(d="m7 0-7 7")
      path(d="m7 7-7 7" transform="matrix(1 0 0 -1 0 21)")
</template>

<script>
import utils from '@/utils.js'

let isMultiTouch

export default {
  name: 'ConnectionArrow',
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
        const { connections, shouldUpdateAll } = mutation.payload
        let shouldUpdate = false
        if (shouldUpdateAll) {
          shouldUpdate = true
        } else if (connections) {
          shouldUpdate = Boolean(connections.find(connection => connection.id === this.connection.id))
        }
        if (!shouldUpdate) { return }
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
    isVisible () { return this.connection.directionIsVisible },
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
        this.updateRectMiddle()
        const path = this.draggingPath || this.connection.path
        let point = this.closestPointToRectMiddle(path)
        const relativePosition = this.relativePosition(point, path)
        const angle = this.angle(point, path, relativePosition)
        const arrowRectOffset = this.arrowRectOffset(angle)
        let position = this.positionWithArrowRectOffset(point, relativePosition, arrowRectOffset)
        position = {
          left: position.x + 'px',
          top: position.y + 'px',
          transform: `rotate(${angle}deg) scaleX(-1)`
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
    relativePosition (point, path) {
      // relative position between start and end points
      //
      //     TOP           │
      //     L             │     R
      //     Less X        │     More X
      //     Less Y        │     Less Y
      //                   │
      // ──────────────────┼───────────────────
      //                   │
      //     BOTTOM        │
      //     Less X        │     More X
      //     More Y        │     More Y
      //                   │

      let element = document.querySelector(`article [data-card-id="${this.connection.startCardId}"]`)
      let start = element.getBoundingClientRect()
      element = document.querySelector(`article [data-card-id="${this.connection.endCardId}"]`)
      let end = element.getBoundingClientRect()
      start = {
        x: start.x + start.width,
        y: start.y + start.height
      }
      end = {
        x: end.x + end.width,
        y: end.y + end.height
      }
      let x = 'less'
      if (end.x > start.x) {
        x = 'more'
      }
      let y = 'less'
      if (end.y > start.y) {
        y = 'more'
      }
      return { x, y }
    },
    angle (point, path, relativePosition) {
      let anglePercent = point.percent - 0.05
      let anglePoint = utils.pointOnCurve(anglePercent, path)
      let angle = utils.angleBetweenTwoPoints(point, anglePoint)
      const { x, y } = relativePosition
      const isTopLeft = x === 'less' && y === 'less'
      const isTopRight = x === 'more' && y === 'less'
      const isBottomLeft = x === 'less' && y === 'more'
      if (isTopLeft) {
        angle = angle - 180
      } else if (isTopRight) {
        angle = -angle
      } else if (isBottomLeft) {
        angle = 180 - angle
      }
      return angle
    },
    positionWithArrowRectOffset (point, relativePosition, arrowRectOffset) {
      const { x, y } = relativePosition
      const isTopLeft = x === 'less' && y === 'less'
      // const isTopRight = x === 'more' && y === 'less'
      // const isBottomRight = x === 'more' && y === 'more'
      const isBottomLeft = x === 'less' && y === 'more'
      let position = {
        x: point.x - arrowRectOffset.width,
        y: point.y - arrowRectOffset.height
      }
      if (isTopLeft) {
        position = {
          x: position.x,
          y: position.y - arrowRectOffset.height
        }
      // } else if (isTopRight) {
      // } else if (isBottomRight) {
      } else if (isBottomLeft) {
        position = {
          x: position.x,
          y: position.y - arrowRectOffset.height
        }
      }
      return position
    },
    arrowRectOffset (angle) {
      if (!this.isVisible) { return }
      const element = this.$refs.arrow
      if (!element) { return }
      const rect = element.getBoundingClientRect()
      return {
        width: Math.round(rect.width / 4),
        height: Math.round(rect.height / 4)
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
