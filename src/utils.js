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

  distancesToTriggerScrolling (viewportSize) {
    let distancePercents
    if (viewportSize < 500) {
      distancePercents = {
        close: 12,
        closer: 8,
        closest: 4
      }
    } else {
      distancePercents = {
        close: 10,
        closer: 5,
        closest: 2
      }
    }
    return {
      close: Math.round((distancePercents.close / 100) * viewportSize),
      closer: Math.round((distancePercents.closer / 100) * viewportSize),
      closest: Math.round((distancePercents.closest / 100) * viewportSize)
    }
  },

  distancesToScrollBy (viewportSize) {
    return {
      close: Math.round((2 / 100) * viewportSize),
      closer: Math.round((4 / 100) * viewportSize),
      closest: Math.round((6 / 100) * viewportSize)
    }
  }

}
