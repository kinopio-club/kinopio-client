import { HTMLRewriter } from 'https://ghuc.cc/worker-tools/html-rewriter/index.ts'

const cacheExpiry = 3600 // 3600s = 1 hour
const timeout = 600 // 600s = 10 mins

// utils

const isDevelopment = (context) => {
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
  url = url || window.location.href
  url = url.replaceAll('?hidden=true', '')
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
    const space = normalizeResponse(response)
    return space
  } catch (error) {
    console.warn('🚑 spacePublicMeta', error)
    clearTimeout(timeoutId)
    return null
  }
}

// image

const imageType = (previewImage) => {
  // https://cdn.kinopio.club/image.jpg → jpg
  const extension = previewImage.split('.').pop().toLowerCase()
  return `image/${extension}`
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

// json-ld

const jsonLD = (context, space) => {
  // normalize items
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
  // return
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

export default async (request, context) => {
  try {
    const url = new URL(request.url)

    // TODO handle
    // utils.urlIsSpaceInvite
    // utils.urlIsGroupInvite

    const spaceId = spaceIdFromUrl(url)
    const isAsset = url.pathname.includes('.')
    const isHomepage = url.pathname === '/'
    if (isAsset || isHomepage || !spaceId) {
      return
    }
    const space = await spacePublicMeta(context, spaceId)
    if (!space) { return }
    const response = await context.next()
    response.headers.set('Cache-Control', `public, durable, s-maxage=${cacheExpiry}`)

    const rewriter = new HTMLRewriter()

    // og:image

      .on('meta[property="og:image"]', {
        element: (element) => {
          element.setAttribute('content', space.previewImage)
        }
      })
      .on('meta[property="og:image:width"]', {
        element: (element) => {
          element.setAttribute('content', '1200')
        }
      })
      .on('meta[property="og:image:height"]', {
        element: (element) => {
          element.setAttribute('content', '630')
        }
      })
      .on('meta[property="og:image:type"]', {
        element: (element) => {
          element.setAttribute('content', imageType(space.previewImage))
        }
      })

    // title

      .on('title', {
        element: (element) => {
          element.innerText = pageTitle(context, space)
        }
      })
      .on('meta[property="og:title"]', {
        element: (element) => {
          element.setAttribute('content', pageTitle(context, space))
        }
      })

    // description

      .on('meta[property="og:description"]', {
        element: (element) => {
          element.setAttribute('content', space.description)
        }
      })
      .on('meta[name="description"]', {
        element: (element) => {
          element.setAttribute('content', space.description)
        }
      })
      .on('noscript', {
        element: (element) => {
          element.innerText = space.description
        }
      })

    // json-ld for search robots

      .on('script[type="application/ld+json"]', {
        element: (element) => {
          element.setAttribute('text', jsonLD(context, space))
        }
      })

    return rewriter.transform(response)
  } catch (error) {
    console.error('🚒 fetchWithTimeout', error)
  }
}

// todo # test dev urls
// space invite: https://kinopio.club/invite?spaceId=ID&collaboratorKey=ID&name=packing-list---
// group invite: https://kinopio.club/group/invite?groupId=ID&collaboratorKey=ID&name=warecats
