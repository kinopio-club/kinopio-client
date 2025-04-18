import rewriteIndexHtml from './utils/rewriteIndexHtml.js'

const timeout = 600 // 600s = 10 mins

const inviteDescription = 'Work on shared spaces together'
const privateSpaceDescription = 'Space is private or could not be found'

// utils

const isDevelopment = (context) => {
  console.log('🍎🍎🍎🍎', context.env, process.env, context.env.VITE_PROD_SERVER, context.env.MODE)
  if (context.env.VITE_PROD_SERVER === 'true') {
    return false
  } else {
    return (context.env.MODE === 'development')
  }
}
const apiHost = (context) => {
  let host = 'https://api.kinopio.club'
  if (isDevelopment(context)) {
    host = 'https://kinopio.local:3000'
  }
  return host
}
const spaceIdFromUrl = (url) => {
  const uuidLength = 21
  const id = url.substring(url.length - uuidLength, url.length)
  const idIsInvalid = id.includes('/')
  if (!idIsInvalid) { return }
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
  const url = `${apiHost(context)}/space/${spaceId}/public-meta`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(url, { signal: controller.signal })
    const space = await normalizeResponse(response)
    return space
  } catch (error) {
    console.warn('🚑 spacePublicMeta', error)
    clearTimeout(timeoutId)
    return null
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
  if (isDevelopment(context)) {
    title = `DEV ${title}`
  }
  return title
}

// json-ld for crawlers
// https://json-ld.org/

const pageJsonLD = (context, space) => {
  let items = space.cards.concat(space.boxes)
  items = items.map(item => {
    return {
      '@type': 'CreativeWork',
      name: item.name,
      position: {
        '@type': 'Place',
        x: item.x,
        y: item.y
      }
    }
  })
  let jsonLD = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: pageTitle(context, space),
    description: space.description,
    dateCreated: space.createdAt,
    contentUrl: space.previewImage,
    hasPart: {
      '@type': 'ItemList',
      itemListElement: items
    }
  }
  jsonLD = JSON.stringify(jsonLD)
  return jsonLD
}

// invites

const urlIsSpaceInvite = (url) => {
  return url.pathname === '/invite'
}
const urlIsGroupInvite = (url) => {
  return url.pathname === '/group/invite'
}
const nameFromUrl = (url) => {
  return url.searchParams.get('name')
}

export default async (request, context) => {
  try {
    let url = request.url
    console.info('🕊️ edge function request', url)
    url = url.replaceAll('?hidden=true', '')
    url = new URL(url)
    const spaceId = spaceIdFromUrl(request.url)
    const isAsset = url.pathname.includes('.')
    const isHomepage = url.pathname === '/'
    if (isAsset || isHomepage || !spaceId) {
      return
    }
    // group invite url
    const isGroupInvite = urlIsGroupInvite(url)
    if (isGroupInvite) {
      const groupName = nameFromUrl(url)
      const title = `[Group Invite] ${groupName}`
      return rewriteIndexHtml({ context, title, description: inviteDescription })
    }
    // space invite url
    const isSpaceInvite = urlIsSpaceInvite(url)
    if (isSpaceInvite) {
      const spaceName = nameFromUrl(url)
      const title = `[Invite] ${spaceName}`
      return rewriteIndexHtml({ context, title, description: inviteDescription })
    }
    // space url
    const space = await spacePublicMeta(context, spaceId)
    // public space
    if (space) {
      const title = pageTitle(context, space)
      const description = space.description
      const previewImage = space.previewImage
      const jsonLD = pageJsonLD(context, space)
      return rewriteIndexHtml({ context, title, description, previewImage, jsonLD })
    // private space
    } else {
      return rewriteIndexHtml({ context, description: privateSpaceDescription })
    }
  } catch (error) {
    console.error('🚑 pageMeta', error)
  }
}

// todo # test dev urls
// space invite: https://kinopio.club/invite?spaceId=ID&collaboratorKey=ID&name=packing-list---
// group invite: https://kinopio.club/group/invite?groupId=ID&collaboratorKey=ID&name=warecats
// space url: ...
