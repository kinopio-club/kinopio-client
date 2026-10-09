// Injected into every page by the desktop app.
// App links open in the current window, or in a new tab if shift is held.
// All other links are passed to the native side, which opens them in the system browser.

(() => {
  let shiftKey = false
  const updateShiftKey = (event) => {
    shiftKey = event.shiftKey
  }
  const events = ['keydown', 'keyup', 'pointerdown', 'pointerup', 'click']
  events.forEach(name => window.addEventListener(name, updateShiftKey, true))
  window.addEventListener('blur', () => {
    shiftKey = false
  })

  // Browsers on macOS don't send keyup for keys pressed while cmd is held, but the webview does.
  // Without this, cmd-t (new tab) would also trigger the app's 't' keyup shortcut.
  const metaKeyCodes = new Set()
  window.addEventListener('keydown', (event) => {
    if (event.metaKey) {
      metaKeyCodes.add(event.code)
    } else {
      metaKeyCodes.delete(event.code)
    }
  }, true)
  window.addEventListener('keyup', (event) => {
    if (!metaKeyCodes.has(event.code)) { return }
    metaKeyCodes.delete(event.code)
    event.stopImmediatePropagation()
  }, true)
  window.addEventListener('blur', () => {
    metaKeyCodes.clear()
  })

  // The webview goes back in history when backspace is pressed outside of a text field, browsers don't.
  // The event still reaches the app, so backspace shortcuts keep working.
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Backspace') { return }
    if (!event.target.closest) { return }
    const isTextField = event.target.closest('input, textarea, select, [contenteditable]')
    if (isTextField) { return }
    event.preventDefault()
  }, true)

  const isWebUrl = (url) => {
    return url.protocol === 'http:' || url.protocol === 'https:'
  }
  const isAppUrl = (url) => {
    return url.origin === window.location.origin
  }

  // window.open requests are handled natively: app urls become tabs, other urls open in the system browser
  const nativeOpen = window.open.bind(window)

  window.open = (url, ...args) => {
    if (!url) {
      return nativeOpen(url, ...args)
    }
    const resolvedUrl = new URL(url, window.location.href)
    if (isAppUrl(resolvedUrl) && !shiftKey) {
      window.location.assign(resolvedUrl.href)
      return null
    }
    return nativeOpen(resolvedUrl.href, ...args)
  }

  // bubble phase, so that links the app has already handled are left alone
  window.addEventListener('click', (event) => {
    if (event.defaultPrevented) { return }
    if (event.button !== 0) { return }
    if (!event.target.closest) { return }
    const link = event.target.closest('a[href]')
    if (!link) { return }
    if (link.hasAttribute('download')) { return }
    const url = new URL(link.href, window.location.href)
    if (!isWebUrl(url)) { return }
    if (!isAppUrl(url)) {
      event.preventDefault()
      nativeOpen(url.href)
      return
    }
    if (event.shiftKey) {
      event.preventDefault()
      nativeOpen(url.href)
      return
    }
    if (link.target === '_blank') {
      event.preventDefault()
      window.location.assign(url.href)
    }
  })
})()
