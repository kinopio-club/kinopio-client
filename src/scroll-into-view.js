import utils from '@/utils.js'

const maxIterations = 12 // 12 / 60fps = 200ms
const padding = 20

let viewportWidth, viewportHeight, totalX, totalY, currentIteration, scrollTimer, travelledX, travelledY

const self = {
  scroll (element) {
    this.cancel()
    totalX = 0
    totalY = 0
    travelledX = 0
    travelledY = 0
    currentIteration = 0
    const rect = element.getBoundingClientRect()
    if (window.visualViewport) {
      viewportWidth = window.visualViewport.width
      viewportHeight = window.visualViewport.height
    } else {
      // firefox fallback
      viewportWidth = document.documentElement.clientWidth
      viewportHeight = document.documentElement.clientHeight
    }

    // x ←
    if (rect.width > viewportWidth) {
      totalX = (window.scrollX + padding) - rect.left
    } else if (rect.left < 0) {
      totalX = rect.left - padding
    // x →
    } else if (rect.right > viewportWidth) {
      totalX = (rect.right + padding) - viewportWidth
    }

    // y ↑
    if (rect.height > viewportHeight) {
      totalY = (window.scrollY + padding) - rect.top
    } else if (rect.top < 0) {
      totalY = rect.top - padding
    // y ↓
    } else if (rect.bottom > viewportHeight) {
      totalY = rect.bottom - (viewportHeight - padding)
    }

    console.log('🍆', 'totalX', totalX, 'totalY', totalY)
    scrollTimer = window.requestAnimationFrame(self.scrollFrame)
  },

  scrollFrame () {
    currentIteration++
    const percentComplete = currentIteration / maxIterations * 100

    const scrollX = utils.easeOut(percentComplete, currentIteration, maxIterations) * totalX
    const scrollByX = scrollX - travelledX
    travelledX = scrollX

    const scrollY = utils.easeOut(percentComplete, currentIteration, maxIterations) * totalY
    const scrollByY = scrollY - travelledY
    travelledY = scrollY

    window.scrollBy(scrollByX, scrollByY)
    if (currentIteration <= maxIterations) {
      window.requestAnimationFrame(self.scrollFrame)
    } else {
      self.cancel()
      return
    }

    console.log('💐', currentIteration, scrollByX, scrollByY, travelledX, travelledY)
  },

  cancel (event) {
    if (event) {
      // console.log('✂️cancel called', event)
      // called by all scroll dom and user :'(
      // no way to differentiate user from dom scroll event?
      // :. cannot interrupt
      // -> instead: can block interaction , or make scroll so fast it doesn't need interaction
      return
    }
    if (scrollTimer) {
      currentIteration = maxIterations + 1
      window.cancelAnimationFrame(scrollTimer)
      scrollTimer = undefined
    }
  }
}

export default self
