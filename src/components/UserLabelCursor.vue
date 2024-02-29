<template lang="pug">
.user-label.user-label-cursor(v-if="visible" :data-id="user.id" :style="position")
  .pointer(v-if="isOnscreen")
    svg(width="13px" height="14px" viewBox="0 0 13 14" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink")
      g(stroke="none" stroke-width="1" fill="none" fill-rule="evenodd")
        path(:fill="color" d="M4.3472708,-1.34216658 L10.8472708,10.3578334 C7.96172333,8.79783342 5.79505666,8.01783342 4.3472708,8.01783342 C2.89948494,8.01783342 0.732818273,8.79783342 -2.1527292,10.3578334 L4.3472708,-1.34216658 Z" transform="translate(4.347271, 4.507833) rotate(-42.000000) translate(-4.347271, -4.507833) ")
  .badge(:style="backgroundColor" :class="{'is-off-screen': !isOnscreen}")
    .user-avatar
      img.anon-avatar(src="@/assets/anon-avatar.svg" :class="{ 'is-dark': colorIsDark }")
    span.user-name(v-if="isOnscreen && userHasName" :class="{ 'is-dark': colorIsDark }") {{ user.name }}
</template>

<script>
import utils from '@/utils.js'

const maxIterations = 200 // 👀 MagicPaint maxIterations
let visibleTimer, currentIteration

export default {
  name: 'UserLabelCursor',
  props: {
    user: Object,
    scale: Number
  },
  mounted () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerUpdateRemoteUserCursor') {
        const cursor = mutation.payload
        if (cursor.userId !== this.user.id) { return }
        this.x = cursor.x
        this.y = cursor.y
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
      x: 0,
      y: 0,
      color: '',
      visible: false,
      isOnscreen: true,
      isOffscreenX: false,
      isOffscreenY: false
    }
  },
  computed: {
    userHasName () { return Boolean(this.user.name) },
    position () {
      return {
        left: this.x + 'px',
        top: this.y + 'px'
      }
    },
    backgroundColor () {
      return {
        background: this.user.color
      }
    },
    colorIsDark () { return utils.colorIsDark(this.user.color) },
    scroll () { return this.$store.getters.windowScrollWithSpaceOffset() }
  },
  methods: {
    updatePositionWithZoom (cursor) {
      let scale = 1
      if (this.scale) {
        scale = this.scale
      } else {
        scale = 1
      }
      this.x = this.x * scale
      this.y = this.y * scale
    },
    checkIsOnscreen () {
      const zoom = this.$store.getters.spaceCounterZoomDecimal
      const viewportWidth = this.$store.state.viewportWidth * zoom
      const viewportHeight = this.$store.state.viewportHeight * zoom
      const isBetweenX = utils.isBetween({
        value: this.x,
        min: this.scroll.x,
        max: this.scroll.x + viewportWidth
      })
      const isBetweenY = utils.isBetween({
        value: this.y,
        min: this.scroll.y,
        max: this.scroll.y + viewportHeight
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
      const minX = this.scroll.x
      const maxX = this.scroll.x + this.$store.state.viewportWidth
      const minY = this.scroll.y
      const maxY = this.scroll.y + this.$store.state.viewportHeight
      if (this.isOffscreenX && this.x < minX) {
        this.x = minX - 4
      }
      if (this.isOffscreenX && this.x > maxX) {
        this.x = maxX - 22
      }
      if (this.isOffscreenY && this.y < minY) {
        this.y = minY - 2
      }
      if (this.isOffscreenY && this.y > maxY) {
        this.y = maxY - 16
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
  border-radius var(--small-entity-radius)
  .pointer
    width 15px
    height 15px
  .badge
    margin 0
    margin-left 10px
    margin-top -5px
    &.is-off-screen
      margin 0
  .user-avatar
    width 12px
    display inline-block
  .anon-avatar
    left 4px
    top 7px
    width 14px
  .user-name
    margin-left 6px
    &.is-dark
      filter invert(1)
</style>
