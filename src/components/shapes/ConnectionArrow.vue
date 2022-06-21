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
  // beforeUnmount () {
  // },
  data () {
    return {
      offset: {
        width: 0,
        height: 0
      },
      draggingPath: undefined
    }
  },
  computed: {
    isVisible () { return this.connection.directionIsLeft || this.connection.directionIsRight },
    position () {
      if (!this.isVisible) { return }
      this.updateOffset()
      const path = this.draggingPath || this.connection.path
      let point = utils.pointOnCurve(0.5, path)
      const anglePoint = utils.pointOnCurve(0.45, path)
      const angle = utils.angleBetweenTwoPoints(point, anglePoint)
      console.log('point', point)
      let position = {
        x: point.x - this.offset.width,
        y: point.y - this.offset.height
      }
      console.log('position', position)
      position = {
        left: position.x + 'px',
        top: position.y + 'px',
        transform: `rotate(${angle}deg)`
      }
      if (this.connection.directionIsRight) {
        position.transform = position.transform + ' scaleX(-1)'
      }
      console.log('❤️', position, this.offset)
      return position
    },
    color () {
      const connectionType = this.$store.getters['currentConnections/typeByConnection'](this.connection)
      return connectionType.color
    }
  },
  methods: {
    updateOffset () {
      if (!this.isVisible) { return }
      const element = this.$refs.arrow
      if (!element) { return }
      const rect = element.getBoundingClientRect()
      this.offset = {
        width: Math.round(rect.width / 2),
        height: Math.round(rect.height / 2)
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
  background cyan // temp
  pointer-events all // temp?
</style>
