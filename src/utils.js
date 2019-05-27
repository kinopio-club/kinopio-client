export default {
  cursorPosition (event) {
    let x, y
    if (event.touches) {
      x = event.touches[0].pageX
      y = event.touches[0].pageY
    } else {
      x = event.pageX
      y = event.pageY
    }
    return { x, y }
  },
  curveControlPoint (origin, delta) {
    // TODO: as you're drawing, manipulate the curvecontrolpoint to be more pleasing
    return 'q90,40'
  },
  connectorMap () {
    const connectorElements = document.querySelectorAll('.connector')
    const connectors = Array.from(connectorElements)
    return connectors.map(connector => {
      const element = connector.getBoundingClientRect()
      return {
        id: connector.dataset.cardId,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height
      }
    })
  },
  associatedConnector (event) {
    console.log('🌹', this.connectorMap())
    // returns connector element if event x,y falls inside bounds
  },

  elementCenter (rect) {
    const x = Math.round(rect.x + (rect.width / 2))
    const y = Math.round(rect.y + (rect.height / 2))
    return { x, y }
  }

}
