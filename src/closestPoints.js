export default {
  normalizeRect (item) {
    const width = item.infoWidth || item.resizeWidth || item.width
    const height = item.infoHeight || item.resizeHeight || item.height
    return {
      left: item.x,
      right: item.x + width,
      top: item.y,
      bottom: item.y + height
    }
  },

  updateRectWithPadding (rect, itemType) {
    let padding
    switch (itemType) {
      case 'card':
        padding = 6
        break
      case 'box':
        padding = 2
        break
      default:
        padding = 2
        break
    }
    return {
      left: rect.left + padding,
      right: rect.right - padding,
      top: rect.top + padding,
      bottom: rect.bottom - padding
    }
  },

  getCardinalPoints (rect) {
    const centerX = (rect.left + rect.right) / 2
    const centerY = (rect.top + rect.bottom) / 2
    return {
      // middle points
      north: { x: centerX, y: rect.top, isMiddlePointY: true },
      east: { x: rect.right, y: centerY, isMiddlePointX: true },
      south: { x: centerX, y: rect.bottom, isMiddlePointY: true },
      west: { x: rect.left, y: centerY, isMiddlePointX: true },
      // corner points
      northEast: { x: rect.right, y: rect.top },
      southEast: { x: rect.right, y: rect.bottom },
      southWest: { x: rect.left, y: rect.bottom },
      northWest: { x: rect.left, y: rect.top }
    }
  },
  closestPair (pairs, minDistance) {
    let closest
    pairs = pairs.filter(pair => pair.distance === minDistance)
    console.log('🚛🚛', pairs)

    pairs.forEach(pair => {
      const { point1, point2, point1Cardinal, point2Cardinal } = pair

      // if isleft
      //   point1.x < point2.x
      // point1Cardinal = 'southEast'
      // point2Cardinal = 'southWest'
      // if
      // if (pair.)
    })

    const closestPair = pairs[0] // change to eval based on .. something
    return closestPair
  },
  findClosestPoints (item1, item2) {
    // Normalize and add padding to rectangles
    let rect1 = this.normalizeRect(item1)
    let rect2 = this.normalizeRect(item2)
    rect1 = this.updateRectWithPadding(rect1, item1.itemType)
    rect2 = this.updateRectWithPadding(rect2, item2.itemType)
    // Get all cardinal points
    const points1 = this.getCardinalPoints(rect1)
    const points2 = this.getCardinalPoints(rect2)
    // Find the pair of points with minimum distance
    let minDistance = Infinity
    const closestPairs = [] // { point1: null, point2: null }
    // Iterate through all point pairs
    Object.values(points1).forEach((point1, p1Index) => {
      Object.values(points2).forEach((point2, p2Index) => {
        const dx = point1.x - point2.x
        const dy = point1.y - point2.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance <= minDistance) {
          const point1Cardinal = Object.keys(points1)[p1Index]
          const point2Cardinal = Object.keys(points2)[p2Index]
          // only connect to the middle if both sides are the same axis middle points
          // const isBothPointsCards = item1.itemType === 'card' && item2.itemType === 'card'
          const isOnlyOneMiddlePointX = point1.isMiddlePointX !== point2.isMiddlePointX
          const isOnlyOneMiddlePointY = point1.isMiddlePointY !== point2.isMiddlePointY
          if (isOnlyOneMiddlePointX || isOnlyOneMiddlePointY) { return }
          console.log('❤️', point1Cardinal, point2Cardinal)

          minDistance = distance
          const closestPair = { point1: { ...point1 }, point2: { ...point2 }, point1Cardinal, point2Cardinal, distance }
          closestPairs.push(closestPair)
        }
      })
    })
    return this.closestPair(closestPairs, minDistance)
  }
}
