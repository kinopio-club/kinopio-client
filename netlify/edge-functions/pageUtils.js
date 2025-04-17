import { HTMLRewriter } from 'https://ghuc.cc/worker-tools/html-rewriter/index.ts'

const cacheExpiry = 3600 // 3600s = 1 hour

const imageType = (previewImage) => {
  // https://cdn.kinopio.club/image.jpg → jpg
  const extension = previewImage.split('.').pop().toLowerCase()
  return `image/${extension}`
}

export default {
  async rewriteIndexHTML ({ context, previewImage, title, description, jsonLD }) {
    const response = await context.next()
    response.headers.set('Cache-Control', `public, durable, s-maxage=${cacheExpiry}`)
    const transformations = [
      // og:image
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
      },
      // title
      {
        selector: 'title',
        transform: element => { element.innerText = title }
      },
      {
        selector: 'meta[property="og:title"]',
        transform: element => element.setAttribute('content', title)
      },
      // description
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
    ]
    // json-ld for search robots
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
  }
}
