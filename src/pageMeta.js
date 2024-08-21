import utils from '@/utils.js'
import consts from '@/consts.js'
import sortBy from 'lodash-es/sortBy'

const logo = 'https://updates.kinopio.club/logo-social-media-avatar.png'
const defaultDescription = 'A space to whiteboard, moodboard, brainstorm, and take notes'

const fetchSpacePublicMeta = async (spaceId) => {
  const url = `${consts.apiHost()}/space/${spaceId}/public-meta`
  try {
    const response = await fetch(url)
    if (response.status !== 200) {
      throw { response, status: response.status }
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.warn('🚑 fetchSpacePublicMeta', error)
  }
}
const fetchTeamPublicMeta = async (teamId) => {
  const url = `${consts.apiHost()}/team/${teamId}/public-meta`
  try {
    const response = await fetch(url)
    if (response.status !== 200) {
      throw { response, status: response.status }
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.warn('🚑 fetchTeamPublicMeta', error)
  }
}

export default {
  async space ({ spaceId, isSpaceInvite }) {
    let path = window.document.location.pathname
    if (!spaceId) {
      const ids = utils.spaceAndCardIdFromPath(path)
      spaceId = ids?.spaceId
    }
    if (!spaceId) { return }
    const meta = await fetchSpacePublicMeta(spaceId)
    if (!meta) { return }
    let name = `${meta.name} – Kinopio`
    if (isSpaceInvite) {
      name = `[Invite] ${name}`
    }
    let description = defaultDescription
    if (meta.privacy === 'private') {
      description = `[Private] ${description}`
    }
    document.title = name
    document.querySelector('meta[property="og:title"]').content = name
    document.querySelector('meta[property="og:image"]').content = meta.previewImage || logo
    document.querySelector('meta[property="og:description"]').content = description
    document.querySelector('meta[name="description"]').content = description
  },
  update (space) {
    const isHelloSpace = space.name === 'Hello Kinopio'
    const origin = { x: 0, y: 0 }
    let cards = space.cards.map(card => {
      card.distanceFromOrigin = utils.distanceBetweenTwoPoints(card, origin)
      return card
    })
    cards = cards.filter(card => card.name)

    let boxes = space.boxes.map(box => {
      box.distanceFromOrigin = utils.distanceBetweenTwoPoints(box, origin)
      return box
    })
    boxes = boxes.filter(box => box.name)
    let items = cards.concat(boxes)
    items = sortBy(items, 'distanceFromOrigin')
    let description = items.map(item => item.name)
    description = description.join(', ')
    // description tags
    if (!isHelloSpace) {
      const truncatedDescription = utils.truncated(description, 150)
      document.querySelector('meta[property="og:description"]').content = truncatedDescription
      document.querySelector('meta[name="description"]').content = truncatedDescription
    }
    // noscript tag
    document.querySelector('noscript').innerHTML = utils.truncated(description, 1000)
    // json-ld
    let user = {}
    if (space.users) {
      user = space.users[0]
    }
    items = items.map(item => {
      return {
        '@type': 'CreativeWork',
        name: utils.sanitizeString(item.name),
        position: {
          '@type': 'Place',
          x: item.x,
          y: item.y
        }
      }
    })
    items = items.slice(0, 20)
    let jsonLD = {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: `${space.name} – Kinopio`,
      description: defaultDescription,
      dateCreated: space.createdAt,
      author: {
        '@type': 'Person',
        name: user.name
      },
      hasPart: {
        '@type': 'ItemList',
        itemListElement: items
      }
    }
    jsonLD = JSON.stringify(jsonLD)
    const scriptTag = document.createElement('script')
    scriptTag.type = 'application/ld+json'
    scriptTag.text = jsonLD
    document.head.appendChild(scriptTag)
  },
  async team ({ teamId, isTeamInvite }) {
    const meta = await fetchTeamPublicMeta(teamId)
    let name = `${meta.name} – Kinopio Team`
    if (isTeamInvite) {
      name = `[Invite] ${name}`
    }
    let description = 'Work together on shared whiteboards, brainstorms, and diagrams'
    document.title = name
    document.querySelector('meta[property="og:title"]').content = name
    document.querySelector('meta[property="og:image"]').content = logo
    document.querySelector('meta[property="og:description"]').content = description
    document.querySelector('meta[name="description"]').content = description
  }
}
