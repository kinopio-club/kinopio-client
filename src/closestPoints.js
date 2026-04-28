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

  // prefer middle points when the items are roughly aligned on that axis, otherwise use corner points.
  closestPair (pairs, minDistance) {
    pairs = pairs.filter(pair => pair.distance === minDistance)

    const middlePairs = pairs.filter(p => p.point1.isMiddlePointX || p.point1.isMiddlePointY)
    const cornerPairs = pairs.filter(p => !p.point1.isMiddlePointX && !p.point1.isMiddlePointY)

    // Use middle points' positions as a proxy for item centers
    const northSouth = pairs.find(p => p.point1Cardinal === 'south' && p.point2Cardinal === 'north') ||
      pairs.find(p => p.point1Cardinal === 'north' && p.point2Cardinal === 'south')
    const eastWest = pairs.find(p => p.point1Cardinal === 'east' && p.point2Cardinal === 'west') ||
      pairs.find(p => p.point1Cardinal === 'west' && p.point2Cardinal === 'east')

    if (northSouth || eastWest) {
      // Compute dx/dy from the middle point positions (these represent center axes)
      const ref = (northSouth || eastWest)
      const dx = Math.abs(ref.point1.x - ref.point2.x)
      const dy = Math.abs(ref.point1.y - ref.point2.y)
      const threshold = 20 // px
      if (northSouth && dx < threshold) return northSouth
      if (eastWest && dy < threshold) return eastWest
    }

    // Fall back to best corner
    if (cornerPairs.length) {
      const ref = pairs[0]
      const p1IsLeft = ref.point1.x < ref.point2.x
      const dx = Math.abs(ref.point1.x - ref.point2.x)
      const dy = Math.abs(ref.point1.y - ref.point2.y)
      const isPrimarilyVertical = dy > dx

      if (isPrimarilyVertical) {
        const target = p1IsLeft ? 'southWest' : 'southEast'
        return cornerPairs.find(p => p.point1Cardinal === target) || cornerPairs[0]
      } else {
        const p1IsAbove = ref.point1.y < ref.point2.y
        const target = p1IsAbove ? 'northEast' : 'southEast'
        return cornerPairs.find(p => p.point1Cardinal === target) || cornerPairs[0]
      }
    }

    return pairs[0]
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
          const pair = { point1: { ...point1 }, point2: { ...point2 }, point1Cardinal, point2Cardinal, distance }
          closestPairs.push(pair)
        }
      })
    })
    return this.closestPair(closestPairs, minDistance)
  }
}
