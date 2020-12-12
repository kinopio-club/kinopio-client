// functional methods that can see dom, but can't access components or store
import cache from '@/cache.js'

import nanoid from 'nanoid'
import uniqBy from 'lodash-es/uniqBy'
import dayjs from 'dayjs'
import random from 'lodash-es/random'
import last from 'lodash-es/last'
import sortBy from 'lodash-es/sortBy'

export default {
  kinopioDomain () {
    let domain = 'https://kinopio.club'
    if (process.env.NODE_ENV === 'development') {
      domain = 'http://kinopio.local:8080'
    }
    return domain
  },
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
  elementShouldBeOnRightSide (element) {
    if (!element) { return }
    element = element.getBoundingClientRect()
    const viewport = this.visualViewport()
    const offset = viewport.width - (element.x + element.width)
    if (offset < 0) {
      return true
    } else {
      return false
    }
  },
  elementHeightFromHeader (element, isChildElement) {
    if (!element) { return }
    const viewport = this.visualViewport()
    const rect = element.getBoundingClientRect()
    let header = document.querySelector('header')
    header = header.getBoundingClientRect()
    let height = viewport.height - header.bottom - (viewport.height - rect.bottom)
    if (isChildElement) {
      const dialog = element.closest('dialog')
      const dialogRect = dialog.getBoundingClientRect()
      height = height - (rect.y - dialogRect.y)
    }
    const zoomScale = viewport.scale
    if (zoomScale > 1) {
      height = height * zoomScale
    }
    return height
  },
  elementHeight (element) {
    if (!element) { return }
    const threshold = 20
    const rect = element.getBoundingClientRect()
    let height
    const viewportHeight = this.visualViewport().height
    height = viewportHeight - rect.y - threshold
    const zoomScale = this.visualViewport().scale
    if (zoomScale > 1) {
      height = height * zoomScale
    }
    return height
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
        offsetRight: 0,
        pageLeft: window.scrollX,
        pageTop: window.scrollY
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
    this.typeCheck({ value: object, type: 'object', origin: 'clone' })
    let cloned = JSON.stringify(object)
    cloned = JSON.parse(cloned)
    return cloned
  },
  typeCheck ({ value, type, allowUndefined, origin }) {
    if (allowUndefined && value === undefined) {
      return true
    }
    if (type === 'array' && Array.isArray(value)) {
      return true
    }
    if (typeof value !== type) { // eslint-disable-line valid-typeof
      console.warn(`🚑 passed value is not ${type}`, value, origin)
      return false
    } else {
      return true
    }
  },
  arrayExists (array) {
    this.typeCheck({ value: array, type: 'array', allowUndefined: true, origin: 'arrayExists' })
    if (!array) {
      return false
    } else if (!array.length) {
      return false
    } else {
      return true
    }
  },
  arrayHasItems (array) {
    this.typeCheck({ value: array, type: 'array', allowUndefined: true, origin: 'arrayHasItems' })
    if (array) {
      if (array.length) {
        return true
      }
    }
    return false
  },
  updateObject (object, value) {
    this.typeCheck({ value, type: 'object', origin: 'updateObject' })
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
    this.typeCheck({ value: users, type: 'object', origin: 'updateUsersWithUser' })
    this.typeCheck({ value: updatedUser, type: 'object', origin: 'updateUsersWithUser' })
    this.typeCheck({ value: keys, type: 'array', origin: 'updateUsersWithUser' })
    return users.map(user => {
      if (user.id === updatedUser.userId) {
        keys.forEach(key => {
          user[key] = updatedUser[key] || user[key]
        })
      }
      return user
    })
  },
  mergeArrays ({ previous, updated, key }) {
    const updatedKeys = updated.map(item => item[key])
    const base = previous.filter(item => !updatedKeys.includes(item[key]))
    let merged = base.concat(updated)
    merged = uniqBy(merged, key)
    return merged
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
    this.typeCheck({ value: numbers, type: 'array', origin: 'averageOfNumbers' })
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
  hasBlankCharacters (string) {
    if (!string) { return true }
    // https://regexr.com/5i5a3
    // matches space, enter, tab, whitespace characters
    const blankPattern = new RegExp(/( |\s|\t)+/gm)
    if (string.match(blankPattern)) {
      return true
    }
  },
  splitByBlankCharacters (string) {
    // https://regexr.com/5i5a3
    // matches space, enter, tab, whitespace characters
    const blankPattern = new RegExp(/( |\s|\t)+/gm)
    return string.split(blankPattern)
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
  highestCardZ (cards) {
    let highestCardZ = 0
    cards.forEach(card => {
      if (card.z > highestCardZ) {
        highestCardZ = card.z
      }
    })
    return highestCardZ
  },

  // Spaces 🌙

  emptySpace (spaceId) {
    return { id: spaceId, moonPhase: '', background: '', cards: [], connections: [], connectionTypes: [], tags: [], users: [], collaborators: [], spectators: [], clients: [] }
  },
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
  itemUserId (user, item, nullCardUsers) {
    let userId
    if (nullCardUsers) {
      userId = null
    } else {
      userId = item.userId || user.id
    }
    return userId
  },
  uniqueSpaceItems (items, nullCardUsers) {
    const cardIdDeltas = []
    const connectionTypeIdDeltas = []
    const user = cache.user()
    items.cards = items.cards.map(card => {
      const userId = this.itemUserId(user, card, nullCardUsers)
      const newId = nanoid()
      cardIdDeltas.push({
        prevId: card.id,
        newId
      })
      card.id = newId
      card.userId = userId
      return card
    })
    items.connectionTypes = items.connectionTypes.map(type => {
      const userId = this.itemUserId(user, type, nullCardUsers)
      const newId = nanoid()
      connectionTypeIdDeltas.push({
        prevId: type.id,
        newId
      })
      type.id = newId
      type.userId = userId
      return type
    })
    items.connections = items.connections.map(connection => {
      const userId = this.itemUserId(user, connection, nullCardUsers)
      connection.id = nanoid()
      connection.connectionTypeId = this.updateAllIds(connection, 'connectionTypeId', connectionTypeIdDeltas)
      connection.startCardId = this.updateAllIds(connection, 'startCardId', cardIdDeltas)
      connection.endCardId = this.updateAllIds(connection, 'endCardId', cardIdDeltas)
      connection.userId = userId
      return connection
    })
    if (this.arrayHasItems(items.tags)) {
      items.tags = items.tags.map(tag => {
        tag.id = nanoid()
        tag.cardId = this.updateAllIds(tag, 'cardId', cardIdDeltas)
        return tag
      })
    }
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
  normalizeSpaceMetaOnly (space) {
    let spaceMeta = {
      id: space.id,
      name: space.name,
      users: space.users,
      background: space.background,
      moonPhase: space.moonPhase,
      url: space.url,
      privacy: space.url,
      updatedAt: space.updatedAt,
      showInExplore: space.showInExplore
    }
    return spaceMeta
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

  // Journal Space 🌚

  journalSpaceName () {
    return `${dayjs(new Date()).format('dddd MMM D/YY')}` // Thursday Oct 8/20
  },
  randomPrompt (pack) {
    let index = random(0, pack.prompts.length - 1)
    return pack.prompts[index]
  },
  packTag (pack, cardId, space) {
    const spaceHasTag = space.tags.find(tag => tag.name === pack.name)
    if (spaceHasTag) { return }
    return this.newTag({
      name: pack.name,
      defaultColor: pack.color,
      cardId: cardId,
      spaceId: space.id
    })
  },
  promptCardPosition (cards, newCardName) {
    const lastCard = last(cards)
    const lastCardY = lastCard.y
    let lastCardName = lastCard.name.replaceAll('[', '')
    lastCardName = lastCardName.replaceAll(']', '')
    const averageCharactersPerLine = 25
    const lines = Math.ceil(lastCardName.length / averageCharactersPerLine)
    const lineHeight = 14
    const padding = 16
    const lastCardHeight = (lines * lineHeight) + padding + lines
    let distanceBetween = 60
    let x = 100
    if (this.checkboxFromString(newCardName)) {
      distanceBetween = 12
      x = 120
    }
    const y = lastCardY + lastCardHeight + distanceBetween
    return { x, y }
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
  spaceIdFromUrl (url) {
    if (!url) { return }
    url = this.trim(url)
    url = url || window.location.href
    url = url.replaceAll('?hidden=true', '')
    const id = url.substring(url.length - 21, url.length)
    if (this.idIsValid(id)) { return id }
  },
  idIsValid (id) {
    if (!id) { return }
    if (id.includes('/')) {
      return undefined
    }
    return true
  },
  currentSpaceHasUrl (space) {
    const id = this.spaceIdFromUrl()
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
  urlIsCurrencyFloat (url) {
    // https://regexr.com/5bfgm
    // matches currencySymbol numbers '.' numbers
    const currencyFloatPattern = new RegExp(/^[$€£₾₺₴₦₪R¥元₹¥₱₩฿₫₿ɱŁΞ]{1}[0-9]+\.[0-9]+/g)
    if (url.match(currencyFloatPattern)) {
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
    const urlPattern = new RegExp(/(?=http)(http[s]?:\/\/)?[^\s(["<>]+\.[^\s.[">,<]+[\n ]*/igm)
    const urls = string.match(urlPattern)
    if (!urls) { return }
    const url = urls[0]
    const hasProtocol = url.startsWith('http://') || url.startsWith('https://')
    const isInvalidUrl = this.urlIsFloatOrIp(url) || this.urlIsCurrencyFloat(url)
    if (isInvalidUrl) { return }
    if (hasProtocol) {
      return url
    } else {
      return `http://${url}`
    }
  },
  urlsFromString (string, skipProtocolCheck) {
    if (!string) { return [] }
    // https://regexr.com/59m5t
    // same as urlFromString but matches multiple urls and returns [urls]
    const urlPattern = new RegExp(/(?=http)((http[s]?:\/\/)?[^\s(["<>]+\.[^\s.[">,<]+[\n ]*)*/igm)
    let urls = string.match(urlPattern)
    if (!urls) { return }
    // filter out empty or non-urls
    urls = urls.map(url => this.trim(url))
    urls = urls.filter(url => {
      if (!url) { return }
      const isInvalidUrl = this.urlIsFloatOrIp(url) || this.urlIsCurrencyFloat(url)
      if (!isInvalidUrl) {
        return true
      }
    })
    if (skipProtocolCheck) { return urls }
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
  urlWithoutProtocol (url) {
    let newUrl
    const http = 'http://'
    const https = 'https://'
    if (url.match(http)) {
      newUrl = url.replace(http, '')
    } else if (url.match(https)) {
      newUrl = url.replace(https, '')
    } else {
      newUrl = url
    }
    return newUrl
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
  urlIsKinopioSpace (url) {
    if (!url) { return }
    let kinopioUrlPattern
    if (process.env.NODE_ENV === 'development') {
      // https://regexr.com/5hjc2
      kinopioUrlPattern = new RegExp(/(?:kinopio.local:.*\/)(.*)\b/gi)
    } else {
      // https://regexr.com/5hk37
      kinopioUrlPattern = new RegExp(/(?:kinopio.club\/)(.*)\b/gi)
    }
    const isKinopioUrl = url.match(kinopioUrlPattern)
    return Boolean(isKinopioUrl)
  },
  urlWithoutQueryString (url) {
    return url.split('?')[0]
  },
  queryString (url) {
    const split = url.split('?')
    if (split.length <= 1) {
      return undefined
    } else {
      return split[1]
    }
  },
  urlType (url) {
    if (!url) { return }
    if (this.urlIsImage(url)) {
      return 'image'
    } else if (this.urlIsVideo(url)) {
      return 'video'
    } else if (this.urlIsAudio(url)) {
      return 'audio'
    } else {
      return 'link'
    }
  },

  // Checkbox ✅

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
  },

  // Tags

  tagsFromString (string) {
    // https://regexr.com/5bv6b
    // '[' twice
    // then anything except line break and ']'
    // ']' twice
    if (!string) { return }
    const tagPattern = new RegExp(/([[]{2}[^\n(\]\])]+[\]]{2})/gm)
    const tags = string.match(tagPattern)
    return tags
  },
  tagsFromStringWithoutBrackets (string) {
    let tags = this.tagsFromString(string)
    if (!tags) { return }
    tags = tags.map(tag => tag.substring(2, tag.length - 2))
    return tags
  },
  cardNameSegments (name) {
    const tags = this.tagsFromString(name) || []
    const urls = this.urlsFromString(name) || []
    const links = urls.filter(url => this.urlIsKinopioSpace(url))
    let badges = []
    let segments = []
    tags.forEach(tag => {
      const startPosition = name.indexOf(tag)
      const endPosition = name.indexOf(tag) + tag.length
      badges.push({ tag, startPosition, endPosition, isTag: true })
    })
    links.forEach(link => {
      const startPosition = name.indexOf(link)
      const endPosition = name.indexOf(link) + link.length
      badges.push({ link, startPosition, endPosition, isLink: true })
    })
    badges = sortBy(badges, ['startPosition'])
    if (!badges.length) {
      return [{ isText: true, content: name }]
    }
    // first segment
    let startPosition = badges[0].startPosition
    const leadingText = name.substring(0, startPosition)
    segments.push({ isText: true, content: leadingText })
    let currentPosition = startPosition
    // other segments
    badges.forEach((segment, index) => {
      if (segment.isTag) {
        const tag = segment.tag
        segments.push({
          isTag: true,
          name: tag.substring(2, tag.length - 2)
        })
      } else if (segment.isLink) {
        const link = segment.link
        segments.push({
          isLink: true,
          name: link
        })
      }
      currentPosition = segment.endPosition
      const nextBadge = badges[index + 1]
      if (nextBadge) {
        segments.push({
          isText: true,
          content: name.substring(currentPosition, nextBadge.startPosition)
        })
        currentPosition = nextBadge.startPosition
      }
    })
    const trailingText = name.substring(currentPosition, name.length)
    if (trailingText) {
      segments.push({
        isText: true,
        content: trailingText
      })
    }
    return segments
  },
  newTag ({ name, defaultColor, cardId, spaceId }) {
    let color
    const existingTag = cache.allTags().find(tag => tag.name === name)
    if (existingTag) {
      color = existingTag.color
    }
    return {
      name,
      id: nanoid(),
      color: color || defaultColor,
      cardId: cardId,
      spaceId: spaceId
    }
  }
}
