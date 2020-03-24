// functional methods that can see dom, but can't access components or store
import nanoid from 'nanoid'

export default {
  mobileTouchPosition (event, type) {
    let touch
    if (event.touches[0]) {
      touch = event.touches[0]
    } else {
      // touchend
      touch = event.changedTouches[0]
    }
    return {
      x: touch[`${type}X`],
      y: touch[`${type}Y`]
    }
  },

  cursorPositionInViewport (event) {
    let x, y
    if (event.touches) {
      const touch = this.mobileTouchPosition(event, 'client')
      x = touch.x
      y = touch.y
    } else {
      x = event.clientX
      y = event.clientY
    }
    return { x, y }
  },

  cursorPositionInPage (event) {
    let x, y
    if (event.touches) {
      const touch = this.mobileTouchPosition(event, 'page')
      x = touch.x
      y = touch.y
    } else if (event.type === 'keyup' || event.type === 'keydown') {
      const rect = event.target.getBoundingClientRect()
      x = rect.x + window.pageXOffset
      y = rect.y + window.pageYOffset
    } else {
      x = event.pageX
      y = event.pageY
    }
    return { x, y }
  },

  rectCenter (rect) {
    const x = Math.round(rect.x + (rect.width / 2))
    const y = Math.round(rect.y + (rect.height / 2))
    return { x, y }
  },

  isBetween ({ value, min, max }) {
    if (min <= value && value <= max) { return true }
  },

  clone (object) {
    let cloned = JSON.stringify(object)
    cloned = JSON.parse(cloned)
    return cloned
  },

  typeCheck (value, type, allowUndefined) {
    if (allowUndefined && value === undefined) {
      return
    }
    if (type === 'array' && Array.isArray(value)) {
      return
    }
    if (typeof value !== type) { // eslint-disable-line valid-typeof
      console.error(`passed value is not ${type}`, value)
    }
  },

  updateObject (object, value) {
    this.typeCheck(value, 'object')
    const keys = Object.keys(value)
    if (keys.length === 0) {
      object = {}
    } else {
      keys.forEach(key => {
        object[key] = value[key]
      })
    }
    return object
  },

  mergeArrayOfObjectsById (baseArray, newArray) {
    baseArray = this.clone(baseArray)
    newArray.forEach(item => {
      const existingItemIndex = baseArray.findIndex(baseItem => baseItem.id === item.id)
      if (existingItemIndex > -1) {
        baseArray.splice(existingItemIndex, 1)
      }
      baseArray.push(item)
    })
    return baseArray
  },

  findInArrayOfObjects (array, key, value) {
    return array.find(item => item[key] === value)
  },

  cursorsAreClose (startCursor, endCursor) {
    const threshold = 5
    const xRange = {
      value: endCursor.x,
      min: startCursor.x - threshold,
      max: startCursor.x + threshold
    }
    const yRange = {
      value: endCursor.y,
      min: startCursor.y - threshold,
      max: startCursor.y + threshold
    }
    return this.isBetween(xRange) && this.isBetween(yRange)
  },

  objectHasKeys (object) {
    if (!object) { return }
    if (Object.keys(object).length) {
      return true
    } else {
      return false
    }
  },

  isIOS () {
    return navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)
  },

  isAndroid () {
    return navigator.platform && /Android/.test(navigator.platform)
  },

  isMobile () {
    return Boolean(this.isIOS() || this.isAndroid())
  },

  isMac () {
    return window.navigator.platform === 'MacIntel'
  },

  // prevents jarring frame skips caused by simultaneously scrolling a card into view, zooming in, and showing an onscreen keyboard
  shouldPreventAutofocus () {
    const isMobile = this.isMobile()
    const pinchZoomRatio = document.documentElement.clientWidth / window.innerWidth
    const pinchZoomRatioShouldNotFocusZoom = !this.isBetween({
      value: pinchZoomRatio,
      min: 0.8,
      max: 1.3
    })
    if (isMobile && pinchZoomRatioShouldNotFocusZoom) {
      return true
    }
  },

  capitalizeFirstLetter (string) {
    // 'dreams' -> 'Dreams'
    return string.charAt(0).toUpperCase() + string.slice(1)
  },

  lowercaseFirstLetter (string) {
    // 'Dreams' -> 'dreams'
    return string.charAt(0).toLowerCase() + string.slice(1)
  },

  updateAllIds (object, key, idDeltas) {
    const index = idDeltas.findIndex(id => object[key] === id.prevId)
    if (index >= 0) {
      return idDeltas[index].newId
    } else {
      return object[key]
    }
  },

  timeout (ms, promise) {
    // https://github.com/github/fetch/issues/175#issuecomment-216791333
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('promise timeout'))
      }, ms)
      promise.then(
        (res) => {
          clearTimeout(timeoutId)
          resolve(res)
        },
        (err) => {
          clearTimeout(timeoutId)
          reject(err)
        }
      )
    })
  },

  pluralize (word, condition) {
    if (condition) {
      word = word + 's'
    }
    return word
  },

  normalizeToUnixTime (date) {
    return new Date(date).getTime()
  },

  isEvenNumber (number) {
    if (number % 2 === 0) {
      return true
    }
  },

  distanceBetweenTwoPoints (point1, point2) {
    // https://www.mathwarehouse.com/algebra/distance_formula/index.php
    const xDelta = Math.abs(point1.x - point2.x)
    const yDelta = Math.abs(point1.y - point2.y)
    const distance = Math.sqrt((xDelta ** 2) + (yDelta ** 2))
    return Math.round(distance)
  },

  angleBetweenTwoPoints (point1, point2) {
    // https://www.mathisfunforum.com/viewtopic.php?id=16175
    const xDelta = Math.abs(point1.x - point2.x)
    const yDelta = Math.abs(point1.y - point2.y)
    const angleRadians = Math.atan2(yDelta, xDelta)
    const angleDegrees = angleRadians * 180 / Math.PI
    return Math.round(angleDegrees)
  },

  // Connection Path Utils 🐙

  connectorCoords (cardId) {
    const element = document.querySelector(`.connector[data-card-id="${cardId}"] button`)
    if (!element) { return }
    const rect = element.getBoundingClientRect()
    return this.rectCenter(rect)
  },

  coordsWithCurrentScrollOffset ({ x, y }) {
    x = x + window.scrollX
    y = y + window.scrollY
    return { x, y }
  },

  connectionBetweenCards (startId, endId) {
    let start = this.connectorCoords(startId)
    let end = this.connectorCoords(endId)
    return this.connectionPathBetweenCoords(start, end)
  },

  curveControlPoint (start, end) {
    // TODO: as you're drawing, manipulate the curvecontrolpoint to be more pleasing
    // q defines a quadratic curve control point
    return 'q90,40'
  },

  connectionPathBetweenCoords (start, end) {
    if (!start || !end) { return }
    const offsetStart = this.coordsWithCurrentScrollOffset(start)
    const offsetEnd = this.coordsWithCurrentScrollOffset(end)
    const delta = {
      x: (offsetEnd.x - offsetStart.x),
      y: (offsetEnd.y - offsetStart.y)
    }
    let curve = this.curveControlPoint(offsetStart, delta)
    return `m${offsetStart.x},${offsetStart.y} ${curve} ${delta.x},${delta.y}`
  },

  // Painting 🖌

  exponentialDecay (iteration, rateOfIterationDecay) {
    return Math.exp(-(rateOfIterationDecay * iteration))
  },

  filterCircles (circles, maxIterationsToPaint) {
    return circles.filter(circle => circle.iteration < maxIterationsToPaint)
  },

  easeOut (percentComplete, elaspedTime, lockingDuration) {
    const duration = lockingDuration
    const startValue = 0
    const endValue = 1
    return -endValue * (elaspedTime /= duration) * (elaspedTime - 2) + startValue
  },

  // Spaces 🌙

  // migration added oct 2019
  migrationEnsureRemovedCards (space) {
    if (!space.removedCards) {
      space.removedCards = []
    }
    return space
  },

  uniqueSpaceItems (items) {
    const cardIdDeltas = []
    const connectionTypeIdDeltas = []
    items.cards = items.cards.map(card => {
      const newId = nanoid()
      cardIdDeltas.push({
        prevId: card.id,
        newId
      })
      card.id = newId
      return card
    })
    items.connectionTypes = items.connectionTypes.map(type => {
      const newId = nanoid()
      connectionTypeIdDeltas.push({
        prevId: type.id,
        newId
      })
      type.id = newId
      return type
    })
    items.connections = items.connections.map(connection => {
      connection.id = nanoid()
      connection.connectionTypeId = this.updateAllIds(connection, 'connectionTypeId', connectionTypeIdDeltas)
      connection.startCardId = this.updateAllIds(connection, 'startCardId', cardIdDeltas)
      connection.endCardId = this.updateAllIds(connection, 'endCardId', cardIdDeltas)
      return connection
    })
    return items
  },

  normalizeSpace (space) {
    if (!this.objectHasKeys(space)) { return space }
    if (!space.connections) { return space }
    const connections = space.connections.filter(connection => {
      // const typeIds = space.connectionTypes.map(type => type.id)
      const hasTypeId = Boolean(connection.connectionTypeId)
      return hasTypeId
    })
    space.connections = connections
    return space
  },

  normalizeRemoteSpace (remoteSpace) {
    const removedCards = []
    const cards = []
    remoteSpace.cards.forEach(card => {
      if (card.isRemoved) {
        removedCards.push(card)
      } else {
        cards.push(card)
      }
    })
    remoteSpace.cards = cards
    remoteSpace.removedCards = removedCards
    return remoteSpace
  },

  // urls 🌍

  // same as server util
  normalizeString (string) {
    // replaces non alphanumeric (spaces, emojis, $%&, etc.) characters with '-'s
    return string.replace(/([^a-z0-9-]+)/ig, '-').toLowerCase()
  },

  // same as server util
  url ({ name, id }) {
    if (name) {
      const normalizedName = this.normalizeString(name)
      return `${normalizedName}-${id}`
    } else {
      return id
    }
  },

  title ({ name }) {
    if (name) {
      return `${name} – Kinopio`
    } else {
      return 'Kinopio'
    }
  },

  updateWindowUrlAndTitle ({ space, shouldUpdateUrl, userIsSignedIn }) {
    const title = this.title(space)
    let url = ''
    if (shouldUpdateUrl || userIsSignedIn) {
      url = this.url(space)
    }
    url = '/' + url
    window.history.replaceState({}, title, url)
    document.title = title
  },

  spaceHasUrl () {
    return window.location.href !== (window.location.origin + '/')
  },

  idFromUrl (url) {
    url = url || window.location.href
    return url.substring(url.length - 21, url.length)
  },

  currentSpaceHasUrl (space) {
    const id = this.idFromUrl()
    return Boolean(id === space.id)
  },

  normalizeUrl (url) {
    const lastCharacterPosition = url.length - 1
    if (url[lastCharacterPosition] === '/') {
      return url.slice(0, lastCharacterPosition)
    }
    return url
  },

  // Paste Card ✂️

  // recursive
  uniqueCardPosition (point, existingPoints) {
    const isSamePosition = existingPoints.filter(existingPoint => {
      return existingPoint.x === point.x && existingPoint.y === point.y
    })
    if (isSamePosition.length) {
      point.x += 20
      point.y += 20
      this.uniqueCardPosition(point, existingPoints)
    } else {
      return point
    }
  }

}
