<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import consts from '@/consts.js'

import throttle from 'lodash-es/throttle'

const store = useStore()

const badgeElement = ref(null)
const progressElement = ref(null)
const buttonElement = ref(null)

// let unsubscribe

onMounted(() => {
  // bind events to window to receive events when mouse is outside window
  // window.addEventListener('mousemove', dragPlayhead)
  window.addEventListener('mouseup', endMovePlayhead)
  window.addEventListener('touchend', endMovePlayhead)
  updateButtonPosition()
  // unsubscribe = store.subscribe(mutation => {
  //   if (mutation.type === 'spaceZoomPercent') {
  //     updateButtonPosition()
  //   }
  // })
})
onBeforeUnmount(() => {
  // unsubscribe()
  // window.removeEventListener('mousemove', dragPlayhead)
  window.removeEventListener('mouseup', endMovePlayhead)
  window.removeEventListener('touchend', endMovePlayhead)
})

const emit = defineEmits(['updatePlayhead', 'resetPlayhead', 'removeAnimations'])

const props = defineProps({
  minValue: Number,
  maxValue: Number,
  value: Number,
  defaultValue: Number,
  animateJiggleRight: Boolean,
  animateJiggleLeft: Boolean,
  minKeyboardShortcut: String,
  shouldHideBadge: Boolean
})
// watch(() => props.value, (value, prevValue) => {
//   console.log('🎃🎃spaceZoomPercent',value, props.defaultValue)
//   // updateButtonPosition()
// })

const state = reactive({
  playheadIsBeingDragged: false,
  buttonPosition: 100
})

// badge

const defaultValue = computed(() => props.defaultValue || props.maxValue)
const zoomPercentBadgeIsVisible = computed(() => {
  if (props.shouldHideBadge) { return }
  if (props.value !== defaultValue.value) {
    return true
  } else {
    return false
  }
})
const zoomPercentBadgePosition = computed(() => {
  const max = 40
  const badgeWidth = 45
  let position = state.buttonPosition - (badgeWidth / 2)
  position = Math.min(position, max)
  return position
})
const removeAnimations = () => {
  emit('removeAnimations')
}

// current value

const integerValue = computed(() => Math.round(props.value))
const currentValueIsMin = computed(() => integerValue.value === props.minValue)
const sliderValue = computed(() => {
  let value = utils.percentageBetween({
    value: props.value,
    min: props.minValue,
    max: props.maxValue
  })
  value = Math.round(value)
  return value
})

// update value

const movePlayhead = (event) => {
  const rect = progressElement.value.getBoundingClientRect()
  const progressStartX = rect.x + window.scrollX
  const progressWidth = rect.width - 2
  const clickX = utils.cursorPositionInViewport(event).x + window.scrollX
  const progressX = clickX - progressStartX
  let percent = (progressX / progressWidth) * 100
  percent = Math.min(percent, 100)
  percent = Math.max(percent, 0)
  updateButtonPosition()
  updatePlayhead(percent)
}
const updateButtonPosition = () => {
  if (!progressElement.value) { return }
  const buttonWidth = buttonElement.value.getBoundingClientRect().width + 2
  let position = sliderValue.value - (buttonWidth / 2)
  position = Math.min(position, 86)
  position = Math.max(position, -1)
  state.buttonPosition = position
}
const dragPlayheadWheel = (event) => {
  // ported from SpaceZoom
  const min = consts.spaceZoom.min
  const max = consts.spaceZoom.max
  const maxSpeed = 10 // windows deltaY fix
  event.preventDefault()
  // speed and direction
  const deltaY = event.deltaY
  let speed = Math.max(Math.abs(deltaY), 1)
  speed = Math.min(maxSpeed, speed)
  let shouldZoomIn = deltaY < 0
  let shouldZoomOut = deltaY > 0
  let invertZoom = event.webkitDirectionInvertedFromDevice
  if (store.state.currentUser.shouldInvertZoom) {
    invertZoom = !invertZoom
  }
  if (invertZoom) {
    shouldZoomIn = deltaY > 0
    shouldZoomOut = deltaY < 0
  }
  if (shouldZoomOut) {
    speed = -speed
  }
  // percent change
  let percent = sliderValue.value
  percent += speed
  percent = Math.min(percent, 100)
  percent = Math.max(percent, 0)
  updatePlayhead(percent)
}
const dragPlayhead = (event) => {
  if (!state.playheadIsBeingDragged) { return }
  movePlayhead(event)
}
const startMovePlayhead = (event) => {
  state.playheadIsBeingDragged = true
  movePlayhead(event)
}
const endMovePlayhead = (event) => {
  if (!state.playheadIsBeingDragged) { return }
  state.playheadIsBeingDragged = false
  movePlayhead(event)
}

const stopMovingPlayhead = () => {
  state.playheadIsBeingDragged = false
}

// reset value

const resetPlayhead = async () => {
  state.playheadIsBeingDragged = false
  const value = utils.percentageBetween({
    value: defaultValue.value,
    min: props.minValue,
    max: props.maxValue
  })
  updatePlayhead(value)
  emit('resetPlayhead')
  await nextTick()
  updateButtonPosition()
}

const updatePlayhead = throttle((value) => {
  emit('updatePlayhead', value)
}, 16) // 60fps 1 frame

</script>

<template lang="pug">
.slider(
  @mousedown.left.stop.prevent="startMovePlayhead"
  @touchstart.stop.prevent="startMovePlayhead"

  @mousemove.prevent="dragPlayhead"
  @touchmove.prevent="dragPlayhead"
  @wheel.prevent.stop="dragPlayheadWheel"

  @mouseup.left="endMovePlayhead"
  @touchend="endMovePlayhead"
  :class="{'is-dragging': state.playheadIsBeingDragged, 'jiggle-right': props.animateJiggleRight, 'jiggle-left': props.animateJiggleLeft}"
  @animationend="removeAnimations"

  :data-value="props.value"
  :data-slider-value="sliderValue"
  :data-max="props.maxValue"
  :data-min="props.minValue"
)
  //- percent badge
  span.badge.info.zoom-percent-badge(
    ref="badgeElement"
    v-if="zoomPercentBadgeIsVisible"
    :style="{left: zoomPercentBadgePosition + 'px'}"
  )
    span {{ integerValue }}%
    template(v-if="currentValueIsMin && props.minKeyboardShortcut")
      span &nbsp;({{props.minKeyboardShortcut}})
    button.inline-button(@mousedown.left.stop @click.left.stop="resetPlayhead")
      img.icon.close(src="@/assets/add.svg")

  progress(
    :value="props.value"
    :max="props.maxValue"
    :min="props.minValue"
    ref="progressElement"
  )
  img.vertical-line.first-child(src="@/assets/vertical-line.svg")
  img.vertical-line.second-child(src="@/assets/vertical-line.svg")
  img.vertical-line.last-child(src="@/assets/vertical-line.svg")
  button.slider-button(
    ref="buttonElement"
    :style="{left: state.buttonPosition + 'px'}"
    :class="{'is-dragging': state.playheadIsBeingDragged, active: state.playheadIsBeingDragged}"
  )
</template>

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
