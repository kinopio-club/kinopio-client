// calculates offscreen card marker positions

// output: markers: {} // top: [], left, right, bottom

// goal: simplify component getting direction
// remove use of this.offscreenCards from component, less computed work

self.onmessage = function (event) {
  // const { cards, viewport, zoom } = event.data
  console.log('🗾', event.data)

  // const markerHeight = 16
  // const markerWidth = 12
  // cards = cards.map(card => {
  //   const element = document.querySelector(`article [data-card-id="${card.id}"]`)
  //   if (!element) { return card }
  //   const rect = element.getBoundingClientRect()
  //   // TODO convert to use card width and height
  //   card.x = card.x + (rect.width / 2) - (markerWidth / 2)
  //   card.x = card.x * zoom
  //   card.y = card.y + (rect.height / 2) - (markerHeight / 2)
  //   card.y = card.y * zoom
  //   card.direction = direction(card)
  //   return card
  // })
  // // postmessage this
  // const offscreenCards = cards || []

  self.postMessage(event.data)
}

// const direction = (card, viewport) => {
//   // this.viewport = utils.visualViewport()
//   const scrollX = viewport.pageLeft
//   const scrollY = viewport.pageTop
//   let x = ''
//   let y = ''
//   //           │        │
//   //                       top-right
//   //           │  top   │
//   //
//   // ─ ─ ─ ─ ─ ┼────────┼ ─ ─ ─ ─ ─
//   //           │        │
//   //    left   │Viewport│  right
//   //           │        │
//   // ─ ─ ─ ─ ─ ┼────────┼ ─ ─ ─ ─ ─
//   //
//   //           │ bottom │
//   //
//   //           │        │

//   if (card.y > (viewport.height + scrollY)) {
//     y = 'bottom'
//   } else if (card.y < scrollY) {
//     y = 'top'
//   }
//   if (card.x > (viewport.width + scrollX)) {
//     x = 'right'
//   } else if (card.x < scrollX) {
//     x = 'left'
//   }
//   return y + x
// }
