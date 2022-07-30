<template lang="pug">
.box(:key="box.id" :style="styles" :class="{hover: isHover, active: isDragging, 'box-jiggle': isDragging, resize: isResizing}")
  .box-info(
    @mouseover="toggleIsHover(true)"
    @mouseleave="toggleIsHover(false)"
    @mousedown="toggleIsDragging(true)"
    :style="labelStyles"
    :class="{unselectable: isPainting}"

    @mouseup.left="showBoxDetails"
    @keyup.stop.enter="showBoxDetails"
  )
    //- @touchstart="startLocking"
    //- @touchmove="updateCurrentTouchPosition"
    //- @touchend="showCardDetailsTouch"

    //- name
    span {{box.name}}
  //- resize
  .bottom-button-wrap(:class="{unselectable: isPainting}")
    .resize-button-wrap.inline-button-wrap
      //- @mousedown.left.stop="startResizing"
      //- @touchstart.stop="startResizing"
      button.inline-button.resize-button(
        tabindex="-1"
        :style="{background: color}"
        @mouseover="toggleIsHover(true)"
        @mouseleave="toggleIsHover(false)"
      )
        img.resize-icon.icon(src="@/assets/resize.svg")

</template>

<script>
const borderWidth = 2

export default {
  name: 'Box',
  mounted () {
    window.addEventListener('mouseup', this.clearIsDragging)
  },
  beforeUnmount () {
    window.removeEventListener('mouseup', this.clearIsDragging)
  },
  props: {
    box: Object
  },
  data () {
    return {
      isHover: false,
      isDragging: false,
      isResizing: false
    }
  },
  computed: {
    styles () {
      const { x, y, width, height, color } = this.box
      return {
        left: x + 'px',
        top: y + 'px',
        width: width + 'px',
        height: height + 'px',
        border: `${borderWidth}px solid ${color}`
      }
    },
    color () { return this.box.color },
    labelStyles () {
      return {
        backgroundColor: this.color
      }
    },
    isPainting () { return this.$store.state.currentUserIsPainting }
    // canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
  },
  methods: {
    clearIsDragging () {
      this.isDragging = false
    },
    toggleIsDragging (value) {
      this.isDragging = value
    },
    toggleIsHover (value) {
      if (this.isPainting) { return }
      this.isHover = value
    },
    // clearBoxInteractions () {}
    showBoxDetails (event) {
      // this.$store.dispatch('currentBoxes/afterMove')
      if (this.$store.state.currentUserIsPainting) { return }
      // if (isMultiTouch) { return }
      if (this.$store.state.currentUserIsPanningReady || this.$store.state.currentUserIsPanning) { return }
      this.clearIsDragging()
      // if (!this.canEditCard) { this.$store.commit('triggerReadOnlyJiggle') } // caneditspace?
      // const userId = this.$store.state.currentUser.id
      // const cardsWereDragged = this.$store.state.cardsWereDragged // boxesWereDragged

      // this.$store.commit('broadcast/updateStore', { updates: { userId }, type: 'clearRemoteCardsDragging' })
      // this.preventDraggedButtonBadgeFromShowingDetails = this.$store.state.preventDraggedCardFromShowingDetails
      // if (this.$store.state.preventDraggedCardFromShowingDetails) { return }

      this.$store.dispatch('closeAllDialogs', 'Box.showBoxDetails')
      this.$store.dispatch('clearMultipleSelected')

      this.$store.commit('boxDetailsIsVisibleForBoxId', this.box.id)
      // this.$store.commit('preventCardDetailsOpeningAnimation', true)

      event.stopPropagation() // only stop propagation if cardDetailsIsVisible
      // this.$store.commit('currentUserIsDraggingCard', false)
    }

    // toggleBoxDetails, set boxdetailsposition, boxDetailsIsVisible (like carddetails)
  }
}
</script>

<style lang="stylus">
.box
  position absolute
  border-radius 5px
  min-height 100px
  min-width 100px
  pointer-events none
  &.hover
    box-shadow var(--hover-shadow)
  &.active
    box-shadow var(--active-shadow)
  &.resize
    box-shadow var(--active-shadow)

  .box-info
    pointer-events all
    position absolute
    cursor pointer
    padding 8px
    padding-right 10px
    border-bottom-right-radius 5px
    &:hover
      box-shadow var(--hover-shadow)
    &:active
      box-shadow var(--active-shadow)

  .bottom-button-wrap
    pointer-events all
    position absolute
    right 0px
    bottom 0px
    display flex
    .resize-button-wrap
      z-index 1
      cursor ew-resize
      button
        cursor ew-resize
    img
      -webkit-user-drag none

  .resize-icon
    position absolute
    left 4px
    top 4.5px

.box-jiggle
  animation boxJiggle 0.5s infinite ease-out forwards
@media (prefers-reduced-motion)
  .box-jiggle
    animation none

@keyframes boxJiggle
  0%
    transform rotate(0deg)
  25%
    transform rotate(-1deg)
  50%
    transform rotate(1deg)
  75%
    transform rotate(-1deg)
  100%
    transform rotate(0deg)

</style>
