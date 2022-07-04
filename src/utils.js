// functional methods that can see dom, but can't access components or store
import cache from '@/cache.js'
import promptPacks from '@/data/promptPacks.json'
import moonphase from '@/moonphase.js'

import { nanoid } from 'nanoid'
import uniqBy from 'lodash-es/uniqBy'
import random from 'lodash-es/random'
import last from 'lodash-es/last'
import sortBy from 'lodash-es/sortBy'
import times from 'lodash-es/times'
import join from 'lodash-es/join'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

// https://data.iana.org/TLD/tlds-alpha-by-domain.txt
// Updated Jun 9 2021 UTC
import tldsList from '@/data/tlds.json'
dayjs.extend(relativeTime)
let tlds = tldsList.join(String.raw`)|(\.`)
tlds = String.raw`(\.` + tlds + ')'

export default {
  userPrefersReducedMotion () {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (query.matches) {
      return true
    } else {
      return false
    }
  },
  loadImage (src) {
    // from https://stackoverflow.com/a/5058336
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', resolve)
      image.addEventListener('error', reject)
      image.src = src
    })
  },
  assetUrl (path, type) {
    if (type) {
      return `@/assets/${path}.${type}`
    } else {
      return `@/assets/${path}`
    }
  },
  kinopioDomain () {
    let domain = 'https://kinopio.club'
    if (import.meta.env.MODE === 'development') {
      domain = 'http://kinopio.local:8080'
    }
    return domain
  },
  host (useKinopioUrl) {
    let host = 'https://kinopio-server.herokuapp.com'
    if (useKinopioUrl) {
      host = 'https://api.kinopio.club'
    }
    if (import.meta.env.MODE === 'development') {
      host = 'http://kinopio.local:3000'
    }
    return host
  },
  websocketHost () {
    let host = 'wss://kinopio-server.herokuapp.com'
    if (import.meta.env.MODE === 'development') {
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
    const offset = (viewport.width * viewport.scale) - (element.x + element.width)
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
  elementHeight (element, isChildElement) {
    if (!element) { return }
    const threshold = 20
    const rect = element.getBoundingClientRect()
    let height
    const viewportHeight = this.visualViewport().height
    height = viewportHeight - rect.y - threshold
    if (isChildElement) {
      const dialog = element.closest('dialog')
      const dialogRect = dialog.getBoundingClientRect()
      height = height - (rect.y - dialogRect.y)
    }

    const zoomScale = this.visualViewport().scale
    if (zoomScale > 1) {
      height = height * zoomScale
    }
    return height
  },
  dialogIsVisible () {
    let elements = document.querySelectorAll('dialog')
    let dialogs = []
    elements.forEach(dialog => {
      if (dialog.className !== 'card-details') {
        dialogs.push(dialog)
      }
    })
    const dialogIsVisible = Boolean(dialogs.length)
    return dialogIsVisible
  },
  unpinnedDialogIsVisible () {
    let dialogs = document.querySelectorAll('dialog')
    const dialogIsVisible = Boolean(dialogs.length)
    if (!dialogIsVisible) { return }
    // ignore pinned dialogs
    let pinnedDialogs = []
    dialogs.forEach(dialog => {
      if (dialog.dataset['is-pinned'] === 'true') {
        pinnedDialogs.push(dialog)
      }
    })
    if (dialogs.length === pinnedDialogs.length) {
      return false
    } else if (dialogs.length) {
      return true
    } else {
      return false
    }
  },
  shouldIgnoreTouchInteraction (event) {
    if (!event) { return true }
    const isScroll = event.type === 'scroll'
    const isResize = event.type === 'resize'
    const dialogIsVisible = this.dialogIsVisible()
    if (dialogIsVisible) { return true }
    if (isScroll || isResize) { return }
    const fromDialog = event.target.closest('dialog')
    const fromHeader = event.target.closest('header')
    const fromFooter = event.target.closest('footer')
    return fromDialog || fromHeader || fromFooter || dialogIsVisible
  },
  scrollIntoView (element) {
    if (!element) { return }
    const rect = element.getBoundingClientRect()
    const viewportWidth = this.visualViewport().width
    const viewportHeight = this.visualViewport().height
    const shouldScrollX = (rect.x + rect.width) > viewportWidth
    const shouldScrollY = (rect.y + rect.height) > viewportHeight
    if (shouldScrollX || shouldScrollY) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      })
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
    const visualViewport = window.visualViewport
    let viewport
    if (visualViewport) {
      viewport = {
        width: visualViewport.width,
        height: visualViewport.height,
        scale: visualViewport.scale,
        offsetLeft: Math.max(visualViewport.offsetLeft, 0),
        offsetTop: Math.max(visualViewport.offsetTop, 0),
        pageLeft: visualViewport.pageLeft,
        pageTop: visualViewport.pageTop
      }
    } else {
      // firefox fallback, doesn't support pinch zooming
      viewport = {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
        scale: document.documentElement.clientWidth / window.innerWidth,
        offsetLeft: 0,
        offsetTop: 0,
        pageLeft: window.scrollX,
        pageTop: window.scrollY
      }
    }
    viewport.offsetLeft = Math.round(viewport.offsetLeft)
    viewport.offsetTop = Math.round(viewport.offsetTop)
    viewport.pageLeft = Math.round(viewport.pageLeft)
    viewport.pageTop = Math.round(viewport.pageTop)
    return viewport
  },
  pinchCounterZoomDecimal () {
    return 1 / this.visualViewport().scale
  },
  isSignificantlyPinchZoomed () {
    const pinchZoomScale = this.visualViewport().scale
    return !this.isBetween({
      value: pinchZoomScale,
      min: 0.8,
      max: 1.3
    })
  },
  rectCenter (rect) {
    const x = Math.round(rect.x + (rect.width / 2))
    const y = Math.round(rect.y + (rect.height / 2))
    return { x, y }
  },
  isBetween ({ value, min, max }) {
    if (min <= value && value <= max) { return true }
  },
  percentageBetween ({ value, min, max }) {
    return ((value - min) * 100) / (max - min)
  },
  clone (object) {
    this.typeCheck({ value: object, type: 'object', origin: 'clone' })
    let cloned = JSON.stringify(object)
    cloned = JSON.parse(cloned)
    return cloned
  },
  typeCheck ({ value, type, allowUndefined, origin }) {
    const isUndefined = value === undefined || value === null
    if (allowUndefined && isUndefined) {
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
  isValidHexColor (hex) {
    // adapted from https://github.com/RobertJGabriel/valid-hex-color
    if (typeof hex !== 'string') { return }
    const hexPattern = /^#([A-Fa-f0-9]{3}([A-Fa-f0-9]{3})?)$/
    let result = hexPattern.test(hex)
    return result
  },
  numberOfLeadingTabs (string) {
    // https://regexr.com/6dl8u
    // matches /t tab characters at start of string
    const tabPattern = /^(\t)+/g
    const match = string.match(tabPattern)
    if (!match) { return 0 }
    const tabs = match[0].length
    return tabs
  },
  numberOfLeadingDoubleSpaces (string) {
    // https://regexr.com/6dl9m
    // matches two space characters at start of string
    const doubleSpacesPattern = /^( {2})+/g
    const match = string.match(doubleSpacesPattern)
    if (!match) { return 0 }
    const doubleSpaces = match[0].length / 2
    return doubleSpaces
  },
  roundFloat (number) {
    // https://stackoverflow.com/a/9453447
    // returns 1.23
    return Math.round(number * 100) / 100
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
  longestStringInArray (array) {
    this.typeCheck({ value: array, type: 'array', origin: 'longestStringInArray' })
    let longest = ''
    array.forEach(string => {
      if (string.length > longest.length) {
        longest = string
      }
    })
    return longest
  },
  arrayToString (array) {
    // ['yo', 'lo'] to 'yo lo'
    // const string = array
    let string = ''
    array.forEach(item => {
      string = string + item + ' '
    })
    return string.trim()
  },
  isStringJSON (string) {
    let isString = true
    try {
      JSON.parse(string)
    } catch (error) {
      isString = false
    }
    return isString
  },
  updateObject (object, updates) {
    this.typeCheck({ value: updates, type: 'object', origin: 'updateObject' })
    const keys = Object.keys(updates)
    if (keys.length === 0) {
      object = {}
    } else {
      keys.forEach(key => {
        object[key] = updates[key]
      })
    }
    return object
  },
  updateUsersWithUser (users, updatedUser, keys) {
    keys = keys || ['name', 'color', 'description', 'website']
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
  splitArrayIntoChunks (array, chunkSize) {
    let numberOfChunks = Math.ceil(array.length / chunkSize)
    let chunks = []
    times(numberOfChunks, function (index) {
      const start = index * chunkSize
      const end = (index + 1) * chunkSize
      const chunk = array.slice(start, end)
      chunks.push(chunk)
    })
    return chunks
  },
  findInArrayOfObjects (array, key, value) {
    return array.find(item => item[key] === value)
  },
  cursorsAreClose (startCursor, endCursor) {
    if (!startCursor) { return }
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
  isApple () {
    return /Safari/.test(navigator.userAgent)
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
  metaKey () {
    if (this.isMacOrIpad() || this.isIPhone()) {
      return '⌘'
    } else {
      return 'Ctrl'
    }
  },
  maxCardLength () { return 300 },
  splitCardNameByParagraphAndSentence (prevName) {
    const maxCardLength = this.maxCardLength()
    const paragraphs = this.splitByParagraphs(prevName) || []
    let cardNames = paragraphs.map(paragraph => {
      let sentences
      if (paragraph.length > maxCardLength) {
        sentences = this.splitBySentences(paragraph)
      }
      return sentences || paragraph
    })
    cardNames = cardNames.flat()
    // split names longer than max card length
    cardNames = cardNames.map(name => {
      // recursive
      let results = []
      let shouldSplit, nameToSplit
      do {
        shouldSplit = false
        nameToSplit = nameToSplit || name
        results.push(nameToSplit.substring(0, maxCardLength))
        const otherSplit = nameToSplit.substring(maxCardLength)
        if (otherSplit <= maxCardLength) {
          results.push(otherSplit)
        } else {
          nameToSplit = otherSplit
          shouldSplit = true
        }
      } while (shouldSplit)

      if (results.length) { return results }
      return name
    })
    cardNames = cardNames.flat()
    cardNames = cardNames.filter(name => Boolean(name.length))
    return cardNames
  },
  splitBySentences (string) {
    if (!string) { return }
    let sentences = string.split('. ')
    sentences = sentences.filter(sentence => Boolean(sentence.length))
    // re-add sentence periods removed by split
    sentences = sentences.map((sentence, index) => {
      if (index < sentences.length - 1) {
        sentence = sentence + '.'
      }
      return sentence
    })
    return sentences
  },
  splitByParagraphs (string) {
    if (!string) { return }
    let paragraphs = string.split('\n')
    paragraphs = paragraphs.filter(paragraph => Boolean(paragraph.length))
    return paragraphs
  },
  capitalizeFirstLetter (string) {
    // 'dreams' -> 'Dreams'
    return string.charAt(0).toUpperCase() + string.slice(1)
  },
  removeTrailingPeriod (string) {
    // https://regexr.com/5784j
    return string.replace(/\.$/g, '')
  },
  removeTrailingSlash (string) {
    if (!string) { return }
    // https://regexr.com/68l08
    return string.replace(/\/$/g, '')
  },
  pastTense (string) {
    if (string === 'cut') { return string }
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
  truncated (string, limit) {
    if (!string) { return '' }
    limit = limit || 60
    if (string.length < limit) { return string }
    string = string.substring(0, limit) + '…'
    return string
  },
  insertStringAtIndex (string, insert, index) {
    return string.substr(0, index) + insert + string.substr(index)
  },
  normalizeToUnixTime (date) {
    return new Date(date).getTime()
  },
  shortRelativeTime (date) {
    if (!date) { return }
    date = date.toString()
    let time = dayjs(date).fromNow(true)
    // https://day.js.org/docs/en/customization/relative-time
    time = time.replace('a few seconds', 'now')
    time = time.replace('a minute', '1m')
    time = time.replace(' minutes', 'm')
    time = time.replace('an hour', '1h')
    time = time.replace(' hours', 'h')
    time = time.replace('a day', '1d')
    time = time.replace(' days', 'd')
    time = time.replace('a month', '1mo')
    time = time.replace(' months', 'mo')
    time = time.replace('a year', '1yr')
    time = time.replace(' years', 'y')
    return time
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
  innerHTMLText (htmlString) {
    // https://regexr.com/6olpg
    // from https://stackoverflow.com/a/1736801
    // matches open and close tags
    const htmlTagPattern = new RegExp(/<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/gim)
    return htmlString.replace(htmlTagPattern, '')
  },
  decodeEntitiesFromHTML (string) {
    var element = document.createElement('textarea')
    element.innerHTML = string
    const value = element.value
    element.remove()
    return value
  },

  // normalize items

  normalizeItems (items) {
    if (!this.arrayExists(items)) { return items }
    items = items.filter(item => Boolean(item))
    let normalizedItems = {}
    items.forEach(item => {
      normalizedItems[item.id] = item
    })
    return normalizedItems
  },
  denormalizeItems (normalizedItems) {
    let items = []
    const ids = Object.keys(normalizedItems)
    ids.forEach(id => {
      items.push(normalizedItems[id])
    })
    return items
  },

  // Cards

  emptyCard () {
    return { width: 76, height: 32 }
  },
  isCardInViewport (card) {
    const viewport = this.visualViewport()
    // x
    const isStartInViewportX = card.x > viewport.pageLeft || card.x + card.width > viewport.pageLeft
    const isEndInViewportX = card.x < viewport.pageLeft + viewport.width
    const isInViewportX = isStartInViewportX && isEndInViewportX
    // y
    const isStartInViewportY = card.y > viewport.pageTop || card.y + card.height > viewport.pageTop
    const isEndInViewportY = card.y < viewport.pageTop + viewport.height
    const isInViewportY = isStartInViewportY && isEndInViewportY
    return isInViewportX && isInViewportY
  },
  isElementInViewport (element) {
    const rect = element.getBoundingClientRect()
    return this.isCardInViewport(rect)
  },
  updateCardDimensions (card) {
    if (!card) { return }
    const element = document.querySelector(`article [data-card-id="${card.id}"]`)
    if (!element) { return }
    const rect = element.getBoundingClientRect()
    const zoom = this.spaceCounterZoomDecimal()
    card.width = Math.ceil(rect.width * zoom)
    card.height = Math.ceil(rect.height * zoom)
    return card
  },
  topLeftCard (cards) {
    cards = this.clone(cards)
    let shortestDistanceCard = {}
    cards.forEach(card => {
      card.distance = Math.sqrt(Math.pow(card.x, 2) + Math.pow(card.y, 2))
      if (!shortestDistanceCard.distance) {
        shortestDistanceCard = card
      } else if (card.distance < shortestDistanceCard.distance) {
        shortestDistanceCard = card
      }
    })
    return shortestDistanceCard
  },
  cardElementFromPosition (x, y) {
    let elements = document.elementsFromPoint(x, y)
    const cardElement = elements.find(element => {
      return element.nodeName === 'ARTICLE' // cards are <article>s
    })
    return cardElement
  },
  cardPositionFromElement (cardId) {
    const element = document.querySelector(`article[data-card-id="${cardId}"]`)
    const x = parseInt(element.style.left)
    const y = parseInt(element.style.top)
    return { x, y }
  },
  isPointInsideCard (point, card) {
    const xIsInside = this.isBetween({
      value: point.x,
      min: card.x,
      max: card.x + card.width
    })
    const yIsInside = this.isBetween({
      value: point.y,
      min: card.y,
      max: card.y + card.height
    })
    return xIsInside && yIsInside
  },
  cardsPositionsShifted (cards, position) {
    const origin = this.topLeftCard(cards)
    const delta = {
      x: position.x - origin.x,
      y: position.y - origin.y
    }
    return cards.map(card => {
      card.x = card.x + delta.x
      card.y = card.y + delta.y
      return card
    })
  },
  textFromCardNames (cards) {
    cards = cards.filter(card => Boolean(card))
    const data = cards.map(card => card.name)
    return join(data, '\n\n')
  },

  // Connection Path Utils 🐙

  spaceZoomDecimal () {
    const floatPattern = /[+-]?\d+(\.\d+)?/g
    const element = document.querySelector('.space')
    let scale = element.style.transform
    scale = scale.match(floatPattern)[0]
    return scale
  },
  spaceCounterZoomDecimal () {
    return 1 / this.spaceZoomDecimal()
  },
  connectorCoords (cardId) {
    const element = document.querySelector(`.connector[data-card-id="${cardId}"] button`)
    if (!element) { return }
    const rect = element.getBoundingClientRect()
    return this.rectCenter(rect)
  },
  coordsWithCurrentScrollOffset ({ x, y }) {
    const zoom = this.spaceCounterZoomDecimal() || 1
    x = (x + window.scrollX) * zoom
    y = (y + window.scrollY) * zoom
    return { x, y }
  },
  connectionBetweenCards (startId, endId) {
    let start = this.connectorCoords(startId)
    let end = this.connectorCoords(endId)
    return this.connectionPathBetweenCoords(start, end)
  },
  curveControlPoint (start, end) {
    // q defines a quadratic curve control point
    return 'q90,40'
  },
  connectionPathBetweenCoords (start, end) {
    if (!start || !end) { return }
    const offsetStart = this.coordsWithCurrentScrollOffset(start)
    const offsetEnd = this.coordsWithCurrentScrollOffset(end)
    const delta = {
      x: parseInt(offsetEnd.x - offsetStart.x),
      y: parseInt(offsetEnd.y - offsetStart.y)
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
  coordsFromConnectionPath (path) {
    // https://regexr.com/66idp
    // matches first 2 digit groups in path: m295,284 q90,40 87,57 → [295, 284]
    const pathCoordsPattern = new RegExp(/m([\d.]{1,}),([\d.]{1,})/)
    let coords = path.match(pathCoordsPattern)
    coords = {
      x: coords[1],
      y: coords[2]
    }
    return this.integerCoords(coords)
  },
  curveControlPointFromPath (path) {
    // https://regexr.com/6mptt
    // matches 'q'-digits-,-digits-space: m295,284 q90,40 87,57 → "q90,40"
    const pathCoordsPattern = new RegExp(/q([\d.]{1,}),([\d.]{1,})/)
    let coords = path.match(pathCoordsPattern)
    coords = {
      x: coords[1],
      y: coords[2]
    }
    return this.integerCoords(coords)
  },
  endCoordsFromConnectionPath (path) {
    // https://regexr.com/6mpru
    // matches end of string after the last space character: m295,284 q90,40 87,57 → "87,57"
    const endPathPattern = new RegExp(/([^ ]*$)/gm)
    const endPath = path.match(endPathPattern)[0]
    // https://regexr.com/6mpsj
    // split end path into coordinates: "87,57" → [87, 57]
    const coordsPattern = new RegExp(/([\d-.]*)/gm)
    let coords = endPath.match(coordsPattern)
    coords = coords.filter(value => Boolean(value))
    coords = {
      x: coords[0],
      y: coords[1]
    }
    return this.integerCoords(coords)
  },
  integerCoords (coords) {
    return {
      x: parseInt(coords.x),
      y: parseInt(coords.y)
    }
  },
  pointOnCurve (pos, path) {
    // pos is 0 to 1
    const start = this.coordsFromConnectionPath(path)
    let end = this.endCoordsFromConnectionPath(path)
    end = {
      x: start.x + end.x,
      y: start.y + end.y
    }
    let cp = this.curveControlPointFromPath(path)
    cp = {
      x: start.x + cp.x,
      y: start.y + cp.y
    }
    // https://stackoverflow.com/questions/5634460/quadratic-bézier-curve-calculate-points
    let x = (1 - pos) * (1 - pos) * start.x + 2 * (1 - pos) * pos * cp.x + pos * pos * end.x
    let y = (1 - pos) * (1 - pos) * start.y + 2 * (1 - pos) * pos * cp.y + pos * pos * end.y
    x = Math.round(x)
    y = Math.round(y)
    return { x, y }
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

  spaceIsUnchanged (prevSpace, newSpace) {
    if (!prevSpace.cards || !prevSpace.connections) { return false }
    const isEditedAt = prevSpace.editedAt === newSpace.editedAt
    const isCardLength = prevSpace.cards.length === newSpace.cards.length
    const isConnectionLength = prevSpace.connections.length === newSpace.connections.length
    const isUnchanged = isEditedAt && isCardLength && isConnectionLength
    return isUnchanged
  },
  mergeSpaceKeyValues ({ prevItems, newItems }) {
    prevItems = prevItems.filter(item => Boolean(item))
    newItems = newItems.filter(item => Boolean(item))
    const prevIds = prevItems.map(item => item.id)
    const newIds = newItems.map(item => item.id)
    newItems = this.normalizeItems(newItems)
    prevItems = this.normalizeItems(prevItems)
    let addItems = []
    let updateItems = []
    let removeItems = []
    newIds.forEach(id => {
      const itemExists = prevIds.includes(id)
      if (itemExists) {
        updateItems.push(newItems[id])
      } else {
        addItems.push(newItems[id])
      }
    })
    prevIds.forEach(id => {
      const itemIsRemoved = !newIds.includes(id)
      if (itemIsRemoved) {
        removeItems.push(prevItems[id])
      }
    })
    return { addItems, updateItems, removeItems }
  },
  spaceDefaultBackground (space, currentUser) {
    const background = currentUser.defaultSpaceBackground
    const backgroundTint = currentUser.defaultSpaceBackgroundTint
    if (background) {
      space.background = background
    }
    if (backgroundTint) {
      space.backgroundTint = backgroundTint
    }
    return space
  },
  emptySpace (spaceId) {
    return { id: spaceId, moonPhase: '', background: '', backgroundTint: '', cards: [], connections: [], connectionTypes: [], tags: [], users: [], userId: '', collaborators: [], spectators: [], clients: [], isHidden: false }
  },
  clearSpaceMeta (space, type) {
    space.originSpaceId = space.id
    space.id = nanoid()
    space.name = `${space.name} ${type}`
    space.removedCards = []
    space.users = []
    space.collaborators = []
    space.showInExplore = false
    space.proposedShowInExplore = false
    space.privacy = 'private'
    space.isTemplate = false
    space.isHidden = false
    space.cards = space.cards.map(card => {
      card.userId = null
      if (card.nameUpdatedByUserId) {
        card.nameUpdatedByUserId = null
        card.nameUpdatedAt = null
      }
      card.width = Math.ceil(card.width)
      card.height = Math.ceil(card.height)
      return card
    })
    return space
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
      if (card.userId === null) { return card }
      if (card.nameUpdatedByUserId) {
        card.nameUpdatedByUserId = userId
      }
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
  updateConnectionsType ({ connections, prevTypeId, newTypeId }) {
    return connections.map(connection => {
      if (connection.connectionTypeId === prevTypeId) {
        connection.connectionTypeId = newTypeId
      }
      return connection
    })
  },
  normalizeSpace (space) {
    if (!this.objectHasKeys(space)) { return space }
    if (!this.arrayExists(space.connections)) { return space }
    const connections = space.connections.filter(connection => {
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
      backgroundTint: space.backgroundTint,
      moonPhase: space.moonPhase,
      url: space.url,
      privacy: space.privacy,
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
      if (!card) {
        return
      }
      if (!card.isRemoved) {
        cards.push(card)
      }
    })
    space.cards = cards
    return space
  },
  removeUnusedKeysFromSpace (space) {
    if (!space) { return }
    const unusedKeys = ['cards', 'connections', 'connectionTypes']
    unusedKeys.forEach(key => {
      if (space[key]) {
        delete space[key]
      }
    })
    return space
  },

  // Journal Space 🌚

  promptPackById (packId) {
    packId = packId.toString()
    return promptPacks.find(pack => pack.packId === packId)
  },
  journalSpace (currentUser, isTomorrow, weather) {
    // name
    let date = dayjs(new Date())
    if (isTomorrow) {
      date = date.add(1, 'day')
    }
    const moonPhase = moonphase(date)
    let summary = `${moonPhase.emoji} ${date.format('dddd')}` // 🌘 Tuesday
    if (weather) {
      summary = summary + weather
    }
    // meta
    const spaceId = nanoid()
    let space = this.emptySpace(spaceId)
    space.name = this.journalSpaceName(isTomorrow)
    space.privacy = 'private'
    space.moonPhase = moonPhase.name
    space.removedCards = []
    space.userId = currentUser.id
    space.connectionTypes = []
    space.connections = []
    space.isTemplate = false
    space.isHidden = false
    space = this.spaceDefaultBackground(space, currentUser)
    // cards
    space.cards.push({ id: nanoid(), name: summary, x: 60, y: 100, frameId: 0 })
    const userPrompts = currentUser.journalPrompts
    userPrompts.forEach(prompt => {
      if (!prompt.name) { return }
      let card = { id: nanoid() }
      if (prompt.packId) {
        const pack = this.promptPackById(prompt.packId)
        const randomPrompt = this.randomPrompt(pack)
        const tag = this.packTag(pack, card.id, space)
        if (tag) { space.tags.push(tag) }
        card.name = `[[${prompt.name}]] ${randomPrompt}`
      } else {
        card.name = prompt.name
      }
      const position = this.promptCardPosition(space.cards, card.name)
      card.x = position.x
      card.y = position.y
      card.z = 0
      card.spaceId = spaceId
      space.cards.push(card)
    })
    return space
  },

  journalSpaceName (isTomorrow) {
    let date = dayjs(new Date())
    if (isTomorrow) {
      date = date.add(1, 'day')
    }
    return `${date.format('dddd MMM D/YY')}` // Thursday Oct 8/20
  },
  journalSpaceDateFromName (name) {
    // https://regexr.com/6471p
    const datePattern = new RegExp(/^['A-Za-z]+ ['A-Za-z]+ [0-9]+\/[0-9]{2}/g)
    let matches = name.match(datePattern)
    if (matches) {
      return matches[0]
    }
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
  spaceHasUrl () {
    return window.location.href !== (window.location.origin + '/')
  },
  spaceAndCardIdFromUrl (path) {
    // https://regexr.com/5kr4g
    // matches (text after /) twice
    const urlPattern = new RegExp(/\/([^?\s/]+)\/{0,1}([^?\s/]+){0,1}/i)
    let matches = path.match(urlPattern)
    if (!matches) { return }
    matches = {
      spaceUrl: matches[1],
      cardId: matches[2]
    }
    return matches
  },
  spaceIdFromUrl (url) {
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
  currentSpaceIsRemote (space, currentUser) {
    if (!this.arrayExists(space.users)) { return true }
    const currentUserCreatedSpace = currentUser.id === space.users[0].id
    if (currentUserCreatedSpace) {
      return Boolean(currentUser.apiKey)
    } else {
      return true
    }
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
    const currencyFloatPattern = new RegExp(/^[$€£₾₺₴₦₪R¥元₹₱₩฿₫₿ɱŁΞ]{1}[0-9]+\.[0-9]+/g)
    if (url.match(currencyFloatPattern)) {
      return true
    }
  },
  urlIsValidTld (url) {
    const isLocalhostUrl = url.match(this.localhostUrlPattern())
    if (isLocalhostUrl) { return true }
    // https://regexr.com/5v6s9
    const regex = '(' + tlds + ')' + String.raw`(\?|\/| |$|\s)`
    const tldPattern = new RegExp(regex)
    url = url.toLowerCase()
    if (url.match(tldPattern)) {
      return true
    }
  },
  urlFromString (string) {
    if (!string) { return }
    const urls = this.urlsFromString(string)
    if (urls) {
      return urls[0]
    } else {
      return null
    }
  },
  urlFromCSSBackgroundImage (string) {
    if (!string) { return }
    // https://regexr.com/5vvc4
    // image from `url("image")`
    const urlPattern = new RegExp(/(http[s]?:\/\/)[^\s(["<>]{2,}\.[^\s.[">,<]+\w\/?/igm)
    let urls = string.match(urlPattern)
    return urls[0]
  },
  localhostUrlPattern () {
    // https://regexr.com/6cujp
    // start, newline, or space
    // http://localhost:
    // then port numbers
    // then the rest of the url path
    return new RegExp(/(^|\n| )(http:\/\/localhost:)[^\s."><]+\w\/?-?/igm)
  },
  urlsFromString (string, skipProtocolCheck) {
    if (!string) { return [] }
    // remove markdown links
    const markdownLinks = string.match(this.markdown().linkPattern)
    if (markdownLinks) {
      markdownLinks.forEach(link => {
        string = string.replace(link, '')
      })
    }
    string = this.removeMarkdownCodeblocksFromString(string)
    // https://regexr.com/59m5t
    // start, newline, or space
    // optionally starts with http/s protocol
    // followed by alphanumerics
    // then '.'
    // followed by alphanumerics
    // then trailing '/' or '-'
    // matches multiple urls and returns [urls]
    const urlPattern = new RegExp(/(^|\n| )(http[s]?:\/\/)?[^\s(["<>]{2,}\.[^\s."><]+\w\/?-?/igm)
    let localhostUrls = string.match(this.localhostUrlPattern()) || []
    let urls = string.match(urlPattern) || []
    urls = urls.concat(localhostUrls)
    urls = urls.filter(url => Boolean(url))
    if (!urls.length) { return }
    // filter out empty or non-urls
    urls = urls.map(url => this.trim(url))
    urls = urls.filter(url => {
      if (!url) { return }
      const urlIsMarkdownEmphasis = Boolean(this.markdown().emphasisPattern2.exec(url))
      const isInvalidUrl = urlIsMarkdownEmphasis || this.urlIsFloatOrIp(url) || this.urlIsCurrencyFloat(url)
      if (!isInvalidUrl) {
        return true
      }
    })
    if (skipProtocolCheck) { return urls }
    // ensure url has protocol
    urls = urls.map(url => {
      const isFile = this.urlIsFile(url, true)
      const hasProtocol = this.urlHasProtocol(url)
      if (isFile || hasProtocol) {
        return url
      } else {
        return `https://${url}`
      }
    })
    return urls
  },
  urlHasProtocol (url) {
    if (!url) { return }
    url = url.toLowerCase()
    return url.startsWith('http://') || url.startsWith('https://')
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
    // https://regexr.com/6dv93
    // matches wikipedia.org/wiki/ABC_123#/media/File
    const wikipediaMediaPagePattern = new RegExp(/wikipedia.org\/wiki\/[A-Zaz_0-9:]+#\/media\/File/igm)
    const isPage = url.match(wikipediaMediaPagePattern)
    if (isPage) { return }
    // https://regexr.com/4rjtu
    // match an extension
    // which much be followed by either end of line, space, or ? (for qs) char
    const imageUrlPattern = new RegExp(/(?:\.gif|\.jpg|\.jpeg|\.jpe|\.jif|\.jfif|\.png|\.svg|\.webp)(?:\n| |\?|&)/igm)
    const isImage = url.match(imageUrlPattern)
    return Boolean(isImage)
  },
  urlIsVideo (url) {
    if (!url) { return }
    url = url + ' '
    const videoUrlPattern = new RegExp(/(?:\.mp4|\.webm)(?:\n| |\?|&)/igm)
    const isVideo = url.match(videoUrlPattern)
    return Boolean(isVideo)
  },
  urlIsAudio (url) {
    if (!url) { return }
    url = url + ' '
    const audioUrlPattern = new RegExp(/(?:\.mp3|\.m4a|\.ogg|\.wav)(?:\n| |\?|&)/igm)
    const isAudio = url.match(audioUrlPattern)
    return Boolean(isAudio)
  },
  urlIsFile (url, skipProtocolCheck) {
    if (!url) { return }
    if (!skipProtocolCheck) {
      const hasProtocol = this.urlHasProtocol(url)
      if (!hasProtocol) { return }
    }
    url = url + ' '
    const fileUrlPattern = new RegExp(/(?:\.txt|\.md|\.markdown|\.pdf|\.ppt|\.pptx|\.doc|\.docx|\.csv|\.xsl|\.xslx|\.rtf|\.zip|\.tar|\.xml|\.psd|\.ai|\.ind|\.sketch|\.mov|\.heic)(?:\n| |\?|&)/igm)
    const isFile = url.toLowerCase().match(fileUrlPattern)
    return Boolean(isFile)
  },
  urlIsSpace (url) {
    if (!url) { return }
    let spaceUrlPattern
    if (import.meta.env.MODE === 'development') {
      // https://regexr.com/5hjc2
      spaceUrlPattern = new RegExp(/(?:kinopio\.local:.*\/)(.*)\b/gi)
    } else {
      // https://regexr.com/60jvc
      // 'https://kinopio.club/' (protocol required)
      // no 'invite?' after 'club' (no invite links)
      // alphanumber and '-' characters after
      // until whitespace or end of string
      spaceUrlPattern = new RegExp(/(https:\/\/kinopio\.club\/)(?:(?!invite\?).)(['A-Za-z0-9-]*)/gi)
    }
    const isSpaceUrl = url.match(spaceUrlPattern)
    return Boolean(isSpaceUrl)
  },
  fileNameFromUrl (url) {
    if (!url) { return }
    if (!this.urlIsFile(url)) { return }
    // https://regexr.com/4rjtu
    // /filename.pdf from end of string
    const filePattern = new RegExp(/\/[A-z0-9-]+\.[A-z.0-9-]+(\?[A-z.0-9-=]*)*$/gim)
    let file = url.match(filePattern)

    if (!file) { return }
    file = file[0]
    // remove leading '/''
    const name = file.substring(1, file.length)
    return name
  },
  urlWithoutQueryString (url) {
    url = this.urlWithoutTrailingSlash(url)
    return url.split('?')[0]
  },
  urlWithoutTrailingSlash (url) {
    const lastCharacter = url.substring(url.length - 1, url.length)
    if (lastCharacter === '/') {
      url = url.substring(0, url.length - 1)
    }
    return url
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
      description: user.description,
      website: user.website,
      isSignedIn,
      isSpectator,
      isCollaborator,
      isUpgraded: user.isUpgraded,
      isModerator: user.isModerator,
      isGuideMaker: user.isGuideMaker,
      isDonor: user.isDonor
    }
  },
  spaceMeta (space) {
    return {
      id: space.id,
      name: space.name,
      privacy: space.privacy
    }
  },
  normalizeBroadcastUpdates (updates) {
    const message = updates.type
    const handler = updates.handler
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
    delete updates.message
    delete updates.handler
    return { message, handler, updates }
  },

  // Upload

  isFileTooBig (file, userIsUpgraded) {
    const sizeLimit = 1024 * 1024 * 5 // 5mb
    if (file.size > sizeLimit && !userIsUpgraded) {
      return true
    }
  },

  // Tags 🦋

  tagsFromString (string) {
    if (!string) { return }
    // remove `code blocks`
    const codeBlocks = string.match(this.markdown().codeBlockPattern) || string.match(this.markdown().codePattern)
    if (codeBlocks) {
      codeBlocks.forEach(code => {
        string = string.replace(code, '')
      })
    }
    // https://regexr.com/5bv6b
    // '[' twice
    // then anything except line break and ']'
    // ']' twice
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
  },

  indexesOf (string, search) {
    // adapted from https://stackoverflow.com/a/3410549
    search = search.replaceAll('[', '\\[')
    const prevSearch = search
    search = search.replaceAll('?', '\\?')
    search = search.replaceAll('$', '\\$')
    const extraCharacters = 2 + (search.length - prevSearch.length)
    const searchPattern = new RegExp(search, 'gim')
    let results = []
    while (searchPattern.exec(string)) {
      const position = searchPattern.lastIndex - search.length + extraCharacters
      results.push(position)
    }
    return results
  },

  // Name Segments 🎫

  cardNameSegments (name) {
    if (!name) { return [] }
    const tags = this.tagsFromString(name) || []
    const urls = this.urlsFromString(name, true) || []
    const markdownLinks = name.match(this.markdown().linkPattern) || []
    const links = urls.filter(url => {
      const linkIsMarkdown = markdownLinks.find(markdownLink => markdownLink.includes(url))
      if (linkIsMarkdown) { return }
      return this.urlIsSpace(url)
    })
    const files = urls.filter(url => this.urlIsFile(url))

    let badges = []
    let segments = []
    tags.forEach(tag => {
      // remove previous duplicate tag names
      let startPositions = this.indexesOf(name, tag)
      badges.forEach(badge => {
        startPositions = startPositions.filter(position => position > badge.startPosition)
      })
      const startPosition = startPositions[0]
      const endPosition = startPosition + tag.length
      badges.push({ tag, startPosition, endPosition, isTag: true })
    })
    links.forEach(link => {
      const startPosition = name.indexOf(link)
      const endPosition = startPosition + link.length
      badges.push({ link, startPosition, endPosition, isLink: true })
    })
    files.forEach(file => {
      const startPosition = name.indexOf(file)
      const endPosition = startPosition + file.length
      badges.push({ file, startPosition, endPosition, isFile: true })
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
      } else if (segment.isFile) {
        segments.push({
          isFile: true,
          name: this.fileNameFromUrl(segment.file)
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
  markdown () {
    return {
      // https://regexr.com/5jmf1
      // matches [text](url)
      linkPattern: /\[([^[]+)\]\(([^\n ]+)\)/gmi,
      // https://regexr.com/5jmeu
      // matches **text**
      boldPattern: /(\*\*)(.*?)\1/gmi,
      // https://regexr.com/65i1l
      // matches # text
      h1Pattern: /^# ()(.+$)/gmi,
      h2Pattern: /^## ()(.+$)/gmi,
      h3Pattern: /^### ()(.+$)/gmi,
      // https://regexr.com/5jmf4
      // matches *text*
      emphasisPattern1: /(\*)(.*?)\1/gmi,
      // https://regexr.com/5jop0
      // matches _text_
      emphasisPattern2: /\b(_)(.*?)\1\b/gmi,
      // https://regexr.com/5jmf7
      // matches ~~text~~
      strikethroughPattern: /(~){2}(.*?)(~){2}/gmi,
      // https://regexr.com/5jr6k
      // matches ```⮐text⮐```
      codeBlockPattern: /(`){3}[\n ]*(.*?)[\n ]*(`){3}/gmis,
      // https://regexr.com/5jr6h
      // matches `text`
      codePattern: /(`)(.*?)\1/gmi
    }
  },
  markdownSegments (name) {
    this.typeCheck({ value: name, type: 'string', origin: 'markdownSegments' })
    let segments = []
    let currentPosition = 0
    if (!name) { return segments }
    while (currentPosition < name.length) {
      const markdown = this.markdown()
      let text = name.substring(currentPosition, name.length)
      let segment = { content: '', type: 'text' }
      let items = [
        {
          type: 'link',
          result: markdown.linkPattern.exec(text)
        }, {
          type: 'bold',
          result: markdown.boldPattern.exec(text)
        }, {
          type: 'h1',
          result: markdown.h1Pattern.exec(text)
        }, {
          type: 'h2',
          result: markdown.h2Pattern.exec(text)
        }, {
          type: 'h3',
          result: markdown.h3Pattern.exec(text)
        }, {
          type: 'emphasis',
          result: markdown.emphasisPattern1.exec(text)
        }, {
          type: 'emphasis',
          result: markdown.emphasisPattern2.exec(text)
        }, {
          type: 'strikethrough',
          result: markdown.strikethroughPattern.exec(text)
        }, {
          type: 'codeBlock',
          result: markdown.codeBlockPattern.exec(text)
        }, {
          type: 'code',
          result: markdown.codePattern.exec(text)
        }
      ]
      items = items.map(item => {
        if (item.result) {
          item.startPosition = text.indexOf(item.result[0])
        }
        return item
      })
      items = sortBy(items, ['startPosition'])
      const match = items[0]
      if (match.startPosition === undefined) {
        segment.content = text
        currentPosition = name.length // ends loop
      } else {
        // before text
        const beforeSegment = {
          content: text.substring(0, match.startPosition),
          type: 'text'
        }
        segments.push(beforeSegment)
        // segment
        segment.content = match.result[2]
        segment.result = match.result
        segment.type = match.type
        currentPosition = currentPosition + match.startPosition + match.result[0].length
      }
      segments.push(segment)
    }
    return segments
  },
  commentPattern () {
    // https://regexr.com/5ju19
    // matches ((text))
    const commentPattern = /(\(\().*?(\)\))/gims
    return commentPattern
  },
  isNameComment (name) {
    if (!name) { return }
    const commentPattern = this.commentPattern()
    const comment = name.match(commentPattern)
    const markdown = this.markdown()
    const code = name.match(markdown.codeBlockPattern) || name.match(markdown.codePattern)
    let isCode
    if (!comment) { return }
    if (code) { isCode = code[0].includes(comment[0]) }
    if (isCode) { return }
    return Boolean(comment)
  },
  nameWithoutCommentPattern (name) {
    if (!name) { return }
    if (!this.isNameComment) { return name }
    name = name.replaceAll('((', '')
    name = name.replaceAll('))', '')
    return name
  },
  removeMarkdownCodeblocksFromString (string) {
    if (!string) { return '' }
    const segments = this.markdownSegments(string)
    segments.forEach(segment => {
      if (segment.type === 'codeBlock' || segment.type === 'code') {
        string = string.replace(segment.content, '')
      }
    })
    return string
  }
}
