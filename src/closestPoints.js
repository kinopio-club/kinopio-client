export default {
  clamp (value, min, max) {
    return Math.max(min, Math.min(max, value))
  },
  normalizeRect (item) {
    return {
      left: item.x,
      right: item.x + item.width,
      top: item.y,
      bottom: item.y + item.height
    }
  },
  updateRectWithPadding (rect, itemType) {
    let padding = 2 // box
    if (itemType === 'card') {
      padding = 6
    }
    return {
      left: rect.left + padding,
      right: rect.right - padding,
      top: rect.top + padding,
      bottom: rect.bottom - padding
    }
  },
  movePointToNearestEdge (point, rect) {
    const xIsInside = point.x > rect.left && point.x < rect.right
    const yIsInside = point.y > rect.top && point.y < rect.bottom
    if (xIsInside && yIsInside) {
      const distToLeft = point.x - rect.left
      const distToRight = rect.right - point.x
      const distToTop = point.y - rect.top
      const distToBottom = rect.bottom - point.y
      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom)
      if (minDist === distToLeft) point.x = rect.left
      else if (minDist === distToRight) point.x = rect.right
      else if (minDist === distToTop) point.y = rect.top
      else point.y = rect.bottom
    }
    return point
  },
  findClosestPoints (item1, item2) {
    let rect1 = this.normalizeRect(item1)
    let rect2 = this.normalizeRect(item2)
    rect1 = this.updateRectWithPadding(rect1, item1.itemType)
    rect2 = this.updateRectWithPadding(rect2, item2.itemType)
    // Find closest point on item1 to item2
    const closest1 = {
      x: this.clamp(rect2.left + (rect2.right - rect2.left) / 2, rect1.left, rect1.right),
      y: this.clamp(rect2.top + (rect2.bottom - rect2.top) / 2, rect1.top, rect1.bottom)
    }
    // If the clamped point is inside item1, move it to the nearest edge
    this.movePointToNearestEdge(closest1, rect1)
    // Find closest point on item2 to the point we found on item1
    const closest2 = {
      x: this.clamp(closest1.x, rect2.left, rect2.right),
      y: this.clamp(closest1.y, rect2.top, rect2.bottom)
    }
    // If the clamped point is inside item2, move it to the nearest edge
    this.movePointToNearestEdge(closest2, rect2)
    // Refine closest1 based on final closest2
    const refined1 = {
      x: this.clamp(closest2.x, rect1.left, rect1.right),
      y: this.clamp(closest2.y, rect1.top, rect1.bottom)
    }
    // If the refined point is inside item1, move it to the nearest edge
    this.movePointToNearestEdge(refined1, rect1)
    return { point1: refined1, point2: closest2 }
  }
}
