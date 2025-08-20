import consts from '@/consts.js'

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

  pointByName (points, name) {
    return points.find(point => point.name === name)
  },

  rectsIsAligned (rect1, rect2) {
    const isAlignedX = rect1.x === rect2.x
    const isAlignedY = rect1.y + rect1.height + consts.spaceBetweenCards === rect2.y
    return isAlignedX && isAlignedY
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
    const minDistance = Infinity
    let closestPair = { point1: null, point2: null }
    // handle left aligned and distributed cards
    if (this.rectsIsAligned(item1, item2)) {
      closestPair = { point1: points1[1], point2: points2[1] }
      return closestPair
    }
    // or, compare the center points of both rectangles
    // if rect1Center is left of rect2Center → rect1Center uses topRight, rect2Center uses topLeft
    // if rect1Center is right of rect2Center → rect1Center uses topLeft, rect2Center uses topRight
    const rect1Center = { x: item1.x + item1.width / 2, y: item1.y + item1.height / 2 }
    const rect2Center = { x: item2.x + item2.width / 2, y: item2.y + item2.height / 2 }
    const rect1Name = rect1Center.x < rect2Center.x ? 'topRight' : 'topLeft'
    const rect2Name = rect2Center.x < rect1Center.x ? 'topRight' : 'topLeft'
    closestPair = {
      point1: this.pointByName(points1, rect1Name),
      point2: this.pointByName(points2, rect2Name)
    }
    return closestPair
  }
}
