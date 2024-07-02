import utils from '@/utils.js'

const gridSize = 10
let zoom

export default {

  // handle rects with tilt

  degreesToRadians (degrees) {
    return degrees * (Math.PI / 180)
  },
  rotatePoint (point, rect, angle) {
    const pivotOrigin = {
      x: rect.x + rect.width,
      y: rect.y
    }
    const xDiff = point.x - pivotOrigin.x
    const yDiff = point.y - pivotOrigin.y
    const cosAngle = Math.cos(angle)
    const sinAngle = Math.sin(angle)
    const x = pivotOrigin.x + (xDiff * cosAngle - yDiff * sinAngle)
    const y = pivotOrigin.y + (xDiff * sinAngle + yDiff * cosAngle)
    return { x, y }
  },

  // check rects

  getGridCell (x, y) {
    return {
      col: Math.floor(x / gridSize),
      row: Math.floor(y / gridSize)
    }
  },
  createGrid (rects) {
    zoom = utils.spaceCounterZoomDecimal()
    const grid = new Map()
    rects.forEach(rect => {
      const topLeft = this.getGridCell(rect.x, rect.y, gridSize)
      const bottomRight = this.getGridCell(rect.x + (rect.width * zoom), rect.y + (rect.height * zoom), gridSize)
      for (let row = topLeft.row; row <= bottomRight.row; row++) {
        for (let col = topLeft.col; col <= bottomRight.col; col++) {
          const cellKey = `${row},${col}`
          if (!grid.has(cellKey)) {
            grid.set(cellKey, [])
          }
          grid.get(cellKey).push(rect)
        }
      }
    })
    return grid
  },
  checkPointsInRects (points, rects, grid) {
    grid = grid || this.createGrid(rects, gridSize)
    const matchingRects = new Set()
    for (let point of points) {
      const cell = this.getGridCell(point.x, point.y, gridSize)
      const cellKey = `${cell.row},${cell.col}`
      if (grid.has(cellKey)) {
        for (let rect of grid.get(cellKey)) {
          // rotated rect
          if (rect.tilt) {
            const angleRad = this.degreesToRadians(rect.tilt)
            const rotatedPoint = this.rotatePoint(point, rect, -angleRad)
            if (this.isPointInsideRect(rotatedPoint, rect)) {
              matchingRects.add(rect)
            }
          // rect
          } else {
            if (this.isPointInsideRect(point, rect)) {
              matchingRects.add(rect)
            }
          }
        }
      }
    }
    return Array.from(matchingRects)
  },
  isPointInsideRect (point, rect) {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + (rect.width * zoom) &&
      point.y >= rect.y &&
      point.y <= rect.y + (rect.height * zoom)
    )
  },

  // check paths

  checkPointsInsidePath (points, svg, path) {
    // Convert points to SVG points
    const svgPoints = Array.from(points).map(point => {
      let svgPoint = svg.createSVGPoint()
      svgPoint.x = point.x
      svgPoint.y = point.y
      return svgPoint
    })
    // Iterate through each SVG path in the DOM
    const pathsInsidePoints = []
    // Check if each point is inside the SVG path
    svgPoints.forEach(svgPoint => {
      if (path.isPointInStroke(svgPoint)) {
        const pathData = path.dataset
        pathsInsidePoints.push(pathData)
      }
    })
    return pathsInsidePoints
  }
}
