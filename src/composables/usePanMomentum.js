// momentum scrolling shared by mouse panning (Panning.vue) and touch panning (ScrollAndTouchHandler.vue)

import utils from '@/utils.js'

// Adjust this value to change the momentum decay
// Lower values (closer to 0.92) make the scrolling slower and smoother
// Higher values (closer to 0.96) make the scrolling faster and more abrupt
const momentumDeceleration = 0.95

// Threshold for stopping when velocity is low
// A smaller threshold ensures the scrolling stops only when it's very slow.
const momentumThreshold = 0.5

export function usePanMomentum () {
  let momentumTimer, velocity, currentScroll, onEndCallback

  const safariFix = () => {
    // force safari to recompute internal element positions after panning
    // https://forum.kinopio.club/t/cursor-position-is-wrong-after-right-click-drag-to-pan/1799
    if (!utils.isSafari()) { return }
    window.scrollTo(currentScroll.x, currentScroll.y)
  }
  const end = () => {
    window.cancelAnimationFrame(momentumTimer)
    momentumTimer = null
    safariFix()
    if (onEndCallback) {
      const callback = onEndCallback
      onEndCallback = null
      callback()
    }
  }
  const frame = () => {
    const velocityIsLow = Math.abs(velocity.x) < momentumThreshold && Math.abs(velocity.y) < momentumThreshold
    if (velocityIsLow) {
      end()
      return
    }
    velocity.x = velocity.x * momentumDeceleration
    velocity.y = velocity.y * momentumDeceleration
    window.scrollBy(velocity.x, velocity.y)
    // track the applied scroll position, accumulating velocity instead drifts from
    // browser rounding and edge clamping, which made the safariFix scrollTo visibly jump
    currentScroll.x = window.scrollX
    currentScroll.y = window.scrollY
    momentumTimer = window.requestAnimationFrame(frame)
  }
  // initialVelocity is the scroll delta per frame, { x, y }
  const start = (initialVelocity, onEnd) => {
    cancel()
    velocity = { x: initialVelocity.x, y: initialVelocity.y }
    currentScroll = { x: window.scrollX, y: window.scrollY }
    onEndCallback = onEnd
    momentumTimer = window.requestAnimationFrame(frame)
  }
  const cancel = () => {
    if (!momentumTimer) { return }
    end()
  }
  const isActive = () => Boolean(momentumTimer)

  return { start, cancel, isActive }
}
