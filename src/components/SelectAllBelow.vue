<template lang="pug">
.select-all-below(v-if="isVisible" :style="{ top: positionY + 'px' }" @click="selectAllBelow")
  .badge.label-badge(:style="{ 'background-color': userColor }")
    img.icon(src="@/assets/brush-y.svg")
    .pointer(:style="{ 'background-color': userColor }")
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'SelectAllBelow',
  mounted () {
    window.addEventListener('mousemove', this.initInteractions)
  },
  beforeUnmount () {
    window.removeEventListener('mousemove', this.initInteractions)
  },
  data () {
    return {
      isVisible: false,
      positionY: 250
    }
  },
  computed: {
    userColor () { return this.$store.state.currentUser.color },
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() }
  },
  methods: {
    initInteractions (event) {
      if (!this.canEditSpace) { return }
      const edgeThreshold = 45
      const header = 60
      const footer = 40
      const position = utils.cursorPositionInViewport(event)
      const viewport = utils.visualViewport()
      const isInThreshold = position.x <= edgeThreshold
      const isBetweenControls = utils.isBetween({
        value: position.y,
        min: header,
        max: viewport.height - footer
      })
      if (isInThreshold && isBetweenControls) {
        this.positionY = position.y
        this.isVisible = true
      } else {
        this.isVisible = false
      }
    },
    selectAllBelow (event) {
      let position = utils.cursorPositionInPage(event)
      position = {
        x: position.x * this.spaceCounterZoomDecimal,
        y: position.y * this.spaceCounterZoomDecimal
      }
      this.$store.commit('triggerSelectAllCardsBelowCursor', position)
      this.$store.commit('multipleSelectedActionsIsVisible', false)
    }
  }
}
</script>

<style lang="stylus">
.select-all-below
  position fixed
  left 0
  top 250px
  pointer-events all
  cursor pointer
  .badge
    border-radius 0
    border-top-right-radius 6px
    border-bottom-right-radius 6px
    padding 0
    margin 0
    position relative
    box-shadow 0
    margin-bottom 8px
    &:hover
      box-shadow var(--button-hover-shadow)
    &:active
      box-shadow var(--button-active-inset-shadow)

  img
    padding 3px
    margin-left 6px
    margin-right 8px

  .pointer
    position absolute
    background-color var(--primary)
    height 1px
    width 12px
    right -12px
    top 10px
</style>
