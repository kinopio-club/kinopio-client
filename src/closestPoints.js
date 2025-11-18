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

  updateRectWithPadding (rect) {
    const padding = 2
    return {
      left: rect.left + padding,
      right: rect.right - padding,
      top: rect.top + padding,
      bottom: rect.bottom - padding,
      width: rect.width - (padding * 2)
    }
  },

  getPoints (rect) {
    return [
      { name: 'north', x: rect.left + (rect.width / 2), y: rect.top },
      { name: 'east', x: rect.right, y: rect.top + ((rect.bottom - rect.top) / 2) },
      { name: 'south', x: rect.left + (rect.width / 2), y: rect.bottom },
      { name: 'west', x: rect.left, y: rect.top + ((rect.bottom - rect.top) / 2) }
    ]
  },

  pointByName (points, name) {
    return points.find(point => point.name === name)
  },

  rectsIsAligned (rect1, rect2) {
    const isAlignedX = rect1.x === rect2.x
    const isAlignedYTop = rect1.y + rect1.height + consts.spaceBetweenCards === rect2.y
    const isAlignedYBottom = rect2.y + rect2.height + consts.spaceBetweenCards === rect1.y
    return isAlignedX && (isAlignedYTop || isAlignedYBottom)
  },

  findClosestPoints (item1, item2) {
    let rect1 = this.normalizeRect(item1)
    rect1 = this.updateRectWithPadding(rect1)
    const points1 = this.getPoints(rect1)
    let rect2 = this.normalizeRect(item2)
    rect2 = this.updateRectWithPadding(rect2)
    const points2 = this.getPoints(rect2)
    // handle left aligned and distributed cards
    if (this.rectsIsAligned(item1, item2)) {
      const isItem1Above = item1.y < item2.y
      const closestPair = {
        point1: this.pointByName(points1, isItem1Above ? 'south' : 'north'),
        point2: this.pointByName(points2, isItem1Above ? 'north' : 'south')
      }
      return closestPair
    }
    // Determine relative positions
    const rect1Center = { x: item1.x + item1.width / 2, y: item1.y + item1.height / 2 }
    const rect2Center = { x: item2.x + item2.width / 2, y: item2.y + item2.height / 2 }
    // Calculate horizontal and vertical differences
    const xDiff = rect2Center.x - rect1Center.x
    const yDiff = rect2Center.y - rect1Center.y
    let point1Name, point2Name
    // Determine which cardinal points to use based on relative positions
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      // Horizontal relationship is stronger
      if (xDiff > 0) {
        point1Name = 'east'
        point2Name = 'west'
      } else {
        point1Name = 'west'
        point2Name = 'east'
      }
    } else {
      // Vertical relationship is stronger
      if (yDiff > 0) {
        point1Name = 'south'
        point2Name = 'north'
      } else {
        point1Name = 'north'
        point2Name = 'south'
      }
    }
    const closestPair = {
      point1: this.pointByName(points1, point1Name),
      point2: this.pointByName(points2, point2Name)
    }
    return closestPair
  }
}
