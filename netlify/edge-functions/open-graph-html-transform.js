import { HTMLRewriter } from 'https://ghuc.cc/worker-tools/html-rewriter/index.ts'

function spacePreviewImage (spaceId) {
  const cdnHost = 'https://cdn.kinopio.club'
  return `${cdnHost}/${spaceId}/preview-image-${spaceId}.png`
}

// adapted from utils.spaceIdFromUrl
function spaceIdFromUrl (url) {
  const uuidLength = 21
  url = url || window.location.href
  url = url.replaceAll('?hidden=true', '')
  const id = url.substring(url.length - uuidLength, url.length)
  const idIsInvalid = id.includes('/')
  if (!idIsInvalid) { return }
  return id
}

export default async function handler (request, context) {
  const url = new URL(request.url)
  const spaceId = spaceIdFromUrl(url)
  const isAsset = url.pathname.includes('.')
  const isHomepage = url.pathname === '/'
  if (isAsset || isHomepage || !spaceId) {
    return
  }
  const response = await context.next()
  response.headers.set('Cache-Control', 'public, durable, s-maxage=900') // 15 mins expiry
  const rewriter = new HTMLRewriter()
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

  return rewriter.transform(response)
}
