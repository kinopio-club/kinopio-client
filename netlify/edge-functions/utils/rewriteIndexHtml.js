import { HTMLRewriter } from 'https://ghuc.cc/worker-tools/html-rewriter/index.ts' // html-rewriter will cause the build to fail if cloudflare is down

const cacheExpiry = 3600 // 3600s = 1 hour

const imageType = (previewImage) => {
  // https://cdn.kinopio.club/image.jpg → jpg
  const extension = previewImage.split('.').pop().toLowerCase()
  return `image/${extension}`
}

export default async ({ context, title, description, previewImage, jsonLD }) => {
  console.log('🔮 rewriteIndexHtml', { title, description, previewImage })
  try {
    const response = await context.next()
    // check if response is valid HTML
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('text/html')) {
      console.log('🚑 Skipping non-HTML response:', contentType)
      return response
    }
    // check if response is successful
    if (!response.ok) {
      console.log('🚑 Response not OK:', response.status)
      return response
    }
    // set meta
    response.headers.set('Cache-Control', `public, durable, s-maxage=${cacheExpiry}`)
    let transformations = []
    // title
    if (title) {
      transformations = transformations.concat([
        {
          selector: 'title',
          transform: element => { element.innerText = title }
        },
        {
          selector: 'meta[property="og:title"]',
          transform: element => element.setAttribute('content', title)
        }
      ])
    }
    // description
    if (description) {
      transformations = transformations.concat([
        {
          selector: 'meta[property="og:description"]',
          transform: element => element.setAttribute('content', description)
        },
        {
          selector: 'meta[name="description"]',
          transform: element => element.setAttribute('content', description)
        },
        {
          selector: 'noscript',
          transform: element => { element.innerText = description }
        }
      ])
    }
    // image
    if (previewImage) {
      transformations = transformations.concat([
        {
          selector: 'meta[property="og:image"]',
          transform: element => element.setAttribute('content', previewImage)
        },
        {
          selector: 'meta[property="og:image:width"]',
          transform: element => element.setAttribute('content', '1200')
        },
        {
          selector: 'meta[property="og:image:height"]',
          transform: element => element.setAttribute('content', '630')
        },
        {
          selector: 'meta[property="og:image:type"]',
          transform: element => element.setAttribute('content', imageType(previewImage))
        }
      ])
    }
    // json-ld
    if (jsonLD) {
      transformations.push({
        selector: 'script[type="application/ld+json"]',
        transform: element => element.setAttribute('text', jsonLD)
      })
    }
    const rewriter = transformations.reduce((rewriter, { selector, transform }) => {
      return rewriter.on(selector, { element: transform })
    }, new HTMLRewriter())
    return rewriter.transform(response)
  } catch (error) {
    console.error('🚒 rewriteIndexHtml', error)
    return await context.next()
  }
}
