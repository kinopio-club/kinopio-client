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
const fetchGroupPublicMeta = async (groupId) => {
  const url = `${consts.apiHost()}/group/${groupId}/public-meta`
  try {
    const response = await fetch(url)
    if (response.status !== 200) {
      throw { response, status: response.status }
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.warn('🚑 fetchGroupPublicMeta', error)
  }
}
const spacePreviewImageFromId = (spaceId) => {
  if (!spaceId) { return '' }
  return `${consts.cdnHost}/${spaceId}/preview-image-${spaceId}.jpeg`
}

// update tags

const updateTitle = (title) => {
  document.title = title
  document.querySelector('meta[property="og:title"]').content = title
}
const updateSpaceTitle = (space) => {
  let title
  if (space.name === 'Hello Kinopio') {
    title = 'Kinopio'
  } else if (space.name) {
    title = `${space.name} – Kinopio`
  } else {
    title = 'Kinopio'
  }
  updateTitle(title)
}
const updateImage = (space) => {
  const imageUrl = space.previewImage || spacePreviewImageFromId(space.id) || logo
  document.querySelector('meta[property="og:image"]').content = imageUrl
  document.querySelector('meta[property="og:image:secure_url"]').content = imageUrl
}
const updateDescription = (description) => {
  document.querySelector('meta[property="og:description"]').content = description
  document.querySelector('meta[name="description"]').content = description
}

export default {
  async spaceFromId ({ spaceId, isSpaceInvite }) {
    let path = window.document.location.pathname
    if (!spaceId) {
      const ids = utils.spaceAndCardIdFromPath(path)
      spaceId = ids?.spaceId
    }
    if (!spaceId) { return }
    const space = await fetchSpacePublicMeta(spaceId)
    if (!space) { return }
    let title = `${space.name} – Kinopio`
    if (isSpaceInvite) {
      title = `[Invite] ${title}`
    }
    updateTitle(title)
    let description = defaultDescription
    if (space.privacy === 'private') {
      description = `[Private] ${description}`
    }
    updateDescription(description)
    updateImage(space)
  },

  space (space) {
    space = utils.clone(space)
    const isHelloSpace = space.name === 'Hello Kinopio'
    const imageUrl = space.previewImage || spacePreviewImageFromId(space.id) || logo
    updateSpaceTitle(space)
    updateImage(space)
    // description
    const origin = { x: 0, y: 0 }
    let cards = space.cards.map(card => {
      card.distanceFromOrigin = utils.distanceBetweenTwoPoints(card, origin)
      return card
    })
    cards = cards.filter(card => card.name)
    let boxes = space.boxes?.map(box => {
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
      updateDescription(truncatedDescription)
    }
    // noscript tag
    document.querySelector('noscript').innerHTML = utils.truncated(description, 1000)
    // json-ld for search robots
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
      contentUrl: imageUrl,
      author: {
        '@type': 'Person',
        name: user?.name
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

  async groupInvite ({ groupId, isGroupInvite }) {
    const meta = await fetchGroupPublicMeta(groupId)
    let title = `${meta.name} – Kinopio Group`
    if (isGroupInvite) {
      title = `[Invite] ${title}`
    }
    updateTitle(title)
    document.querySelector('meta[property="og:image"]').content = logo
    let description = 'Work together on shared whiteboards, brainstorms, and diagrams'
    updateDescription(description)
  }
}
