export default {
  cursorPosition (event) {
    let x, y
    if (event.touches) {
      x = event.touches[0].pageX
      y = event.touches[0].pageY
    } else {
      x = event.pageX
      y = event.pageY
    }
    return { x, y }
  },

  elementCenter (rect) {
    const x = Math.round(rect.x + (rect.width / 2))
    const y = Math.round(rect.y + (rect.height / 2))
    return { x, y }
  },

  between (value, min, max) {
    if (min <= value && value <= max) { return true }
  },

  curveControlPoint (origin, delta) { // move out?
    // TODO: as you're drawing, manipulate the curvecontrolpoint to be more pleasing
    return 'q90,40'
  }

}
