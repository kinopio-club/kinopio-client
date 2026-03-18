import rewriteIndexHtml from './utils/rewriteIndexHtml.js'

const apiHost = 'https://api.kinopio.club'
const siteHost = 'https://kinopio.club'
const timeout = 5000 // 5s
const inviteDescription = 'Work on shared spaces together'

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

// invites

// const urlIsSpaceInvite = (url) => {
//   console.log('🌱🌱🌱🌱🌱🌱', url.pathname, url)
//   return
// }
// const urlIsGroupInvite = (url) => {
//   return url.pathname === '/group/invite'
// }
const nameFromUrl = (url) => {
  return url.searchParams.get('name') || ''
}

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
      // TODO get space ,
      // const spaceId =
      console.log('🫐🫐🫐🫐🫐', url.pathname)
      const spaceId = spaceIdFromUrl(url.pathname)
      const space = await spacePublicMeta(spaceId)
      const title = `[Invite] ${space.name || name}` // real space title
      const previewImage = space.previewImage

      // const previewImage = space.previewImage
      // description: inviteDescription
      return rewriteIndexHtml({ context, title, previewImage })
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
    const space = await spacePublicMeta(spaceId)
    // if (space) {
    const title = pageTitle(space)
    const description = space.description
    const previewImage = space.previewImage
    const jsonLD = pageJsonLD(space)
    const canonicalUrl = siteHost + url.pathname
    return rewriteIndexHtml({ context, title, description, previewImage, jsonLD, canonicalUrl })
    // // private space
    // } else {
    //   return rewriteIndexHtml({ context, description: privateSpaceDescription })
    // }
  } catch (error) {
    console.error('🚑 pageMeta, 👻 skipped', error)
  }
}
