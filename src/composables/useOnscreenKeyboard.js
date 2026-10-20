// on mobile, scroll a focused field above the onscreen keyboard once the keyboard is up

import { onBeforeUnmount } from 'vue'

import utils from '@/utils.js'

import debounce from 'lodash-es/debounce'

export const useOnscreenKeyboard = (elementRef) => {
  let viewportHeightBeforeKeyboard
  const scrollAboveOnscreenKeyboard = debounce(() => {
    const viewport = window.visualViewport
    // ignore resizes from the safari toolbar collapsing before the keyboard is up
    const keyboardIsVisible = viewport.height < viewportHeightBeforeKeyboard
    if (!keyboardIsVisible) { return }
    removeOnscreenKeyboardListener()
    const element = elementRef.value
    if (!element) { return }
    const rect = element.getBoundingClientRect()
    const visibleBottom = viewport.offsetTop + viewport.height
    if (rect.bottom <= visibleBottom) { return }
    const padding = 20
    window.scrollBy({ top: rect.bottom - visibleBottom + padding, behavior: 'smooth' })
  }, 100) // wait for the keyboard animation to finish resizing the viewport
  const addOnscreenKeyboardListener = () => {
    if (!window.visualViewport) { return }
    if (!utils.isMobile()) { return }
    removeOnscreenKeyboardListener()
    viewportHeightBeforeKeyboard = window.visualViewport.height
    window.visualViewport.addEventListener('resize', scrollAboveOnscreenKeyboard)
  }
  const removeOnscreenKeyboardListener = () => {
    if (!window.visualViewport) { return }
    scrollAboveOnscreenKeyboard.cancel()
    window.visualViewport.removeEventListener('resize', scrollAboveOnscreenKeyboard)
  }
  onBeforeUnmount(removeOnscreenKeyboardListener)
  return { addOnscreenKeyboardListener, removeOnscreenKeyboardListener }
}
