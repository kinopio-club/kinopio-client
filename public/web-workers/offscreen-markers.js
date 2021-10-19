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

  if (card.y > (viewport.height + scrollY)) {
    y = 'bottom'
  } else if (card.y < scrollY) {
    y = 'top'
  }
  if (card.x > (viewport.width + scrollX)) {
    x = 'right'
  } else if (card.x < scrollX) {
    x = 'left'
  }
  return y + x
}
