// one shared intersection observer per item type, instead of one per item (item perf)
// rebuilt once when the root margin changes (triggerUpdateViewportObservers), instead of once per item

import { watch, onBeforeUnmount } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

const observers = new Map() // type → IntersectionObserver
const callbacksByType = new Map() // type → Map of element → callback
let isSubscribed

const createObserver = (type) => {
  const globalStore = useGlobalStore()
  const callbacks = callbacksByType.get(type)
  const handleEntries = (entries) => {
    entries.forEach(entry => {
      const callback = callbacks.get(entry.target)
      if (!callback) { return }
      callback(entry.isIntersecting)
    })
  }
  const observer = new IntersectionObserver(handleEntries, { rootMargin: globalStore.getViewportObserverRootMargin })
  observers.set(type, observer)
  return observer
}
const rebuildObservers = () => {
  observers.forEach((observer, type) => {
    observer.disconnect()
    const newObserver = createObserver(type)
    callbacksByType.get(type).forEach((callback, element) => {
      newObserver.observe(element)
    })
  })
}
const subscribeToRootMarginUpdates = () => {
  if (isSubscribed) { return }
  isSubscribed = true
  const globalStore = useGlobalStore()
  // detached, else the subscription is disposed with whichever component happened to create it
  globalStore.$onAction(({ name }) => {
    if (name !== 'triggerUpdateViewportObservers') { return }
    rebuildObservers()
  }, true)
}
const observe = (type, element, callback) => {
  let callbacks = callbacksByType.get(type)
  if (!callbacks) {
    callbacks = new Map()
    callbacksByType.set(type, callbacks)
  }
  callbacks.set(element, callback)
  let observer = observers.get(type)
  if (!observer) {
    observer = createObserver(type)
  }
  observer.observe(element)
}
const unobserve = (type, element) => {
  callbacksByType.get(type)?.delete(element)
  observers.get(type)?.unobserve(element)
}

/**
 * @param {string} type cards, lists, boxes, connections
 * @param {import('vue').Ref<Element>} elementRef
 * @param {(isIntersecting: boolean) => void} callback
 */
export const useViewportObserver = (type, elementRef, callback) => {
  subscribeToRootMarginUpdates()
  let element
  // follows the template ref, so a re-rendered element is observed in its place
  watch(elementRef, (value) => {
    if (value === element) { return }
    if (element) {
      unobserve(type, element)
    }
    element = value
    if (element) {
      observe(type, element, callback)
    }
  }, { immediate: true, flush: 'post' })
  onBeforeUnmount(() => {
    if (!element) { return }
    unobserve(type, element)
    element = null
  })
}
