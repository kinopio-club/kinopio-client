// cards into overlap groups

// ..1 card can belong to multiple gruops

self.onmessage = function (event) {
  console.log('🌙🌙', event, event.data)
  // const { cards, viewport, zoom } = event.data
  // const markerHeight = 16
  // const markerWidth = 12
  // let newCards = cards.map(card => {
  //   card.x = card.x + (card.width / 2) - (markerWidth / 2)
  //   card.x = card.x * zoom
  //   card.y = card.y + (card.height / 2) - (markerHeight / 2)
  //   card.y = card.y * zoom
  //   card.direction = direction(card, viewport)
  //   return card
  // })
  // newCards = newCards.filter(card => card.direction)
  // newCards = normalizeCardsByDirection(newCards)
  // self.postMessage(groups) // return overlap groups

  // const cardMap = cards.filter(card => {
  //   card = {
  //     id: card.id,
  //     x: card.x * zoom,
  //     y: card.y * zoom,
  //     width: card.width * zoom,
  //     height: card.height * zoom
  //   }
  //   return isCardInViewport(card, viewport)
  // })
}

// const normalizeCardsByDirection = (cards) => {
//   let normalizedCards = {
//     top: [],
//     left: [],
//     right: [],
//     bottom: [],
//     topleft: [],
//     topright: [],
//     bottomleft: [],
//     bottomright: []
//   }
//   cards.forEach(card => {
//     normalizedCards[card.direction].push(card)
//   })
//   return normalizedCards
// }
