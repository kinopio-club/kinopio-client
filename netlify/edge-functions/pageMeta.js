import utils from '../../src/utils.js'
import consts from '../../src/consts.js'

import { HTMLRewriter } from 'https://ghuc.cc/worker-tools/html-rewriter/index.ts'

const cacheExpiry = 3600 // 3600s = 1 hour
const timeout = 600 // 600s = 10 mins

const results = {} // { id: {name, desc, previewImage} }

// const isDevelopment = (context) => {
//   if (context.env.VITE_PROD_SERVER === 'true') {
//     return false
//   } else {
//     return (context.env.MODE === 'development')
//   }
// }

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
  const url = `${consts.apiHost()}/space/${spaceId}/public-meta`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(url, { signal: controller.signal })
    return normalizeResponse(response)
  } catch (error) {
    console.warn('🚑 spacePublicMeta', error)
    clearTimeout(timeoutId)
    return null
  }
}

// to utils.spacePreviewImageFromId, as fallback to
const spacePreviewImage = (spaceId) => {
  const cdnHost = 'https://cdn.kinopio.club'
  return `${cdnHost}/${spaceId}/preview-image-${spaceId}.png`
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

export default async (request, context) => {
  try {
    const url = new URL(request.url)

    // space invite: https://kinopio.club/invite?spaceId=ID&collaboratorKey=ID&name=packing-list---
    // group invite: https://kinopio.club/group/invite?groupId=ID&collaboratorKey=ID&name=warecats

    // utils.urlIsSpaceInvite
    // utils.urlIsGroupInvite
    // utils.urlIsSpace

    const spaceId = spaceIdFromUrl(url)
    const isAsset = url.pathname.includes('.')
    const isHomepage = url.pathname === '/'
    if (isAsset || isHomepage || !spaceId) {
      return
    }

    const space = await spacePublicMeta(spaceId)
    if (!space) { return }

    // const urlIsInvite

    // const space = await API public space meta
    // fetch w timeout

    const response = await context.next()
    response.headers.set('Cache-Control', `public, durable, s-maxage=${cacheExpiry}`)

    const rewriter = new HTMLRewriter()
      // og:image
      .on('meta[property="og:image"]', {
        element: (element) => {
          element.setAttribute('content', spacePreviewImage(spaceId))
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
          element.setAttribute('content', 'image/png')
        }
      })
      // title
      // description, if !space = space is private or could not be found

    return rewriter.transform(response)
  } catch (error) {
    console.error('🚒 fetchWithTimeout', error)
  }
}
