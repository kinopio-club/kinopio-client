// offscreen cards by direction

self.onmessage = function (event) {
  const { cards, viewport, zoom } = event.data
  const markerHeight = 16
  const markerWidth = 12
  let newCards = cards.map(card => {
    card.x = card.x + (card.width / 2) - (markerWidth / 2)
    card.x = card.x * zoom
    card.y = card.y + (card.height / 2) - (markerHeight / 2)
    card.y = card.y * zoom
    card.direction = direction(card, viewport)
    return card
  })
  newCards = newCards.filter(card => card.direction)
  newCards = normalizeCardsByDirection(newCards)
  self.postMessage(newCards)
}

const normalizeCardsByDirection = (cards) => {
  let normalizedCards = {
    top: [],
    left: [],
    right: [],
    bottom: [],
    topleft: [],
    topright: [],
    bottomleft: [],
    bottomright: []
  }
  cards.forEach(card => {
    normalizedCards[card.direction].push(card)
  })
  return normalizedCards
}

const direction = (card, viewport) => {
  const scrollX = viewport.pageLeft
  const scrollY = viewport.pageTop
  let x = ''
  let y = ''
  //           │        │
  //                       top-right
  //           │  top   │
  //
  // ─ ─ ─ ─ ─ ┼────────┼ ─ ─ ─ ─ ─
  //           │        │
  //    left   │Viewport│  right
  //           │        │
  // ─ ─ ─ ─ ─ ┼────────┼ ─ ─ ─ ─ ─
  //
  //           │ bottom │
  //
  //           │        │
  const isPosition = {
    bottom: card.y > (viewport.height + scrollY),
    top: card.y < scrollY,
    right: card.x > (viewport.width + scrollX),
    left: card.x < scrollX
  }

  if (isPosition.bottom) {
    y = 'bottom'
  } else if (isPosition.top) {
    y = 'top'
  }
  if (isPosition.right) {
    x = 'right'
  } else if (isPosition.left) {
    x = 'left'
  }
  return y + x
}
