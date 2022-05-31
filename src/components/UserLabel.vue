<template lang="pug">
.user-label.badge(v-if="visible" :data-id="user.id" :style="{ background: color, left: left + 'px', top: top + 'px' }")
  .user-avatar.anon-avatar
  span.user-name(v-if="isOnscreen && userHasName") {{ user.name }}
</template>

<script>
import utils from '@/utils.js'

const maxIterations = 200 // 👀 MagicPaint maxIterations
let visibleTimer, currentIteration

export default {
  name: 'UserLabel',
  props: {
    user: Object,
    scale: Number
  },
  mounted () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerUpdateRemoteUserCursor') {
        const cursor = mutation.payload
        if (cursor.userId !== this.user.id) { return }
        this.left = cursor.x + 10
        this.top = cursor.y - 10
        this.color = this.user.color
        currentIteration = 0
        this.updatePositionWithZoom(cursor)
        this.userLabelVisibleTimer()
        this.checkIsOnscreen()
        this.offscreenLabelPosition()
      }
    })
  },
  data () {
    return {
      left: 0,
      top: 0,
      color: '',
      visible: false,
      isOnscreen: true,
      isOffscreenX: false,
      isOffscreenY: false
    }
  },
  computed: {
    userHasName () { return Boolean(this.user.name) },
    minimapIsVisible () { return this.$store.state.minimapIsVisible }
  },
  methods: {
    updatePositionWithZoom (cursor) {
      let scale = 1
      if (this.scale) {
        scale = this.scale
      } else {
        const counterZoom = 1 / cursor.zoom
        scale = counterZoom
      }
      this.left = this.left * scale
      this.top = this.top * scale
    },
    checkIsOnscreen () {
      if (this.minimapIsVisible) { return }
      const isBetweenX = utils.isBetween({
        value: this.left,
        min: window.scrollX,
        max: window.scrollX + this.$store.state.viewportWidth
      })
      const isBetweenY = utils.isBetween({
        value: this.top,
        min: window.scrollY,
        max: window.scrollY + this.$store.state.viewportHeight
      })
      this.isOffscreenX = !isBetweenX
      this.isOffscreenY = !isBetweenY
      this.isOnscreen = isBetweenX && isBetweenY
    },
    userLabelVisibleTimer () {
      this.visible = true
      if (!visibleTimer) {
        currentIteration = 0
        visibleTimer = window.requestAnimationFrame(this.userLabelVisibleFrame)
      }
    },
    userLabelVisibleFrame () {
      currentIteration++
      if (currentIteration < maxIterations) {
        window.requestAnimationFrame(this.userLabelVisibleFrame)
      } else {
        setTimeout(() => {
          window.cancelAnimationFrame(visibleTimer)
          visibleTimer = undefined
          this.visible = false
        }, 0)
      }
    },
    offscreenLabelPosition () {
      if (this.isOnscreen) { return }
      const minX = window.scrollX
      const maxX = window.scrollX + this.$store.state.viewportWidth
      const minY = window.scrollY
      const maxY = window.scrollY + this.$store.state.viewportHeight
      if (this.isOffscreenX && this.left < minX) {
        this.left = minX - 4
      }
      if (this.isOffscreenX && this.left > maxX) {
        this.left = maxX - 22
      }
      if (this.isOffscreenY && this.top < minY) {
        this.top = minY - 2
      }
      if (this.isOffscreenY && this.top > maxY) {
        this.top = maxY - 16
      }
    }
  }
}
</script>

<style lang="stylus">
.user-label
  pointer-events none
  position absolute
  z-index calc(var(--max-z) - 50)
  display inline-block
  .anon-avatar
    width 15px
    height 15px
    display inline-block
    background-repeat no-repeat
    background-position center
    vertical-align middle
  .user-name
    margin-left 6px
</style>
