// https://stackoverflow.com/a/51689657/2318064
// scroll window with forced smoothscrolling, for resetting viewport on safari iOS

let windowScroll = {}
const duration = 150

windowScroll.scrollTo = function (position, time) {
  let currentPosition = {
    x: window.pageXOffset,
    y: window.pageYOffset
  }
  let start = null
  time = time || duration
  window.requestAnimationFrame(function step (currentTime) {
    start = !start ? currentTime : start
    let progress = currentTime - start
    if (currentPosition.y < position.y) {
      const x = (position.x - currentPosition.x) * progress / time + currentPosition.x
      const y = (position.y - currentPosition.y) * progress / time + currentPosition.y
      window.scrollTo(x, y)
    } else {
      const x = currentPosition.x - ((currentPosition.x - position.x) * progress / time)
      const y = currentPosition.y - ((currentPosition.y - position.y) * progress / time)
      window.scrollTo(x, y)
    }
    if (progress < time) {
      window.requestAnimationFrame(step)
    }
  })
}

export default windowScroll
