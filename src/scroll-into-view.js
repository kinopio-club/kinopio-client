// import utils from '@/utils.js'

// https://gist.github.com/gre/1650294 or utils.easeOut

// const maxIterations = 60
const padding = 20

let viewportWidth, viewportHeight, totalX, totalY

// todo add threshold 20px (optional if pg space available)

export default {
  scroll (element) {
    totalX = undefined
    totalY = undefined
    const rect = element.getBoundingClientRect()
    if (window.visualViewport) {
      viewportWidth = window.visualViewport.width
      viewportHeight = window.visualViewport.height
    } else {
      // firefox fallback
      viewportWidth = document.documentElement.clientWidth
      viewportHeight = document.documentElement.clientHeight
    }

    rect.rightX = rect.x + rect.width
    rect.bottomY = rect.y + rect.height
    // element is wider than viewport
    if (rect.width > viewportWidth) {
      totalX = (window.scrollX + padding) - rect.x
    // element has x cut off
    } else if (rect.rightX > viewportWidth) {
      totalX = rect.rightX - viewportWidth
    }
    // element is taller than viewport
    if (rect.height > viewportHeight) {
      totalY = (window.scrollY + padding) - rect.y
    // element has y cut off
    } else if (rect.bottomY > viewportHeight) {
      totalY = rect.bottomY - viewportHeight
    }
    console.log('🍓', element, rect, totalX, totalY)

    //     // if rect.width > viewportwidth then scroll elementLeftSide to window.scrollX + 20
    //     // if rect.height > viewportheight then scroll elementTopSide side window.scrollY + 20
    // // else
    //     totalX = elementRightSide - viewportWidth
    //     totalY = elementBottomSide - viewportHeight
    //     // if (shouldScrollX || shouldScrollY) { console.log('🍊noscroll') }

    //     const shouldScrollX = Math.sign(totalX) === 1
    //     const shouldScrollY = Math.sign(totalY) === 1

    //     if (shouldScrollX) {
    //       console.log('scroll X by', totalX)
    //     }
    //     if (shouldScrollY) {
    //       console.log('scroll Y by', totalY)
    //     }

    // determine if element is in view
    // determine which axis' needs to be scrolled
  },
  scrollFrame () {
    // distance = Total number of px to scroll
    // direction via neg or positive totalX,Y
  },
  cancel () {
    // triggered by scroll event in space.vue
  }

  // createInitialCircle () {
  //   const initialCircle = {
  //     x: startCursor.x,
  //     y: startCursor.y,
  //     color: this.currentUserColor,
  //     iteration: 1,
  //     persistent: true
  //   }
  //   initialCircles.push(initialCircle)
  //   this.drawCircle(initialCircle, initialCircleContext)
  // },

  // initialCirclesAnimationFrame () {
  //   initialCircles = utils.filterCircles(initialCircles, maxIterations)
  //   initialCircleContext.clearRect(0, 0, this.pageWidth, this.pageHeight)
  //   initialCircles.forEach(item => {
  //     if (!item.persistent) {
  //       item.iteration++
  //     }
  //     let circle = JSON.parse(JSON.stringify(item))
  //     this.drawCircle(circle, initialCircleContext)
  //   })
  //   if (initialCircles.length) {
  //     window.requestAnimationFrame(this.initialCirclesAnimationFrame)
  //   } else {
  //     window.cancelAnimationFrame(initialCirclesTimer)
  //     initialCirclesTimer = undefined
  //   }
  // }

}
