// connector slide
// when a box or list connector changes position, slides the connector and its siblings from their old positions to their new ones

import { watch, nextTick } from 'vue'

const duration = 200 // ms
const easing = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

// connectorPosition is a computed connector position
// parentElement is a function that returns the element whose children slide
export const useConnectorSlide = ({ connectorPosition, parentElement }) => {
  watch(connectorPosition, async () => {
    const element = parentElement()
    if (!element) { return }
    const children = [...element.children]
    const prevRects = children.map(child => child.getBoundingClientRect())
    await nextTick()
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) { return }
    children.forEach((child, index) => {
      const rect = child.getBoundingClientRect()
      const scale = rect.width / child.offsetWidth || 1
      const deltaX = (prevRects[index].x - rect.x) / scale
      if (!deltaX) { return }
      // translate instead of transform, to keep .connector's transform
      child.animate([
        { translate: `${deltaX}px 0` },
        { translate: '0 0' }
      ], { duration, easing })
    })
  })
}
