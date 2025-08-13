export default {
  normalizeRect (item) {
    return {
      left: item.x,
      right: item.x + item.width,
      top: item.y,
      bottom: item.y + item.height,
      width: item.width
    }
  },

  updateRectWithPadding (rect, itemType) {
    let padding
    let offset = 0
    if (itemType === 'card') {
      padding = 12
    } else if (itemType === 'box') {
      padding = 2
      offset = 1
    }
    return {
      left: rect.left + padding + offset,
      right: rect.right - padding - offset,
      top: rect.top + padding,
      bottom: rect.bottom - padding,
      width: rect.width - (padding * 2)
    }
  },

  getPoints (rect) {
    // topLeft is prioritized when distances are equal
    return [
      { name: 'topLeft', x: rect.left, y: rect.top },
      { name: 'topRight', x: rect.right, y: rect.top }
    ]
  },

  findClosestPoints (item1, item2) {
    // Normalize and add padding to rectangles
    let rect1 = this.normalizeRect(item1)
    let rect2 = this.normalizeRect(item2)
    rect1 = this.updateRectWithPadding(rect1, item1.itemType)
    rect2 = this.updateRectWithPadding(rect2, item2.itemType)
    const points1 = this.getPoints(rect1)
    const points2 = this.getPoints(rect2)
    // Find the pair of points with minimum distance
    let minDistance = Infinity
    let closestPair = { point1: null, point2: null }
    points1.forEach(point1 => {
      points2.forEach(point2 => {
        const dx = point1.x - point2.x
        const dy = point1.y - point2.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const threshold = 15
        if (distance < (minDistance + threshold)) {
          minDistance = distance
          closestPair = { point1: { ...point1 }, point2: { ...point2 } }
          // console.log(point1, point2, distance)
        }
      })
    })

    return closestPair
  }
}
