// create viewport card maps

self.onmessage = function (event) {
  const { cards, viewport, zoom } = event.data
  // console.log('🗾', event.data)
  const cardMap = cards.filter(card => {
    if (card.isLocked) { return }
    card = {
      id: card.id,
      x: card.x * zoom,
      y: card.y * zoom,
      width: card.width * zoom,
      height: card.height * zoom,
      isComment: card.isComment
    }
    return isCardInViewport(card, viewport)
  })
  self.postMessage(cardMap)
}

// based on utils.isCardInViewport
const isCardInViewport = (card, viewport) => {
  viewport.width = viewport.width * 2
  viewport.height = viewport.height * 2
  // x
  const isStartInViewportX = card.x > viewport.pageLeft || card.x + card.width > viewport.pageLeft
  const isEndInViewportX = card.x < viewport.pageLeft + viewport.width
  const isInViewportX = isStartInViewportX && isEndInViewportX
  // y
  const isStartInViewportY = card.y > viewport.pageTop || card.y + card.height > viewport.pageTop
  const isEndInViewportY = card.y < viewport.pageTop + viewport.height
  const isInViewportY = isStartInViewportY && isEndInViewportY
  return isInViewportX && isInViewportY
}
