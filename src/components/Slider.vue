<template lang="pug">
.slider(
  @mousedown.left.stop.prevent="startMovePlayhead"
  @touchstart.stop.prevent="startMovePlayhead"

  @mousemove.prevent="dragPlayhead"
  @touchmove.prevent="dragPlayhead"

  @mouseup.left="endMovePlayhead"
  @touchend="endMovePlayhead"
  :class="{'is-dragging': playheadIsBeingDragged, 'jiggle-right': animateJiggleRight, 'jiggle-left': animateJiggleLeft}"
  @animationend="removeAnimations"
)
  span.badge.info.zoom-percent-badge(
    ref="badge"
    v-if="zoomPercentBadgeIsVisible"
    :style="{left: zoomPercentBadgePosition + 'px'}"
  )
    span {{ integerValue }}%
    template(v-if="currentValueIsMin && minKeyboardShortcut")
      span &nbsp;({{minKeyboardShortcut}})
    button.inline-button(@mousedown.left.stop @click.left.stop="resetPlayhead")
      img.icon.close(src="@/assets/add.svg")

  progress(
    :value="sliderValue"
    :max="maxValue"
    :min="minValue"
    ref="progress"
  )
  img.vertical-line.first-child(src="@/assets/vertical-line.svg")
  img.vertical-line.second-child(src="@/assets/vertical-line.svg")
  img.vertical-line.last-child(src="@/assets/vertical-line.svg")
  button.slider-button(
    ref="button"
    :style="{left: buttonPosition + 'px'}"
    :class="{'is-dragging': playheadIsBeingDragged, active: playheadIsBeingDragged}"
  )
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'EditableSlider',
  props: {
    minValue: Number,
    maxValue: Number,
    value: Number,
    animateJiggleRight: Boolean,
    animateJiggleLeft: Boolean,
    minKeyboardShortcut: String,
    shouldHideZoomPercentBadge: Boolean
  },
  data () {
    return {
      playheadIsBeingDragged: false,
      buttonPosition: 100
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'spaceZoomPercent') {
        this.$nextTick(() => {
          this.updateButtonPosition()
        })
      }
    })
  },
  mounted () {
    // bind events to window to receive events when mouse is outside window
    window.addEventListener('mousemove', this.dragPlayhead)
    window.addEventListener('mouseup', this.endMovePlayhead)
    window.addEventListener('touchend', this.endMovePlayhead)
    this.updateButtonPosition()
  },
  beforeUnmount () {
    window.removeEventListener('mousemove', this.dragPlayhead)
    window.removeEventListener('mouseup', this.endMovePlayhead)
    window.removeEventListener('touchend', this.endMovePlayhead)
  },
  computed: {
    integerValue () {
      return Math.round(this.value)
    },
    zoomPercentBadgeIsVisible () {
      if (this.shouldHideZoomPercentBadge) { return }
      if (this.value !== this.maxValue) {
        return true
      } else {
        return false
      }
    },
    zoomPercentBadgePosition () {
      const max = 40
      const badgeWidth = 45
      let position = this.buttonPosition - (badgeWidth / 2)
      position = Math.min(position, max)
      return position
    },
    sliderValue () {
      const value = utils.percentageBetween({
        value: this.value,
        min: this.minValue,
        max: this.maxValue
      })
      return value
    },
    currentValueIsMin () {
      return this.integerValue === this.minValue
    }
  },
  methods: {
    resetPlayhead () {
      this.playheadIsBeingDragged = false
      this.$emit('updatePlayhead', this.maxValue)
      this.$emit('resetPlayhead')
      this.$nextTick(() => {
        this.updateButtonPosition()
      })
    },
    movePlayhead (event) {
      const progress = this.$refs.progress
      const rect = progress.getBoundingClientRect()
      const progressStartX = rect.x + window.scrollX
      const progressWidth = rect.width - 2
      const clickX = utils.cursorPositionInViewport(event).x + window.scrollX
      const progressX = clickX - progressStartX
      let percent = (progressX / progressWidth) * 100
      percent = Math.min(percent, 100)
      percent = Math.max(percent, 0)
      this.updateButtonPosition()
      this.$emit('updatePlayhead', percent)
    },
    updateButtonPosition () {
      if (!this.$refs.progress) { return }
      const buttonElement = this.$refs.button
      const buttonWidth = buttonElement.getBoundingClientRect().width + 2
      let position = this.sliderValue - (buttonWidth / 2)
      position = Math.min(position, 86)
      position = Math.max(position, -1)
      this.buttonPosition = position
    },
    dragPlayhead (event) {
      if (!this.playheadIsBeingDragged) { return }
      this.movePlayhead(event)
    },
    startMovePlayhead (event) {
      this.playheadIsBeingDragged = true
      this.movePlayhead(event)
    },
    endMovePlayhead (event) {
      if (!this.playheadIsBeingDragged) { return }
      this.playheadIsBeingDragged = false
      this.movePlayhead(event)
    },
    stopMovingPlayhead () {
      this.playheadIsBeingDragged = false
    },
    removeAnimations () {
      this.$emit('removeAnimations')
    }
  }
}
</script>

<style lang="stylus">
.slider
  height 100%
  width 100px
  padding-bottom 10px
  padding-top 10px
  padding-right 5px
  cursor grab
  position relative
  progress
    background-color var(--secondary-background)
  progress::-webkit-progress-bar
    background-color var(--secondary-background)
  .vertical-line
    position absolute
    top 23px
    z-index -1
    &.first-child
      left 3px
    &.second-child
      left 48px
    &.last-child
      left 91px
  .slider-button
    cursor grab
    position absolute
    left calc(100% - 16px)
    height 16px
    width 10px
    padding 0
    top 12px
  .is-dragging
    cursor grabbing
  .zoom-percent-badge
    display flex
    position absolute
    top -10px
    .inline-button
      cursor pointer
      vertical-align baseline
      margin-left 5px
      padding-top 1px
      padding-left 4px
      padding-right 4px
      .icon
        transform rotate(45deg)

.jiggle-right
  animation jiggle-right 0.3s ease-out forwards
@keyframes jiggle-right
  0%
    transform translateX(0)
  25%
    transform translateX(3px)
  50%
    transform translateX(-3px)
  75%
    transform translateX(2px)
  100%
    transform translateX(0)

.jiggle-left
  animation jiggle-left 0.3s ease-out forwards
@keyframes jiggle-left
  0%
    transform translateX(0)
  25%
    transform translateX(-3px)
  50%
    transform translateX(3px)
  75%
    transform translateX(-2px)
  100%
    transform translateX(0)

.is-dark-theme
  .slider
    .vertical-line
      filter invert(1)

</style>
