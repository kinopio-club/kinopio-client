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
    let xIsInside = closest1.x > rect1.left && closest1.x < rect1.right
    let yIsInside = closest1.y > rect1.top && closest1.y < rect1.bottom

    if (xIsInside && yIsInside) {
      const distToLeft = closest1.x - rect1.left
      const distToRight = rect1.right - closest1.x
      const distToTop = closest1.y - rect1.top
      const distToBottom = rect1.bottom - closest1.y

      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom)

      if (minDist === distToLeft) closest1.x = rect1.left
      else if (minDist === distToRight) closest1.x = rect1.right
      else if (minDist === distToTop) closest1.y = rect1.top
      else closest1.y = rect1.bottom
    }

    // Find closest point on item2 to the point we found on item1
    const closest2 = {
      x: this.clamp(closest1.x, rect2.left, rect2.right),
      y: this.clamp(closest1.y, rect2.top, rect2.bottom)
    }

    // If the clamped point is inside item2, move it to the nearest edge
    xIsInside = closest2.x > rect2.left && closest2.x < rect2.right
    yIsInside = closest2.y > rect2.top && closest2.y < rect2.bottom
    if (xIsInside && yIsInside) {
      const distToLeft = closest2.x - rect2.left
      const distToRight = rect2.right - closest2.x
      const distToTop = closest2.y - rect2.top
      const distToBottom = rect2.bottom - closest2.y

      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom)

      if (minDist === distToLeft) closest2.x = rect2.left
      else if (minDist === distToRight) closest2.x = rect2.right
      else if (minDist === distToTop) closest2.y = rect2.top
      else closest2.y = rect2.bottom
    }
    // Refine closest1 based on final closest2
    const refined1 = {
      x: this.clamp(closest2.x, rect1.left, rect1.right),
      y: this.clamp(closest2.y, rect1.top, rect1.bottom)
    }
    xIsInside = refined1.x > rect1.left && refined1.x < rect1.right
    yIsInside = refined1.y > rect1.top && refined1.y < rect1.bottom
    if (xIsInside && yIsInside) {
      const distToLeft = refined1.x - rect1.left
      const distToRight = rect1.right - refined1.x
      const distToTop = refined1.y - rect1.top
      const distToBottom = rect1.bottom - refined1.y

      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom)

      if (minDist === distToLeft) refined1.x = rect1.left
      else if (minDist === distToRight) refined1.x = rect1.right
      else if (minDist === distToTop) refined1.y = rect1.top
      else refined1.y = rect1.bottom
    }
    return { point1: refined1, point2: closest2 }
  }
}
