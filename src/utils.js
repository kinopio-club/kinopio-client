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

  clone (object) {
    let cloned = JSON.stringify(object)
    cloned = JSON.parse(cloned)
    return cloned
  },

  createConnection (origin, connection) {
    console.log('createConnection', origin, connection)
  },

  curveControlPoint (origin, delta) {
    // TODO: as you're drawing, manipulate the curvecontrolpoint to be more pleasing
    return 'q90,40'
  },

  connectionPathBetweenCoords (origin, destination) {
    const delta = {
      x: destination.x - origin.x,
      y: destination.y - origin.y
    }
    let curve = this.curveControlPoint(origin, delta)
    return `m${origin.x},${origin.y} ${curve} ${delta.x},${delta.y}`
  }

}
