// Injected into every page by the desktop app.
// App links open in the current window, or in a new tab if shift, cmd, or ctrl is held.
// All other links are passed to the native side, which opens them in the system browser.

(() => {
  // the app checks cmd and ctrl for new tabs, shift is the desktop app's own shortcut
  const isNewTabEvent = (event) => {
    return event.shiftKey || event.metaKey || event.ctrlKey
  }
  let isNewTabKey = false
  const updateIsNewTabKey = (event) => {
    isNewTabKey = isNewTabEvent(event)
  }
  const events = ['keydown', 'keyup', 'pointerdown', 'pointerup', 'click']
  events.forEach(name => window.addEventListener(name, updateIsNewTabKey, true))
  window.addEventListener('blur', () => {
    isNewTabKey = false
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
  // static pages on the website that aren't part of the app, they open in the system browser.
  // this is PAGE_PATHS from lib.rs, which adds it to the page before this script runs
  const pagePaths = window.kinopioDesktopPagePaths
  const isPageUrl = (url) => {
    const firstPathSegment = url.pathname.split('/')[1]
    return pagePaths.includes(firstPathSegment)
  }
  // this is APP_HOSTS from lib.rs. The current page's origin can't be used to recognize kinopio urls,
  // because this script also runs on other pages that are shown in the app, like stripe checkout
  const appHosts = window.kinopioDesktopAppHosts
  const isKinopioUrl = (url) => {
    return appHosts.includes(url.hostname)
  }
  const isAppUrl = (url) => {
    if (!isKinopioUrl(url)) { return false }
    return !isPageUrl(url)
  }

  // window.open requests are handled natively: app urls become tabs, other urls open in the system browser
  const nativeOpen = window.open.bind(window)

  window.open = (url, ...args) => {
    if (!url) {
      return nativeOpen(url, ...args)
    }
    const resolvedUrl = new URL(url, window.location.href)
    if (isAppUrl(resolvedUrl) && !isNewTabKey) {
      window.location.assign(resolvedUrl.href)
      return null
    }
    return nativeOpen(resolvedUrl.href, ...args)
  }

  // links to static pages are caught in the capture phase, before the app's router can handle them
  window.addEventListener('click', (event) => {
    if (event.button !== 0) { return }
    if (!event.target.closest) { return }
    const link = event.target.closest('a[href]')
    if (!link) { return }
    const url = new URL(link.href, window.location.href)
    if (!isKinopioUrl(url)) { return }
    if (!isPageUrl(url)) { return }
    event.preventDefault()
    event.stopPropagation()
    nativeOpen(url.href)
  }, true)

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
    // other sites shown in the app, like stripe checkout, can move between their own pages
    const isOtherSite = !isKinopioUrl(window.location)
    if (isOtherSite && url.origin === window.location.origin) { return }
    if (!isAppUrl(url)) {
      event.preventDefault()
      nativeOpen(url.href)
      return
    }
    // the webview's own cmd-click handling blanks the page instead of opening a tab
    if (isNewTabEvent(event)) {
      event.preventDefault()
      nativeOpen(url.href)
      return
    }
    if (link.target === '_blank') {
      event.preventDefault()
      window.location.assign(url.href)
    }
  })

  // Shows the url of the hovered link in the bottom left, like the status bar in a browser.
  // Uses the app's theme colors when they're available.
  let linkStatus
  const linkStatusElement = () => {
    if (linkStatus) { return linkStatus }
    linkStatus = document.createElement('div')
    Object.assign(linkStatus.style, {
      position: 'fixed',
      left: '0',
      bottom: '0',
      zIndex: '2147483647',
      maxWidth: '60%',
      padding: '2px 6px',
      font: '11px -apple-system, system-ui, sans-serif',
      color: 'var(--primary, #000)',
      background: 'var(--secondary-background, #e3e3e3)',
      border: '1px solid var(--primary-border, #bbb)',
      borderLeft: 'none',
      borderBottom: 'none',
      borderTopRightRadius: '4px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      pointerEvents: 'none',
      display: 'none'
    })
    document.documentElement.appendChild(linkStatus)
    return linkStatus
  }
  const hideLinkStatus = () => {
    if (!linkStatus) { return }
    linkStatus.style.display = 'none'
  }
  window.addEventListener('mouseover', (event) => {
    if (!event.target.closest) { return }
    const link = event.target.closest('a[href]')
    if (!link) {
      hideLinkStatus()
      return
    }
    const element = linkStatusElement()
    element.textContent = link.href
    element.style.display = 'block'
  }, true)
  const hideLinkStatusEvents = ['mousedown', 'scroll', 'blur']
  hideLinkStatusEvents.forEach(name => window.addEventListener(name, hideLinkStatus, true))
  document.addEventListener('mouseleave', hideLinkStatus)
})()
