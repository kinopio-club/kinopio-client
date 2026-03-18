import rewriteIndexHtml from './utils/rewriteIndexHtml.js'

const apiHost = 'https://api.kinopio.club'
const siteHost = 'https://kinopio.club'
const timeout = 5000 // 5s
const inviteDescription = 'Work on shared spaces together'
const privateSpaceDescription = 'Space is private or could not be found'

// utils

const spaceIdFromUrl = (url) => {
  const uuidLength = 21
  const path = url.pathname
  const id = path.substring(path.length - uuidLength)
  const idIsInvalid = id.includes('/') || id.includes('.') || id.length !== uuidLength
  if (idIsInvalid) { return }
  console.info('🌷 spaceId', id)
  return id
}

// space

const normalizeResponse = async (response) => {
  const success = [200, 201, 202, 204]
  if (success.includes(response.status)) {
    const data = await response.json()
    return data
  } else {
    throw { response, status: response.status }
  }
}
const spacePublicMeta = async (context, spaceId) => {
  try {
    console.log('❤️❤️❤️❤️ spacePublicMeta', spaceId)
    const url = `${apiHost}/space/${spaceId}/public-meta`
    const response = await fetch(url, { signal: AbortSignal.timeout(timeout) })
    const space = await normalizeResponse(response)
    return space
  } catch (error) {
    console.warn('🚑 spacePublicMeta', error)
    throw { error }
  }
}

// title

const pageTitle = (context, space) => {
  let title
  if (space.name === 'Hello Kinopio') {
    title = 'Kinopio'
  } else if (space.name) {
    title = `${space.name} – Kinopio`
  } else {
    title = 'Kinopio'
  }
  return title
}

// json-ld for crawlers
// https://json-ld.org/

const pageJsonLD = (context, space) => {
  let items = space.cards.concat(space.boxes)
  // sort by y then x for reading order (top-to-bottom, left-to-right)
  items.sort((a, b) => a.y - b.y || a.x - b.x)
  items = items.map(item => {
    return {
      '@type': 'CreativeWork',
      name: item.name
    }
  })
  let jsonLD = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: pageTitle(context, space),
    description: space.description,
    thumbnailUrl: space.previewImage,
    dateCreated: space.createdAt,
    hasPart: items
  }
  jsonLD = JSON.stringify(jsonLD)
  return jsonLD
}

// invites

const urlIsSpaceInvite = (url) => {
  console.log('🌱🌱🌱🌱🌱🌱', url.pathname, url)
  return url.pathname === '/space/invite'
}
const urlIsGroupInvite = (url) => {
  return url.pathname === '/group/invite'
}
const nameFromUrl = (url) => {
  return url.searchParams.get('name') || ''
}

export default async (request, context) => {
  try {
    let url = request.url
    url = url.replaceAll('?hidden=true', '')
    url = new URL(url)
    const requestIsFontFile = url.pathname.startsWidth('/fonts/')
    if (requestIsFontFile) { return }
    console.info('🕊️ edge function request', url)
    const isGroupInvite = urlIsGroupInvite(url)
    const isSpaceInvite = urlIsSpaceInvite(url)
    const name = nameFromUrl(url)
    // group invite url
    console.log('🌱🌱🌱🌱', isGroupInvite, isSpaceInvite)
    if (isGroupInvite) {
      const title = `[Group Invite] ${name}`
      return rewriteIndexHtml({ context, title, description: inviteDescription })
    }
    // space invite url
    if (isSpaceInvite) {
      const title = `[Invite] ${name}`
      return rewriteIndexHtml({ context, title })
    }

    // space url
    // let spaceId
    // if (isGroupInvite || isSpaceInvite) {
    //   spaceId = spaceIdFromUrl(url)

    // } else {
    // no space or space id if group invite
    const spaceId = spaceIdFromUrl(url)
    console.log('💋💋💋💋 is space url', spaceId)

    // }

    if (!spaceId) {
      console.info('👻 edge function skipped')
      return
    }
    const space = await spacePublicMeta(context, spaceId)
    // public space
    if (space) {
      const title = pageTitle(context, space)
      const description = space.description
      const previewImage = space.previewImage
      const jsonLD = pageJsonLD(context, space)
      const canonicalUrl = siteHost + url.pathname
      return rewriteIndexHtml({ context, title, description, previewImage, jsonLD, canonicalUrl })
    // private space
    } else {
      return rewriteIndexHtml({ context, description: privateSpaceDescription })
    }
  } catch (error) {
    console.error('🚑 pageMeta, 👻 skipped', error)
  }
}
