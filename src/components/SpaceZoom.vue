<template lang="pug">
.space-zoom
  //-TODO?? doubleclick to Reset to 100
  .progress-wrap(
    @mousedown.left.stop.prevent="startMovePlayhead"
    @touchstart.stop.prevent="startMovePlayhead"

    @mousemove.prevent="dragPlayhead"
    @touchmove.prevent="dragPlayhead"

    @mouseup.left="endMovePlayhead"
    @touchend="endMovePlayhead"
    :class="{'is-dragging': playheadIsBeingDragged}"
  )
    progress(
      :value="sliderPercent"
      max="100"
      min="20"
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

  //- .row
    //- span.badge(:class="{info: isPlaying, status: !isPlaying}" :style="{background: selectedColor}")
    //-   img.icon(v-if="!isPlaying" src="@/assets/autoplay.svg")
    //-   Loader(:visible="isPlaying")
    //-   span {{currentTime}}/{{totalTime}}
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'SpaceZoom',
  props: {
  },
  data () {
    return {
      sliderPercent: 100,
      playheadIsBeingDragged: false,
      buttonPosition: 100
    }
  },
  mounted () {
    // bind events to window to receive events when mouse is outside window
    window.addEventListener('mousemove', this.dragPlayhead)
    window.addEventListener('mouseup', this.endMovePlayhead)
    this.updateButtonPosition()
  },
  methods: {
    movePlayhead (event) {
      const progress = this.$refs.progress
      const rect = progress.getBoundingClientRect()
      const progressStartX = rect.x + window.scrollX
      const progressWidth = rect.width - 2
      const clickX = utils.cursorPositionInViewport(event).x + window.scrollX
      const progressX = clickX - progressStartX
      this.sliderPercent = (progressX / progressWidth) * 100
      this.sliderPercent = Math.min(this.sliderPercent, 100)
      this.sliderPercent = Math.max(this.sliderPercent, 0)
      this.updateSpaceZoomPercent()
      this.updateButtonPosition()
    },
    updateSpaceZoomPercent () {
      const min = 20
      const max = 100
      let spaceZoomPercent = this.sliderPercent
      spaceZoomPercent = spaceZoomPercent / 100
      spaceZoomPercent = Math.round(min + (max - min) * spaceZoomPercent)
      this.$store.commit('spaceZoomPercent', spaceZoomPercent)
      console.log('🐌', this.$store.state.spaceZoomPercent)
    },
    updateButtonPosition () {
      if (!this.$refs.progress) { return }
      const sliderElement = this.$refs.progress
      const buttonElement = this.$refs.button
      const sliderWidth = sliderElement.getBoundingClientRect().width
      const buttonWidth = buttonElement.getBoundingClientRect().width + 2
      const percent = this.sliderPercent / 100
      let position = (sliderWidth * percent) - (buttonWidth / 2)
      position = Math.min(position, 86)
      position = Math.max(position, -1)
      this.buttonPosition = position
    },
    dragPlayhead (event) {
      if (!this.playheadIsBeingDragged) { return }
      this.movePlayhead(event)
    },
    // startMovePlayheadOrReset (event) {
    //   this.startMovePlayhead(event)
    // },
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
    }
  }
}
</script>

<style lang="stylus">
.space-zoom
  display block
  width 100px
  .progress-wrap
    height 100%
    width 100%
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
  .badge
    &.status
      background var(--secondary-active-background)
</style>
