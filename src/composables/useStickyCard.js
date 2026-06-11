// sticky cards
// stretches a card towards the cursor while hovering, then springs back on mouse leave

import { reactive } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

const stickyTimerDuration = 250
const stickyTransitionDuration = 100 // ms

// card is a ref to the card object
// cardElement is a ref to the .card-wrap element
// x, y are computed card positions
// shouldNotStick is a computed that disables sticking
export const useStickyCard = ({ card, cardElement, x, y, shouldNotStick }) => {
  const globalStore = useGlobalStore()

  let preventSticking = false
  let stickyTimerComplete = false
  let stickyTimer
  let stickyMap
  let stickyStartTransitionTimer
  let stickyEndTransitionTimer

  const state = reactive({
    stickyTranslateX: 0,
    stickyTranslateY: 0,
    isAnimationUnsticking: false,
    isAnimationStickingStart: false,
    isAnimationStickingEnd: false,
    stickyStretchResistance: 6
  })

  const updateShouldNotStickMap = () => {
    stickyMap = []
    const element = cardElement.value
    let rect
    // connector
    const connector = element.querySelector('.connector')
    if (connector) {
      rect = connector.getBoundingClientRect()
      rect = utils.rectDimensions(rect)
      stickyMap.push(rect)
    }
    // checkbox
    const checkbox = element.querySelector('.item-checkbox-button')
    if (checkbox) {
      rect = checkbox.getBoundingClientRect()
      rect = utils.rectDimensions(rect)
      stickyMap.push(rect)
    }
    // tilt resize buttons
    const tiltResizeButtons = element.querySelectorAll('.bottom-button-wrap')
    tiltResizeButtons.forEach(button => {
      rect = button.getBoundingClientRect()
      rect = utils.rectDimensions(rect)
      stickyMap.push(rect)
    })
  }
  const initStickToCursor = () => {
    preventSticking = false
    if (shouldNotStick.value || consts.userPrefersReducedMotion()) {
      preventSticking = true
    }
    stickyTimer = setTimeout(() => {
      stickyTimerComplete = true
    }, stickyTimerDuration)
    updateStickyStretchResistance()
    updateShouldNotStickMap()
  }
  const clearStickyTimer = () => {
    clearTimeout(stickyTimer)
    stickyTimerComplete = false
  }
  const stopSticking = () => {
    // ease back to the resting position to prevent jarring movement
    const isStuck = state.stickyTranslateX || state.stickyTranslateY
    if (isStuck) {
      state.isAnimationStickingEnd = true
      clearTimeout(stickyEndTransitionTimer)
      stickyEndTransitionTimer = setTimeout(() => {
        state.isAnimationStickingEnd = false
      }, stickyTransitionDuration)
    }
    clearStickyPositionOffsets()
    preventSticking = true
  }
  const updateStickyStretchResistance = () => {
    const zoom = globalStore.getSpaceZoomDecimal
    let { height, width } = card.value
    height = height * zoom
    width = width * zoom
    // larger sizes have stick less
    let stretchResistance // higher resistance moves less
    const area = width * height
    if (area > 1000000) {
      stretchResistance = 24
    } else if (area > 60000) {
      stretchResistance = 16
    } else if (area > 20000) {
      stretchResistance = 10
    } else {
      stretchResistance = 6
    }
    // too tall or wide cards stick less
    const heightRatio = height / width
    const widthRatio = width / height
    if (heightRatio > 10 || widthRatio > 10) {
      stretchResistance = 50
    }
    state.stickyStretchResistance = stretchResistance
  }
  const stickToCursor = (event) => {
    if (state.isAnimationUnsticking) { return }
    if (preventSticking) { return }
    if (!stickyTimerComplete) { return }
    const position = utils.cursorPositionInSpace(event)
    // stop sticking by map
    const positionIsInsideMap = stickyMap.find(rect => utils.isPointInsideRect(position, rect))
    if (positionIsInsideMap) {
      stopSticking()
      return
    }
    // stop sticking by element
    const classes = ['checkbox-wrap', 'button-wrap', 'progress-wrap', 'inline-button', 'badge']
    const elements = ['button', 'progress', 'iframe']
    const isOverAction = classes.includes(event.target.className) || elements.includes(event.target.nodeName.toLowerCase())
    const isOverTag = event.target.className.includes('button-badge')
    if (shouldNotStick.value || isOverAction || isOverTag) {
      stopSticking()
      return
    }
    const isButtonHover = event.target.closest('.inline-button-wrap') || event.target.closest('.button-wrap')
    if (isButtonHover) {
      stopSticking()
      return
    }
    // position
    const stretchResistance = state.stickyStretchResistance
    const { height, width } = card.value
    const halfWidth = width / 2
    const halfHeight = height / 2
    const centerX = x.value + halfWidth
    const centerY = y.value + halfHeight
    // position from card center
    const xFromCenter = position.x - centerX
    const yFromCenter = position.y - centerY
    // percentage from center to card edge
    const xPercent = (xFromCenter / halfWidth)
    const yPercent = (yFromCenter / halfHeight)
    // calc sticky offset
    let xOffset = (xPercent * halfWidth) / stretchResistance
    xOffset = Math.round(xOffset)
    let yOffset = (yPercent * halfHeight) / stretchResistance
    yOffset = Math.round(yOffset)
    // ease in the first frame of sticking to prevent jarring movement
    const isFirstFrame = !state.stickyTranslateX && !state.stickyTranslateY
    if (isFirstFrame) {
      state.isAnimationStickingStart = true
      clearTimeout(stickyStartTransitionTimer)
      stickyStartTransitionTimer = setTimeout(() => {
        state.isAnimationStickingStart = false
      }, stickyTransitionDuration)
    }
    state.stickyTranslateX = xOffset + 'px'
    state.stickyTranslateY = yOffset + 'px'
  }
  const unstickToCursor = () => {
    clearStickyTimer()
    state.isAnimationUnsticking = true
    const xOffset = parseInt(state.stickyTranslateX)
    const yOffset = parseInt(state.stickyTranslateY)
    const timing = {
      duration: 0, // sum of keyframe offsets
      easing: 'cubic-bezier(0.45, 0, 0.55, 1)',
      iterations: 1
    }
    const swings = [-0.9, 0.6, -0.4, 0.2, 0] // [-1, 0.75, -0.5, 0.25, 0]
    let keyframes = [
      { transform: `translate(${xOffset * swings[0]}px,   ${yOffset * swings[0]}px)`, offset: 50 },
      { transform: `translate(${xOffset * swings[1]}px, ${yOffset * swings[1]}px)`, offset: 75 },
      { transform: `translate(${xOffset * swings[2]}px, ${yOffset * swings[2]}px)`, offset: 50 },
      { transform: `translate(${xOffset * swings[3]}px, ${yOffset * swings[3]}px)`, offset: 100 },
      { transform: `translate(${xOffset * swings[4]}px,    ${yOffset * swings[4]}px)`, offset: 100 }
    ]
    keyframes.forEach(keyframe => {
      timing.duration = timing.duration + keyframe.offset
    })
    let lastOffset = 0
    keyframes = keyframes.map(keyframe => {
      keyframe.offset = lastOffset + (keyframe.offset / timing.duration)
      keyframe.offset = utils.roundFloat(keyframe.offset)
      lastOffset = keyframe.offset
      return keyframe
    })
    // play animation
    const element = cardElement.value
    if (!element) { return }
    const animation = element.animate(keyframes, timing)
    animation.onfinish = () => {
      clearStickyPositionOffsets()
      state.isAnimationUnsticking = false
    }
  }
  const clearStickyPositionOffsets = () => {
    state.stickyTranslateX = 0
    state.stickyTranslateY = 0
  }

  return {
    stickyState: state,
    initStickToCursor,
    stickToCursor,
    unstickToCursor,
    clearStickyPositionOffsets
  }
}
