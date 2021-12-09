// group cards into overlap groups

self.onmessage = function (event) {
  const { cards, viewport } = event.data
  let newCards = cards.filter(card => isCardInViewport(card, viewport))
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
  self.postMessage(groups)
}

const isCardsOverlappingGroup = (card, groups) => {
  const index = groups.findIndex(groupCards => {
    return groupCards.find(groupCard => {
      const isOverlap = isCardsOverlapping(groupCard, card) || isCardsOverlapping(card, groupCard)
      return isOverlap
    })
  })
  if (index < 0) { return }
  return { index }
}

const isCardsOverlapping = (card1, card2) => {
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
    value: card1.y,
    min: card2.y,
    max: card2.y + card2.height
  })
  const x = xStart || xEnd
  const y = yStart || yEnd
  return x && y
}

// based on utils.isBetween
const isBetween = ({ value, min, max }) => {
  if (min <= value && value <= max) { return true }
}

// based on utils.isCardInViewport
const isCardInViewport = (card, viewport) => {
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
