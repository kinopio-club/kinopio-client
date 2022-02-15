// group cards into overlap groups

self.onmessage = function (event) {
  const offset = 10
  const { cards, viewport, zoom } = event.data
  let newCards = cards.filter(card => {
    if (card.isLocked) { return }
    return isCardInViewport(card, viewport, zoom)
  })
  newCards = newCards.map(card => {
    return {
      id: card.id,
      name: card.name,
      x: card.x,
      y: card.y,
      width: card.width,
      height: card.height
    }
  })
  let groups = [] // [[card1, card2, card5], [card3, card4]]
  newCards.forEach(card => {
    const group = isCardsOverlappingGroup(card, groups)
    if (group) {
      groups[group.index].push(card)
    } else {
      groups.push([card])
    }
  })
  groups = groups.filter(group => group.length > 1)
  groups = groups.map(group => {
    const cards = group.sort((a, b) => {
      return b.x < a.x
    })
    const ids = cards.map(card => card.id)
    return {
      x: cards[0].x - offset,
      y: cards[0].y - offset,
      length: ids.length,
      ids
    }
  })

  self.postMessage(groups)
}

// [[ group [-]]-card2-]
const isCardsOverlappingGroup = (card, groups) => {
  const index = groups.findIndex(groupCards => {
    return groupCards.find(groupCard => {
      const isOverlap = isCardInsideCard(groupCard, card) || isCardInsideCard(card, groupCard)
      return isOverlap
    })
  })
  if (index < 0) { return }
  return { index }
}

// [ group [-card2-]]
const isCardInsideCard = (card1, card2) => {
  const xStart = isBetween({
    value: card1.x,
    min: card2.x,
    max: card2.x + card2.width
  })
  const xEnd = isBetween({
    value: card1.x + card1.width,
    min: card2.x,
    max: card2.x + card2.width
  })
  const yStart = isBetween({
    value: card1.y,
    min: card2.y,
    max: card2.y + card2.height
  })
  const yEnd = isBetween({
    value: card1.y + card1.height,
    min: card2.y,
    max: card2.y + card2.height
  })
  return xStart && xEnd && yStart && yEnd
}

// [ card1 [-]-card2-]
// const isCardsOverlapping = (card1, card2) => {
//   const xStart = isBetween({
//     value: card1.x,
//     min: card2.x,
//     max: card2.x + card2.width
//   })
//   const xEnd = isBetween({
//     value: card1.x + card1.width,
//     min: card2.x,
//     max: card2.x + card2.width
//   })
//   const yStart = isBetween({
//     value: card1.y,
//     min: card2.y,
//     max: card2.y + card2.height
//   })
//   const yEnd = isBetween({
//     value: card1.y + card1.height,
//     min: card2.y,
//     max: card2.y + card2.height
//   })
//   const x = xStart || xEnd
//   const y = yStart || yEnd
//   const isOverlap = x && y
//   return isOverlap
// }

// based on utils.isBetween
const isBetween = ({ value, min, max }) => {
  if (min <= value && value <= max) { return true }
}

// based on utils.isCardInViewport
const isCardInViewport = (card, viewport, zoom) => {
  viewport.width = viewport.width * zoom
  viewport.height = viewport.height * zoom
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
