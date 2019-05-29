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

  connectorCoords (cardId) {
    let rect = document.querySelector(`.connector[data-card-id="${cardId}"]`).getBoundingClientRect()
    return this.elementCenter(rect)
  },

  connectionBetweenCards (startId, endId) {
    console.log(startId, endId)
    let start = this.connectorCoords(startId)
    let end = this.connectorCoords(endId)
    return this.connectionPathBetweenCoords(start, end)
  },

  curveControlPoint (start, end) {
    // TODO: as you're drawing, manipulate the curvecontrolpoint to be more pleasing
    return 'q90,40'
  },

  connectionPathBetweenCoords (start, end) {
    const delta = {
      x: end.x - start.x,
      y: end.y - start.y
    }
    let curve = this.curveControlPoint(start, delta)
    return `m${start.x},${start.y} ${curve} ${delta.x},${delta.y}`
  }

}
