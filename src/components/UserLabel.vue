<template lang="pug">
.user-label.badge(v-if="visible" :data-id="user.id" :style="{ background: color, left, top }")
  .user-avatar.anon-avatar
  span {{ user.name }}
</template>

<script>
const maxIterations = 180 // 👀 MagicPaint maxIterations
let visibleTimer, currentIteration

export default {
  name: 'UserLabel',
  props: {
    user: Object
  },
  mounted () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerAddRemotePaintingCircle') {
        const circle = mutation.payload
        if (circle.userId === this.user.id) {
          this.left = (circle.x - 5) + 'px'
          this.top = (circle.y - 10) + 'px'
          this.color = circle.color
          this.userLabelVisibleTimer()
        }
      }
    })
  },
  data () {
    return {
      left: 0,
      top: 0,
      color: '',
      visible: false
    }
  },
  methods: {
    userLabelVisibleTimer () {
      if (!visibleTimer) {
        this.visible = true
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
    }

  }
}
</script>

<style lang="stylus">
.user-label
  pointer-events none
  position absolute
  .anon-avatar
    width 15px
    height 15px
    display inline-block
    background-repeat no-repeat
    background-position center
    vertical-align middle
    margin-right 6px
</style>
