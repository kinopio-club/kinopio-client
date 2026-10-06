// renders latex math as mathml, using temml

import temmlUrl from 'temml/dist/temml.min.js?url'

// temml is lazy loaded from its prebuilt script instead of being imported,
// because bundling it with vite 8 (rolldown) corrupts the lone surrogate escapes
// in its lexer regex, which breaks every \command

let temmlPromise

const loadTemml = () => {
  temmlPromise = temmlPromise || new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = temmlUrl
    script.onload = () => resolve(window.temml)
    script.onerror = (error) => {
      temmlPromise = null
      reject(error)
    }
    document.head.appendChild(script)
  })
  return temmlPromise
}

export default {
  async renderToString (string) {
    const [temml] = await Promise.all([
      loadTemml(),
      import('temml/dist/Temml-Local.css')
    ])
    return temml.renderToString(string, {
      displayMode: true,
      throwOnError: false
    })
  }
}
