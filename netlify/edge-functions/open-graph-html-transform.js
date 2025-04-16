import { HTMLRewriter } from 'https://ghuc.cc/worker-tools/html-rewriter/index.ts'

const cdnHost = 'https://cdn.kinopio.club'

function spacePreviewImage (spaceId) {
  return `${cdnHost}/${spaceId}/preview-image-${spaceId}.jpeg`
}

export default async function handler (request, context) {
  const url = new URL(request.url)

  // Assets
  if (url.pathname.includes('.')) {
    return
  }

  if (url.pathname === '/') {
    return
  }

  const spaceId = url.pathname.split('-').pop()

  if (!spaceId) {
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
