import rewriteIndexHtml from './utils/rewriteIndexHtml.js'

const apiHost = 'https://api.kinopio.club'
const siteHost = 'https://kinopio.club'
const timeout = 5000 // 5s
const inviteDescription = 'Work on shared spaces together'
const staticRoutes = {
  '/api': {
    title: 'Kinopio API Docs',
    description: 'Build your own custom integrations and tools that can create, read, and edit your Kinopio cards and spaces.'
  }
}

// space

const spaceIdFromString = (string) => {
  const uuidLength = 21
  const id = string.substring(string.length - uuidLength)
  const idIsInvalid = id.includes('/') || id.includes('.') || id.length !== uuidLength
  if (idIsInvalid) { return }
  return id
}
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

// escape user-supplied strings before injecting into HTML
const escapeHtml = (string) => {
  if (!string) { return '' }
  return String(string)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

// simplified body content for crawlers
// rendered inside <body> so search engines see card text without executing js

const sortByDistanceFromOrigin = (items) => {
  items = items.map(item => {
    item.distance = Math.sqrt(item.x ** 2 + item.y ** 2)
    return item
  })
  items = items.sort((a, b) => a.distance - b.distance)
  return items
}
const pageBodyContent = (space) => {
  const spaceIsPrivate = !space.cards
  if (spaceIsPrivate) { return }
  let items = space.cards.concat(space.boxes, space.lists)
  items = sortByDistanceFromOrigin(items)
  items.slice(0, 1000)
  const listItems = items
    .map(item => `<li>${escapeHtml(item.name)}</li>`)
    .join('')
  return `<main id="page-meta-body-content" hidden><h1>${escapeHtml(space.name)}</h1><p>${escapeHtml(space.description)}</p><ul>${listItems}</ul></main>`
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
    // normalize or skip url
    let url = request.url
    if (url.includes('netlify-prerender-function')) {
      url = new URL(url).searchParams.get('url')
    }
    url = url.replaceAll('?hidden=true', '')
    url = new URL(url)
    const requestIsFontFile = url.pathname.startsWith('/fonts/')
    if (requestIsFontFile) { return }
    console.info('🕊️ edge function request', url.href)
    const isGroupInvite = url.pathname.startsWith('/group/invite/')
    const isSpaceInvite = url.pathname.startsWith('/space/invite/')
    const staticRoute = staticRoutes[url.pathname]
    const name = nameFromUrl(url)
    // static route url
    if (staticRoute) {
      return rewriteIndexHtml({
        context,
        title: staticRoute.title,
        description: staticRoute.description
      })
    }
    // group invite url
    if (isGroupInvite) {
      return rewriteIndexHtml({
        context,
        title: `[Group Invite] ${name}`,
        description: inviteDescription
      })
    }
    // space invite url
    if (isSpaceInvite) {
      const spaceId = spaceIdFromString(url.pathname)
      const space = await spacePublicMeta(spaceId)
      let inviteLabel = '[Invite]'
      if (url.searchParams.get('readOnlyKey')) {
        inviteLabel = '[Read Only Invite]'
      }
      return rewriteIndexHtml({
        context,
        title: `${inviteLabel} ${pageTitle(space)}`,
        previewImage: space.previewImage,
        description: inviteDescription
      })
    }
    // space url
    const spaceId = spaceIdFromString(url.pathname)
    if (!spaceId) {
      console.info('👻 edge function skipped', url.href)
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
      bodyContent: pageBodyContent(space),
      canonicalUrl: siteHost + url.pathname
    })
  } catch (error) {
    console.error('🚑 pageMeta, 👻 skipped', error)
  }
}
