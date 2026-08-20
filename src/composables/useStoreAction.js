// subscribe to specific store actions by name (item perf)

import { onBeforeUnmount } from 'vue'

const registries = new WeakMap() // store → Map of action name → Set of callbacks

const listenersForStore = (store) => {
  let listeners = registries.get(store)
  if (listeners) { return listeners }
  listeners = new Map()
  registries.set(store, listeners)
  // detached, else the subscription is disposed with whichever component happened to create it
  store.$onAction(({ name, args }) => {
    const callbacks = listeners.get(name)
    if (!callbacks) { return }
    // copy, because a callback can unmount a component and remove listeners while dispatching
    Array.from(callbacks).forEach(callback => callback(args[0]))
  }, true)
  return listeners
}

export const useStoreAction = (store, handlers) => {
  const listeners = listenersForStore(store)
  const entries = Object.entries(handlers)
  entries.forEach(([name, callback]) => {
    let callbacks = listeners.get(name)
    if (!callbacks) {
      callbacks = new Set()
      listeners.set(name, callbacks)
    }
    callbacks.add(callback)
  })
  onBeforeUnmount(() => {
    entries.forEach(([name, callback]) => {
      const callbacks = listeners.get(name)
      if (!callbacks) { return }
      callbacks.delete(callback)
      if (!callbacks.size) {
        listeners.delete(name)
      }
    })
  })
}
