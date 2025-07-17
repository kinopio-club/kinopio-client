export default {
  normalizeRect (item) {
    return {
      left: item.x,
      right: item.x + item.width,
      top: item.y,
      bottom: item.y + item.height
    }
  },

  updateRectWithPadding (rect, itemType) {
    let padding
    if (itemType === 'card') {
      padding = 12
    } else if (itemType === 'box') {
      padding = 2
    }
    return {
      left: rect.left + padding,
      right: rect.right - padding,
      top: rect.top + padding,
      bottom: rect.bottom - padding
    }
  },

  getPoints (rect) {
    return {
      topLeft: { x: rect.left, y: rect.top },
      topRight: { x: rect.right, y: rect.top }
    }
  },

  findClosestPoints (item1, item2) {
    // Normalize and add padding to rectangles
    let rect1 = this.normalizeRect(item1)
    let rect2 = this.normalizeRect(item2)
    rect1 = this.updateRectWithPadding(rect1, item1.itemType)
    rect2 = this.updateRectWithPadding(rect2, item2.itemType)

    // Get all points
    const rectPoints1 = this.getPoints(rect1)
    const rectPoints2 = this.getPoints(rect2)

    // Find the pair of points with minimum distance
    let minDistance = Infinity
    let closestPair = { point1: null, point2: null }

    // Iterate through all point pairs using object values
    Object.values(rectPoints1).forEach(point1 => {
      Object.values(rectPoints2).forEach(point2 => {
        const dx = point1.x - point2.x
        const dy = point1.y - point2.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < minDistance) {
          minDistance = distance
          closestPair = { point1: { ...point1 }, point2: { ...point2 } }
        }
      })
    })

    return closestPair
  }
}
