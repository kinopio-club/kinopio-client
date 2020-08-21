// functional methods that can see dom, but can't access components or store
import nanoid from 'nanoid'

import cache from '@/cache.js'

export default {
  host () {
    let host = 'https://kinopio-server.herokuapp.com'
    if (process.env.NODE_ENV === 'development') {
      host = 'http://kinopio.local:3000'
    }
    return host
  },

  websocketHost () {
    let host = 'wss://kinopio-server.herokuapp.com'
    if (process.env.NODE_ENV === 'development') {
      host = 'ws://kinopio.local:3000'
    }
    return host
  },

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

  visualViewport () {
    if (window.visualViewport) {
      return window.visualViewport
    } else {
      // firefox fallback, doesn't support pinch zooming
      return {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
        scale: document.documentElement.clientWidth / window.innerWidth,
        offsetLeft: 0,
        offsetRight: 0
      }
    }
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
    this.typeCheck(object, 'object')
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
      console.warn(`passed value is not ${type}`, value)
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

  updateUsersWithUser (users, updatedUser, keys) {
    keys = keys || ['name', 'color']
    this.typeCheck(users, 'object')
    this.typeCheck(updatedUser, 'object')
    this.typeCheck(keys, 'array')
    return users.map(user => {
      if (user.id === updatedUser.userId) {
        keys.forEach(key => {
          user[key] = updatedUser[key] || user[key]
        })
      }
      return user
    })
  },

  // mergeArrayOfObjectsById (baseArray, newArray) {
  //   baseArray = this.clone(baseArray)
  //   newArray.forEach(item => {
  //     const existingItemIndex = baseArray.findIndex(baseItem => baseItem.id === item.id)
  //     if (existingItemIndex > -1) {
  //       baseArray.splice(existingItemIndex, 1)
  //     }
  //     baseArray.push(item)
  //   })
  //   return baseArray
  // },

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

  isIPhone () {
    // iPads identify as MacIntosh
    return navigator.platform && /iPhone|iPod/.test(navigator.platform)
  },

  isAndroid () {
    return navigator.platform && /Android/.test(navigator.platform)
  },

  isMobile () {
    return Boolean(this.isIPhone() || this.isAndroid())
  },

  isMultiTouch (event) {
    if (event.touches) {
      return event.touches.length > 1
    }
  },

  isMacOrIpad () {
    return window.navigator.platform === 'MacIntel'
  },

  capitalizeFirstLetter (string) {
    // 'dreams' -> 'Dreams'
    return string.charAt(0).toUpperCase() + string.slice(1)
  },

  removeTrailingPeriod (string) {
    // https://regexr.com/5784j
    return string.replace(/\.$/g, '')
  },

  pastTense (string) {
    const lastLetter = string.charAt(string.length - 1)
    // add test cases ad hoc from https://github.com/boo1ean/tensify
    if (lastLetter === 'e') {
      return string + 'd' // move → moved
    } else if (lastLetter === 'y') {
      return string.substring(0, string.length - 1) + 'ied' // copy → copied
    } else {
      return string + 'ed'
    }
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

  averageOfNumbers (numbers) {
    this.typeCheck(numbers, 'array')
    let total = 0
    numbers.forEach(number => {
      total += number
    })
    return total / numbers.length
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

  trim (string) {
    // https://regexr.com/59m7a
    // unlike string.trim(), this removes line breaks too
    return string.replace(/^(\n|\\n|\s)+|(\n|\\n|\s)+$/g, '')
  },

  // Painting 🖌

  exponentialDecay (iteration, rateOfIterationDecay) {
    return Math.exp(-(rateOfIterationDecay * iteration))
  },

  filterCircles (circles, maxIterationsToPaint) {
    return circles.filter(circle => circle.iteration < maxIterationsToPaint)
  },

  easeOut (percentComplete, elaspedTime, duration) {
    const startValue = 0
    const endValue = 1
    return -endValue * (elaspedTime /= duration) * (elaspedTime - 2) + startValue
  },

  cardMap () {
    const cards = document.querySelectorAll('.card')
    let cardMap = []
    cards.forEach(card => {
      const rect = card.getBoundingClientRect()
      const mappedCard = {
        cardId: card.dataset.cardId,
        x: window.scrollX + rect.x,
        y: window.scrollY + rect.y,
        width: rect.width,
        height: rect.height
      }
      cardMap.push(mappedCard)
    })
    return cardMap
  },

  // Spaces 🌙

  // migration added oct 2019
  migrationEnsureRemovedCards (space) {
    if (!space.removedCards) {
      space.removedCards = []
    }
    return space
  },

  updateSpaceUserId (space, userId) {
    space.cards = space.cards.map(card => {
      card.userId = userId
      return card
    })
    space.connectionTypes = space.connectionTypes.map(type => {
      type.userId = userId
      return type
    })
    space.connections = space.connections.map(connection => {
      connection.userId = userId
      return connection
    })
    console.log(space)
    return space
  },

  uniqueSpaceItems (items) {
    const cardIdDeltas = []
    const connectionTypeIdDeltas = []
    const user = cache.user()
    items.cards = items.cards.map(card => {
      const newId = nanoid()
      cardIdDeltas.push({
        prevId: card.id,
        newId
      })
      card.id = newId
      card.userId = user.id
      return card
    })
    items.connectionTypes = items.connectionTypes.map(type => {
      const newId = nanoid()
      connectionTypeIdDeltas.push({
        prevId: type.id,
        newId
      })
      type.id = newId
      type.userId = user.id
      return type
    })
    items.connections = items.connections.map(connection => {
      connection.id = nanoid()
      connection.connectionTypeId = this.updateAllIds(connection, 'connectionTypeId', connectionTypeIdDeltas)
      connection.startCardId = this.updateAllIds(connection, 'startCardId', cardIdDeltas)
      connection.endCardId = this.updateAllIds(connection, 'endCardId', cardIdDeltas)
      connection.userId = user.id
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

  AddCurrentUserIsCollaboratorToSpaces (spaces, currentUser) {
    return spaces.map(space => {
      let userId
      space.users = space.users || []
      if (space.users.length) {
        userId = space.users[0].id
      }
      userId = userId || space.userId
      if (userId !== currentUser.id) {
        space.currentUserIsCollaborator = true
      }
      return space
    })
  },

  removeRemovedCardsFromSpace (space) {
    if (!space.cards) { return }
    let cards = []
    space.cards.forEach(card => {
      if (!card.isRemoved) {
        cards.push(card)
      }
    })
    space.cards = cards
    return space
  },

  // urls 🌍

  // same as server util
  normalizeString (string) {
    // replaces non alphanumeric (spaces, emojis, $%&, etc.) characters with '-'s
    return string.replace(/([^a-z0-9-]+)/ig, '-').toLowerCase()
  },

  normalizeFileUrl (string) {
    // same as normalizeString^, but keeps '.' and case
    return string.replace(/([^a-z0-9-.]+)/ig, '-')
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

  updateWindowUrlAndTitle ({ space, shouldUpdateUrl, currentUserIsSignedIn }) {
    const title = this.title(space)
    let url = ''
    if (shouldUpdateUrl || currentUserIsSignedIn) {
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

  urlIsFloatOrIp (url) {
    // https://regexr.com/58ii6
    // matches numbers '.'' numbers ...
    const floatOrIpPattern = new RegExp(/^(?:[0-9]+\.)+[0-9]+$/igm)
    if (url.match(floatOrIpPattern)) {
      return true
    }
  },

  urlFromString (string) {
    if (!string) { return }
    // https://regexr.com/52r0i
    // optionally starts with http/s protocol
    // followed by alphanumerics
    // then '.''
    // followed by alphanumerics
    const urlPattern = new RegExp(/(http[s]?:\/\/)?[^\s(["<>]*\.[^\s.[">,<]+[\n ]*/igm)
    const urls = string.match(urlPattern)
    if (!urls) { return }
    const url = urls[0]
    const hasProtocol = url.startsWith('http://') || url.startsWith('https://')
    if (hasProtocol) {
      return url
    } else if (!this.urlIsFloatOrIp(url)) {
      return `http://${url}`
    }
  },

  urlsFromString (string) {
    if (!string) { return [] }
    // https://regexr.com/59m5t
    // same as urlFromString but matches multiple urls and returns [urls]
    const urlPattern = new RegExp(/((http[s]?:\/\/)?[^\s(["<>]*\.[^\s.[">,<]+[ ]*)*/igm)
    let urls = string.match(urlPattern)
    // filter out empty or non-urls
    urls = urls.filter(url => {
      const urlHasContent = Boolean(this.trim(url).length)
      const urlIsFloatOrIp = this.urlIsFloatOrIp(url.trim())
      if (urlHasContent && !urlIsFloatOrIp) {
        return true
      }
    })
    // ensure url has protocol
    urls = urls.map(url => {
      const hasProtocol = url.startsWith('http://') || url.startsWith('https://')
      if (hasProtocol) {
        return url
      } else {
        return `http://${url}`
      }
    })
    return urls
  },

  urlIsImage (url) {
    if (!url) { return }
    // append space to match as an end character
    url = url + ' '
    // https://regexr.com/4rjtu
    // match an extension
    // which much be followed by either end of line, space, or ? (for qs) char
    const imageUrlPattern = new RegExp(/(?:\.gif|\.jpg|\.jpeg|\.png)(?:\n| |\?|&)/igm)
    const isImage = url.match(imageUrlPattern)
    return Boolean(isImage)
  },

  urlIsVideo (url) {
    if (!url) { return }
    url = url + ' '
    const videoUrlPattern = new RegExp(/(?:\.mp4)(?:\n| |\?|&)/igm)
    const isVideo = url.match(videoUrlPattern)
    return Boolean(isVideo)
  },

  urlIsAudio (url) {
    if (!url) { return }
    url = url + ' '
    const audioUrlPattern = new RegExp(/(?:\.mp3|\.m4a|\.ogg)(?:\n| |\?|&)/igm)
    const isAudio = url.match(audioUrlPattern)
    return Boolean(isAudio)
  },

  nameIsUnchecked (name) {
    if (!name) { return }
    // https://regexr.com/55afe
    // matches [·]· at the start of a string, with optional ·space inside []s
    const taskPattern = new RegExp(/^(\[(\ )?\]\ )/g) // eslint-disable-line no-useless-escape
    const isTask = name.match(taskPattern)
    return Boolean(isTask)
  },

  nameIsChecked (name) {
    if (!name) { return }
    // https://regexr.com/55afk
    // matches [x] at the start of a string
    const taskPattern = new RegExp(/^(\[[xX]\]\ )/g) // eslint-disable-line no-useless-escape
    const isTask = name.match(taskPattern)
    return Boolean(isTask)
  },

  checkboxFromString (name) {
    if (!name) { return }
    let match
    // same as taskPatterns ^^
    const doing = new RegExp(/^(\[(\ )?\]\ )/g) // eslint-disable-line no-useless-escape
    match = name.match(doing)
    if (match) { return match[0] }
    const done = new RegExp(/^(\[[xX]\]\ )/g) // eslint-disable-line no-useless-escape
    match = name.match(done)
    if (match) { return match[0] }
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
  },

  // Broadcast Websocket 🌝

  userMeta (user, space) {
    const isUser = space.users.find(spaceUser => {
      return spaceUser.id === user.id
    })
    const spaceCollaborators = space.collaborators || []
    const isCollaborator = spaceCollaborators.find(collaborator => {
      return collaborator.id === user.id
    })
    const isSpectator = !(isUser || isCollaborator)
    const isSignedIn = Boolean(user.apiKey)
    return {
      id: user.id,
      name: user.name,
      color: user.color,
      isSignedIn,
      isSpectator,
      isCollaborator,
      isUpgraded: user.isUpgraded
    }
  },

  spaceMeta (space) {
    return {
      id: space.id,
      name: space.name
    }
  },

  normalizeBroadcastUpdates (updates) {
    if (updates.body) {
      const keys = Object.keys(updates.body)
      keys.forEach(key => {
        updates[key] = updates.body[key]
      })
      delete updates.body
    }
    if (updates.updates) {
      const keys = Object.keys(updates.updates)
      keys.forEach(key => {
        updates[key] = updates.updates[key]
      })
      delete updates.updates
    }
    return updates
  },

  // Upload

  isFileTooBig (file, userIsUpgraded) {
    const sizeLimit = 1024 * 1024 * 5 // 5mb
    if (file.size > sizeLimit && !userIsUpgraded) {
      return true
    }
  }

}
