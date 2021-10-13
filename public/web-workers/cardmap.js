// webworker that generates viewport card maps

// in: cards, utils.visualViewport , window.scrollx,y?, zoom
// out: cardmaps in viewport

// When the web worker receives a worker. look at the data and uppercase it, and send it back
self.onmessage = function (e) {
  console.log('🗾 msg received', e)
  // self.postMessage(e.data.toUpperCase());
}
