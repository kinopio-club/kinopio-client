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
const windowSpaceTitle = (space) => {
  let title
  if (space.name === 'Hello Kinopio') {
    title = 'Kinopio'
  } else if (space.name) {
    title = `${space.name} – Kinopio`
  } else {
    title = 'Kinopio'
  }
  document.title = title
}

export default {
  async spaceFromId ({ spaceId, isSpaceInvite }) {
    let path = window.document.location.pathname
    if (!spaceId) {
      const ids = utils.spaceAndCardIdFromPath(path)
      spaceId = ids?.spaceId
    }
    if (!spaceId) { return }
    const meta = await fetchSpacePublicMeta(spaceId)
    if (!meta) { return }
    // title
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
    // description
    document.querySelector('meta[property="og:description"]').content = description
    document.querySelector('meta[name="description"]').content = description
    // iamge
    const imageUrl = meta.previewImage || logo || spacePreviewImageFromId(spaceId)
    document.querySelector('meta[property="og:image"]').content = imageUrl
    document.querySelector('meta[property="og:image:secure_url"]').content = imageUrl
  },
  space (space) {
    space = utils.clone(space)
    const isHelloSpace = space.name === 'Hello Kinopio'
    // title
    windowSpaceTitle(space)
    // image
    const imageUrl = space.previewImage || spacePreviewImageFromId(space.id)
    document.querySelector('meta[property="og:image"]').content = imageUrl
    document.querySelector('meta[property="og:image:secure_url"]').content = imageUrl
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
      document.querySelector('meta[property="og:description"]').content = truncatedDescription
      document.querySelector('meta[name="description"]').content = truncatedDescription
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
    let name = `${meta.name} – Kinopio Group`
    if (isGroupInvite) {
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
