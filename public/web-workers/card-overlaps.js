// group cards into overlap groups

// ..1 card can belong to 1 gruop,
// mrege groups

self.onmessage = function (event) {
  const { cards, viewport } = event.data
  // todo should use zoom from event.data ??
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

  newCards.forEach(card1 => {
    newCards.forEach(card2 => {
      if (card1.id === card2.id) { return }

      const isOverlap = isCardsOverlapping(card1, card2)
      if (isOverlap) {
        groups = updateGroups(groups, card1, card2)
      }
    })
  })
  console.log('🍉', groups)
  // self.postMessage(groups)
}

const updateGroups = (groups, card1, card2) => {
  const index1 = existingGroupIndex(groups, card1)
  const index2 = existingGroupIndex(groups, card2)
  console.log('🥳', index1, index2)
  // let index = undefined
  let index, card
  if (typeof index1 === 'number' && typeof index2 === 'number') {
    return groups
  } else if (typeof index1 === 'number') {
    index = index1
    card = card2
  } else if (typeof index2 === 'number') {
    index = index2
    card = card1
  }
  if (typeof index === 'number') {
    console.log('🍆 existing', index, card, groups[index])
    groups[index].push(card)
  } else {
    console.log('⏰ new', index, card1, card2)
    groups.push([card1, card2])
  }
  return groups
}

// const isIndex = (index) => {
//   // if (index !== 'number') { return }
//   if (index < 0) { return }
//   return true
// }

const existingGroupIndex = (groups, card) => {
  const index = groups.findIndex(group => {
    const cardIds = group.map(prevCard => prevCard.id)
    return cardIds.includes(card.id)
  })
  if (index < 0) { return }
  return index
}

const isCardsOverlapping = (card1, card2) => {
  const isOverlapX = isBetween({
    value: card1.x,
    min: card2.x,
    max: card2.x + card2.width
  })
  const isOverlapY = isBetween({
    value: card1.y,
    min: card2.y,
    max: card2.y + card2.height
  })
  return isOverlapX && isOverlapY
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

// card1 overlaps card2:1

// group = [cards]

// if (!overlaps.length) { return }
// let group = {
//   cardId: card1.id,
//   cardName: card1.name,
//   overlaps
// }
// groups.push(group)

// const threshold = 20
// let cards = this.cards.map((card, index) => {
//   return { id: card.id, x: card.x, y: card.y, index }
// })
// let overlaps = []
// cards.forEach(origin => {
//   if (!origin) { return }
//   const group = cards.filter((card, index) => {
//     if (!card) { return }
//     const x = utils.isBetween({
//       value: origin.x,
//       min: card.x - threshold,
//       max: card.x + threshold
//     })
//     const y = utils.isBetween({
//       value: origin.y,
//       min: card.y - threshold,
//       max: card.y + threshold
//     })
//     return x && y
//   })
//   group.forEach(card => {
//     cards[card.index] = undefined
//   })
//   overlaps.push(group)
// })
// overlaps = overlaps.filter(group => group.length > 1)
// overlaps = overlaps.map(group => {
//   let { x, y } = group.reduce((previousValue, currentValue) => this.mergeOverlapGroup(previousValue, currentValue))
//   let ids = group.map(item => item.id)
//   x = x - (threshold / 2)
//   y = y - (threshold / 2)
//   return { x, y, length: group.length, ids }
// })
// return overlaps
