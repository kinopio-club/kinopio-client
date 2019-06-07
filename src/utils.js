// functional methods that can see dom, but can't use vue

export default {
  cursorPosition (event) {
    let x, y
    if (event.touches) {
      x = event.touches[0].clientX
      y = event.touches[0].clientY
    } else {
      x = event.clientX
      y = event.clientY
    }
    return { x, y }
  },

  elementCenter (rect) {
    const x = Math.round(rect.x + (rect.width / 2))
    const y = Math.round(rect.y + (rect.height / 2))
    return { x, y }
  },

  between ({ value, min, max }) {
    if (min <= value && value <= max) { return true }
  },

  clone (object) {
    let cloned = JSON.stringify(object)
    cloned = JSON.parse(cloned)
    return cloned
  },

  // 🐙 Connection Path Utils

  connectorCoords (blockId) {
    let rect = document.querySelector(`.connector[data-block-id="${blockId}"]`).getBoundingClientRect()
    return this.elementCenter(rect)
  },

  coordsWithCurrentScrollOffset ({ x, y }) {
    const offsetX = x + window.scrollX
    const offsetY = y + window.scrollY
    return { x: offsetX, y: offsetY }
  },

  connectionBetweenBlocks (startId, endId) {
    let start = this.connectorCoords(startId)
    let end = this.connectorCoords(endId)
    return this.connectionPathBetweenCoords(start, end)
  },

  curveControlPoint (start, end) {
    // TODO: as you're drawing, manipulate the curvecontrolpoint to be more pleasing
    return 'q90,40'
  },

  connectionPathBetweenCoords (start, end) {
    // console.log(start, this.coordsWithCurrentScrollOffset(start))
    const offsetStart = this.coordsWithCurrentScrollOffset(start)
    const offsetEnd = this.coordsWithCurrentScrollOffset(end)

    const delta = {
      x: (offsetEnd.x - offsetStart.x),
      y: (offsetEnd.y - offsetStart.y)
    }
    let curve = this.curveControlPoint(offsetStart, delta)
    return `m${offsetStart.x},${offsetStart.y} ${curve} ${delta.x},${delta.y}`
  },

  // 👻 Edge Scrolling Utils

  distancesFromEdge (viewportSize) {
    return {
      far: Math.round((8 / 100) * viewportSize),
      medium: Math.round((4 / 100) * viewportSize),
      close: Math.round((2 / 100) * viewportSize)
    }
  },

  distancesToScroll (viewportSize) {
    return {
      far: Math.round((2 / 100) * viewportSize),
      medium: Math.round((4 / 100) * viewportSize),
      close: Math.round((6 / 100) * viewportSize)
    }
  },

  proximityTypeFromEdge (position, distances, viewportSize) {
    let close, medium, far
    if (viewportSize) {
      close = position > (viewportSize - distances.close)
      medium = position > (viewportSize - distances.medium)
      far = position > (viewportSize - distances.far)
    } else {
      close = position < distances.close
      medium = position < distances.medium
      far = position < distances.far
    }
    if (close) { return 'close' }
    if (medium) { return 'medium' }
    if (far) { return 'far' }
  }

}
