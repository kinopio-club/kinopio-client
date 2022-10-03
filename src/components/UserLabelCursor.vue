<template lang="pug">
.user-label(v-if="visible" :data-id="user.id" :style="position")
  .pointer(v-if="isOnscreen")
    svg(width="13px" height="14px" viewBox="0 0 13 14" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink")
      g(stroke="none" stroke-width="1" fill="none" fill-rule="evenodd")
        path(:fill="color" d="M4.3472708,-1.34216658 L10.8472708,10.3578334 C7.96172333,8.79783342 5.79505666,8.01783342 4.3472708,8.01783342 C2.89948494,8.01783342 0.732818273,8.79783342 -2.1527292,10.3578334 L4.3472708,-1.34216658 Z" transform="translate(4.347271, 4.507833) rotate(-42.000000) translate(-4.347271, -4.507833) ")
  .badge(:style="backgroundColor" :class="{'is-off-screen': !isOnscreen}")
    .user-avatar.anon-avatar
    span.user-name(v-if="isOnscreen && userHasName") {{ user.name }}
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
        this.left = cursor.x
        this.top = cursor.y
        this.color = this.user.color
        currentIteration = 0
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
    position () {
      return {
        left: this.left + 'px',
        top: this.top + 'px'
      }
    },
    backgroundColor () {
      return {
        background: this.user.color
      }
    }
  },
  methods: {
    checkIsOnscreen () {
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
  border-radius 3px
  .pointer
    width 15px
    height 15px
  .badge
    margin 0
    margin-left 10px
    margin-top -5px
    &.is-off-screen
      margin 0
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
