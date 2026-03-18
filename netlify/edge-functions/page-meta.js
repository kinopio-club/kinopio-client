import rewriteIndexHtml from './utils/rewriteIndexHtml.js'

const apiHost = 'https://api.kinopio.club'
const siteHost = 'https://kinopio.club'
const timeout = 5000 // 5s
const inviteDescription = 'Work on shared spaces together'

// utils

const spaceIdFromString = (string) => {
  const uuidLength = 21
  const id = string.substring(string.length - uuidLength)
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
const spacePublicMeta = async (spaceId) => {
  try {
    const url = `${apiHost}/space/${spaceId}/public-meta`
    const response = await fetch(url, { signal: AbortSignal.timeout(timeout) })
    const space = await normalizeResponse(response)
    console.log('❤️❤️❤️❤️ spacePublicMeta', spaceId, apiHost, url, space, response)

    return space
  } catch (error) {
    console.warn('🚑 spacePublicMeta', error)
    throw { error }
  }
}

// title

const pageTitle = (space) => {
  let title
  const spaceIsPrivate = !space.cards
  if (space.name === 'Hello Kinopio') {
    title = 'Kinopio'
  } else if (space.name && spaceIsPrivate) {
    title = `[Private] ${space.name} – Kinopio`
  } else if (space.name) {
    title = `${space.name} – Kinopio`
  } else {
    title = 'Kinopio'
  }
  return title
}

// json-ld for crawlers
// https://json-ld.org/

const pageJsonLD = (space) => {
  if (!space.cards) { return }
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
    name: pageTitle(space),
    description: space.description,
    thumbnailUrl: space.previewImage,
    dateCreated: space.createdAt,
    hasPart: items
  }
  jsonLD = JSON.stringify(jsonLD)
  return jsonLD
}

const nameFromUrl = (url) => {
  return url.searchParams.get('name') || ''
}

// handle url
export default async (request, context) => {
  try {
    let url = request.url
    url = url.replaceAll('?hidden=true', '')
    url = new URL(url)
    const requestIsFontFile = url.pathname.startsWith('/fonts/')
    if (requestIsFontFile) { return }
    console.info('🕊️ edge function request', url)
    const isGroupInvite = url.pathname.startsWith('/group/invite/')
    const isSpaceInvite = url.pathname.startsWith('/space/invite/')
    const name = nameFromUrl(url)
    // group invite url
    console.log('🌱🌱🌱🌱', isGroupInvite, isSpaceInvite)
    if (isGroupInvite) {
      const title = `[Group Invite] ${name}`
      return rewriteIndexHtml({ context, title, description: inviteDescription })
    }
    // space invite url
    if (isSpaceInvite) {
      const spaceId = spaceIdFromString(url.pathname)
      const space = await spacePublicMeta(spaceId)
      console.log('🫐🫐🫐🫐🫐', url.pathname, space)
      return rewriteIndexHtml({
        context,
        title: `[Invite] ${pageTitle(space)}`,
        previewImage: space.previewImage,
        description: inviteDescription
      })
    }
    // space url
    const spaceId = spaceIdFromString(url.pathname)
    console.log('💋💋💋💋 is space url', spaceId)
    if (!spaceId) {
      console.info('👻 edge function skipped')
      return
    }
    const space = await spacePublicMeta(spaceId)
    const { description, previewImage } = space
    return rewriteIndexHtml({
      context,
      title: pageTitle(space),
      description,
      previewImage,
      jsonLD: pageJsonLD(space),
      canonicalUrl: siteHost + url.pathname
    })
  } catch (error) {
    console.error('🚑 pageMeta, 👻 skipped', error)
  }
}
