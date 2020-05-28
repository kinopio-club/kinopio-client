// import utils from '@/utils.js'

const maxIterations = 12 // 12 / 60fps = 200ms
const padding = 20

let viewportWidth, viewportHeight, totalX, totalY, currentIteration, scrollTimer

const self = {
  scroll (element) {
    this.cancel()
    totalX = undefined
    totalY = undefined
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
      totalX = rect.right - (viewportWidth + padding)
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

    scrollTimer = window.requestAnimationFrame(self.scrollFrame)
  },

  scrollFrame () {
    currentIteration++
    console.log('🌷', currentIteration, 'totalX', totalX, 'totalY', totalY)

    // utils.easeOut or https://gist.github.com/gre/1650294
    // const scrollX = .. || 0
    // const scrollY = .. || 0

    // scroll page by scrollX and scrollY

    if (currentIteration < maxIterations) {
      window.requestAnimationFrame(self.scrollFrame)
    } else {
      self.cancel()
    }
  },

  cancel () {
    if (scrollTimer) {
      currentIteration = maxIterations + 1
      window.cancelAnimationFrame(scrollTimer)
      scrollTimer = undefined
    }
  }
}

export default self
