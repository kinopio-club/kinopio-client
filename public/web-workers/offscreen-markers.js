// offscreen cards by direction

self.onmessage = function (event) {
  const { cards, viewport, zoom, scroll } = event.data
  const markerHeight = 16
  const markerWidth = 12
  let newCards = cards.map(card => {
    const xCenter = card.x + (card.width / 2) - (markerWidth / 2)
    const yCenter = card.y + (card.height / 2) - (markerHeight / 2)
    card = {
      id: card.id,
      name: card.name,
      x: Math.round(xCenter * zoom),
      y: Math.round(yCenter * zoom)
    }
    // direction relative to viewport
    card.direction = direction({ card, viewport, scroll })
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

const direction = ({ card, viewport, scroll }) => {
  let x = ''
  let y = ''
  //           │        │
  //                       top-right
  //           │  top   │
  //
  // ─ ─ ─ ─ ─ ┼────y───┼ ─ ─ ─ ─ ─
  //           x        │
  //    left   │Viewport│  right
  //           │        │
  // ─ ─ ─ ─ ─ ┼────────┼ ─ ─ ─ ─ ─
  //
  //           │ bottom │
  //
  //           │        │
  const isPosition = {
    bottom: card.y > (viewport.height + scroll.y),
    top: card.y < scroll.y,
    right: card.x > (viewport.width + scroll.x),
    left: card.x < scroll.x
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
