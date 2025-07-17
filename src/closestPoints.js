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

  getCorners (rect) {
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

    // Get all corners
    const corners1 = this.getCorners(rect1)
    const corners2 = this.getCorners(rect2)

    // Find the pair of corners with minimum distance
    let minDistance = Infinity
    let closestPair = { point1: null, point2: null }

    // Iterate through all corner pairs using object values
    Object.values(corners1).forEach(corner1 => {
      Object.values(corners2).forEach(corner2 => {
        const dx = corner1.x - corner2.x
        const dy = corner1.y - corner2.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < minDistance) {
          minDistance = distance
          closestPair = { point1: { ...corner1 }, point2: { ...corner2 } }
        }
      })
    })

    return closestPair
  }
}
