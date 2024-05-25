const gridSize = 5

export default {
  getGridCell (x, y) {
    return {
      col: Math.floor(x / gridSize),
      row: Math.floor(y / gridSize)
    }
  },

  isPointInsideRect (point, rect) {
    return (rect.x <= point.x && point.x <= rect.x + rect.width &&
      rect.y <= point.y && point.y <= rect.y + rect.height)
  },

  createGrid (rects) {
    const grid = new Map()
    rects.forEach(rect => {
      const topLeft = this.getGridCell(rect.x, rect.y, gridSize)
      const bottomRight = this.getGridCell(rect.x + rect.width, rect.y + rect.height, gridSize)
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

  checkPointsInRects (points, rects) {
    const grid = this.createGrid(rects, gridSize)
    const matchingRects = new Set()
    for (let point of points) {
      const cell = this.getGridCell(point.x, point.y, gridSize)
      const cellKey = `${cell.row},${cell.col}`
      if (grid.has(cellKey)) {
        for (let rect of grid.get(cellKey)) {
          if (this.isPointInsideRect(point, rect)) {
            matchingRects.add(rect)
          }
        }
      }
    }
    return Array.from(matchingRects)
  },

  checkPointsInsidePaths (points, paths, svg) {
    // Convert points to SVG points
    // const svg = document.querySelector('svg.connections')
    const svgPoints = Array.from(points).map(point => {
      let svgPoint = svg.createSVGPoint()
      svgPoint.x = point.x
      svgPoint.y = point.y

      return svgPoint
    })
    // Iterate through each SVG path in the DOM
    const pathsInsidePoints = []
    paths.forEach(path => {
      // Check if each point is inside the SVG path
      svgPoints.forEach(svgPoint => {
        if (path.isPointInStroke(svgPoint)) {
          const pathData = path.dataset
          pathsInsidePoints.push(pathData)
        }
      })
    })
    return pathsInsidePoints
  }

}
