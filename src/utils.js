// functional methods that can see dom, but can't access components or store
import cache from '@/cache.js'
import moonphase from '@/moonphase.js'
import consts from '@/consts.js'
import codeLanguages from '@/data/codeLanguages.json'
import helloSpace from '@/data/hello.json'

import { nanoid } from 'nanoid'
import uniqBy from 'lodash-es/uniqBy'
import last from 'lodash-es/last'
import sortBy from 'lodash-es/sortBy'
import times from 'lodash-es/times'
import join from 'lodash-es/join'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { colord, extend } from 'colord'
import qs from '@aguezz/qs-parse'
import namesPlugin from 'colord/plugins/names'
import getCurvePoints from '@/libs/curve_calc.js'
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed'
import random from 'lodash-es/random'
import randomColor from 'randomcolor'
// https://data.iana.org/TLD/tlds-alpha-by-domain.txt
// Updated Jun 9 2021 UTC
import tldsList from '@/data/tlds.json'
let tlds = tldsList.join(String.raw`)|(\.`)
tlds = String.raw`(\.` + tlds + ')'

dayjs.extend(relativeTime)
extend([namesPlugin]) // colord

const uuidLength = 21
const randomRGBA = (alpha) => {
  const hex = randomColor({ hue: 'random', luminosity: 'random' })
  const rgba = colord(hex).alpha(alpha).toRgbString()
  return rgba
}

export default {
  loadImage (src) {
    // from https://stackoverflow.com/a/5058336
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', resolve)
      image.addEventListener('error', reject)
      image.src = src
    })
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
    const threshold = 10
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
    // ignore pinned dialogs
    let pinnedDialogs = []
    dialogs.forEach(dialog => {
      if (dialog.dataset.isPinned === 'true') {
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
  disablePinchZoom () {
    if (this.isIPhone()) {
      const viewport = document.querySelector('head meta[name=viewport]')
      viewport.setAttribute('content', 'width=device-width, user-scalable=0, maximum-scale=1')
    }
  },
  enablePinchZoom () {
    if (this.isIPhone()) {
      const viewport = document.querySelector('head meta[name=viewport]')
      viewport.setAttribute('content', 'width=device-width, initial-scale=1') // index.html default
    }
  },
  scrollIntoView ({ element, behavior }) {
    behavior = behavior || 'smooth'
    if (!element) { return }
    const sidebarIsVisible = document.querySelector('dialog#sidebar')
    const viewportWidth = this.visualViewport().width
    const isViewportNarrow = viewportWidth < (consts.defaultCharacterLimit * 2)
    let horizontal = 'nearest'
    let vertical = 'nearest'
    if (sidebarIsVisible) {
      horizontal = 'center'
      vertical = 'center'
    }
    if (sidebarIsVisible && isViewportNarrow) {
      horizontal = 'start'
    }
    scrollIntoViewIfNeeded(element, {
      behavior,
      scrollMode: 'if-needed',
      block: vertical,
      inline: horizontal
    })
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
    if (!event) { return }
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
  cursorPositionInSpace (event, position) {
    position = position || this.cursorPositionInPage(event)
    // #space
    const space = document.getElementById('space')
    if (!space) { return }
    let rect = space.getBoundingClientRect()
    position = {
      x: position.x - rect.x,
      y: position.y - rect.y
    }
    // #app
    const app = document.getElementById('app')
    rect = app.getBoundingClientRect()
    position = {
      x: position.x + rect.x,
      y: position.y + rect.y
    }
    // zoom
    let zoom = this.spaceCounterZoomDecimal() || 1
    position = {
      x: Math.round(position.x * zoom),
      y: Math.round(position.y * zoom)
    }
    return position
  },
  rectDimensions (rect) {
    const zoom = this.spaceCounterZoomDecimal() || 1
    rect.x = rect.x + window.scrollX
    rect.y = rect.y + window.scrollY
    const rectPosition = this.updatePositionWithSpaceOffset(rect)
    return {
      x: Math.round(rectPosition.x * zoom),
      y: Math.round(rectPosition.y * zoom),
      width: Math.round(rect.width * zoom),
      height: Math.round(rect.height * zoom)
    }
  },
  isPositionOutsideOfSpace (position) {
    const isOutsideX = position.x < 0
    const isOutsideY = position.y < 0
    return isOutsideX || isOutsideY
  },
  outsideSpaceOffset () {
    const space = document.getElementById('space')
    if (!space) { return }
    const spaceRect = space.getBoundingClientRect()
    const app = document.getElementById('app')
    const appRect = app.getBoundingClientRect()
    return {
      x: Math.round(spaceRect.x - appRect.x),
      y: Math.round(spaceRect.y - appRect.y)
    }
  },
  updatePositionWithSpaceOffset (position) {
    const spaceOffset = this.outsideSpaceOffset()
    if (!spaceOffset) { return position }
    return {
      x: position.x - spaceOffset.x,
      y: position.y - spaceOffset.y
    }
  },
  childDialogPositionFromParent ({ element, offsetX, offsetY, shouldIgnoreZoom, maxYOffset, transformOriginIsTopRight }) {
    element = element.closest('li') || element.closest('.badge') || element.closest('button') || element
    offsetX = offsetX || 0
    offsetY = offsetY || 0
    const rect = element.getBoundingClientRect()
    const position = this.coordsWithCurrentScrollOffset({ x: rect.x, y: rect.y, shouldIgnoreZoom })
    let zoom = this.spaceCounterZoomDecimal() || 1
    if (shouldIgnoreZoom) {
      zoom = 1
    }
    let indent = 8 * zoom
    let x = position.x + offsetX + indent
    let y = position.y + rect.height + offsetY - indent
    if (maxYOffset) {
      const maxY = this.visualViewport().height - maxYOffset + window.scrollY
      y = Math.min(maxY, y)
    }
    return { x, y, shouldIgnoreZoom, transformOriginIsTopRight, zoom }
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
    this.typeCheck({ value: object, type: 'object' })
    let cloned = JSON.stringify(object)
    cloned = JSON.parse(cloned)
    return cloned
  },
  isUndefinedOrNull (value) {
    return value === undefined || value === null
  },
  typeCheck ({ value, type, allowUndefined, origin }) {
    if (allowUndefined && this.isUndefinedOrNull(value)) {
      return true
    }
    if (type === 'array' && Array.isArray(value)) {
      return true
    }
    if (typeof value !== type) { // eslint-disable-line valid-typeof
      console.error(`🚑 passed value is not ${type}`, value, origin)
      return false
    } else {
      return true
    }
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
  pointIsEmpty (point) {
    if (!point) { return }
    if (point.x === 0 && point.y === 0) { return true }
  },
  arrayHasItems (array) { // !arrayIsEmpty, arrayExists
    this.typeCheck({ value: array, type: 'array', allowUndefined: true, origin: 'arrayHasItems' })
    if (array) {
      array = array.filter(item => Boolean(item))
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
  userIsUpgraded (user) {
    return Boolean(user.stripeSubscriptionId || user.stripePlanIsPurchased || user.downgradeAt || user.appleSubscriptionIsActive)
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
    if (!endCursor) { return }
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
    return navigator.platform && (/Android/.test(navigator.platform) || /Android/.test(navigator.userAgent))
  },
  isSafari () {
    return /Safari/.test(navigator.userAgent)
  },
  isMobile () {
    return Boolean(this.isIPhone() || this.isAndroid())
  },
  isFirefox () {
    return navigator.userAgent && /Firefox/.test(navigator.userAgent)
  },
  isLinux () {
    return navigator.platform.includes('Linux')
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
  splitCardNameByParagraphAndSentence (prevName) {
    const maxCardCharacterLimit = consts.defaultCharacterLimit
    const paragraphs = this.splitByParagraphs(prevName) || []
    let cardNames = paragraphs.map(paragraph => {
      let sentences
      if (paragraph.length > maxCardCharacterLimit) {
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
        results.push(nameToSplit.substring(0, maxCardCharacterLimit))
        const otherSplit = nameToSplit.substring(maxCardCharacterLimit)
        if (otherSplit <= maxCardCharacterLimit) {
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
  convertHTMLEntities (string) {
    const entities = [
      { code: '&#60;', result: '<' },
      { code: '&#62;', result: '>' },
      { code: '&#38;', result: '&' },
      { code: '&#34;', result: '"' },
      { code: '&#39;', result: "'" }
    ]
    entities.forEach(entity => {
      string = string.replace(entity.code, entity.result)
    })
    return string
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
    if (condition || condition === 0) {
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
  insertIntoArray (array, value, index) {
    let start = array.slice(0, index)
    const end = array.slice(index, array.length)
    start.push(value)
    const newArray = start.concat(end)
    return newArray
  },
  removeFromArray (array, index) {
    delete array[index]
    array = array.filter(item => Boolean(item))
    return array
  },
  generateRange (start, end) {
    // converts 0,2 to [0,1,2]
    let rangeArray = []
    for (let i = start; i <= end; i++) {
      rangeArray.push(i)
    }
    console.log(start, end, rangeArray)
    return rangeArray
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
    if (!point1 || !point2) { return }
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
  pointBetweenTwoPoints (point1, point2) {
    // https://gamedev.stackexchange.com/questions/23430/get-points-on-a-line-between-two-points
    const progress = 0.5
    const point = {
      x: point1.x + (point2.x - point1.x) * progress,
      y: point1.y + (point2.y - point1.y) * progress
    }
    return point
  },
  pointsBetweenTwoPoints (point1, point2) {
    // [x1, y1, x2, y2, ...]
    const splinePoints = getCurvePoints([point1.x, point1.y, point2.x, point2.y])
    // [{x1, y2}, {x2, y2}, ...]
    const points = []
    let prevX
    splinePoints.forEach((value, index) => {
      value = Math.round(value)
      const isX = this.isEvenNumber(index)
      if (isX) {
        prevX = value
      } else {
        const point = { x: prevX, y: value }
        points.push(point)
      }
    })
    return points
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

  // colors

  cssVariable (name) {
    return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`)
  },
  colorNameIsValid (color) {
    return color === colord(color).toName()
  },
  colorIsValid (color) {
    return colord(color).isValid()
  },
  colorIsDark (color, brightnessThreshold) {
    brightnessThreshold = brightnessThreshold || 0.4
    if (!color) { return }
    if (color === 'transparent') { return }
    return colord(color).brightness() < brightnessThreshold
  },
  invertColor (color) {
    return colord(color).invert().toHex()
  },
  setCssVariable (key, value) {
    document.documentElement.style.setProperty(`--${key}`, value)
  },
  colorsAreEqual (color1, color2) {
    color1 = this.colorToRGB(color1)
    color2 = this.colorToRGB(color2)
    return color1 === color2
  },
  colorToRGB (color) {
    const { r, g, b } = colord(color).toRgb()
    return `rgba(${r}, ${g}, ${b})`
  },

  // colorToRGBA (color, opacity) {
  //   opacity = opacity || '1'
  //   const { r, g, b } = colord(color).toRgb()
  //   return `rgba(${r}, ${g}, ${b}, ${opacity})`
  // },

  // normalize items

  normalizeItems (items) {
    if (!this.arrayHasItems(items)) { return items }
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
    return { width: consts.defaultCardWidth, height: 32 }
  },
  spaceBetweenCards () {
    let spaceBetween = 12
    return this.spaceZoomDecimal() * spaceBetween
  },
  updateCardDimensions (card) {
    if (!card) { return }
    const element = document.querySelector(`article#card[data-card-id="${card.id}"]`)
    if (!element) { return }
    const isCardRenderedInDOM = element.dataset.shouldRender === 'true'
    const zoom = this.spaceCounterZoomDecimal()
    const cardId = card.id
    if (isCardRenderedInDOM) {
      const rect = element.getBoundingClientRect()
      card = this.rectDimensions(rect)
    } else {
      // this.removeCardDimensions(card)
      card.x = parseInt(element.dataset.x)
      card.y = parseInt(element.dataset.y)
      const width = parseInt(element.dataset.width)
      const height = parseInt(element.dataset.height)
      card.width = Math.ceil(width * zoom)
      card.height = Math.ceil(height * zoom)
    }
    card.id = cardId
    return card
  },
  // removeCardDimensions (card) {
  //   const articleElement = document.querySelector(`article#card[data-card-id="${card.id}"]`)
  //   const cardElement = document.querySelector(`.card[data-card-id="${card.id}"]`)
  //   const contentWrapElement = articleElement.querySelector(`.card-content-wrap`)
  //   const cardMediaElement = articleElement.querySelector(`.media-card`)
  //   let width = 'initial'
  //   if (articleElement.dataset.resizeWidth) {
  //     width = articleElement.dataset.resizeWidth + 'px'
  //   }
  //   articleElement.style.width = width
  //   articleElement.style.height = 'initial'
  //   cardElement.style.width = width
  //   contentWrapElement.style.width = width
  //   contentWrapElement.style.height = 'initial'
  // },
  removeAllCardDimensions (card) {
    const articleElement = document.querySelector(`article#card[data-card-id="${card.id}"]`)
    const cardElement = document.querySelector(`.card[data-card-id="${card.id}"]`)
    const contentWrapElement = articleElement.querySelector(`.card-content-wrap`)
    const cardMediaElement = articleElement.querySelector(`.media-card`)
    articleElement.style.width = null
    articleElement.style.height = null
    cardElement.style.width = null
    contentWrapElement.style.width = null
    contentWrapElement.style.height = null
    if (cardMediaElement) {
      cardMediaElement.style.width = null
    }
    articleElement.style.maxWidth = null
  },
  isMissingDimensions (item) {
    return !item.width || !item.height
  },
  topLeftItem (items) {
    items = this.clone(items)
    let shortestDistanceItem = {}
    items.forEach(item => {
      item.distance = Math.sqrt(Math.pow(item.x, 2) + Math.pow(item.y, 2))
      if (!shortestDistanceItem.distance) {
        shortestDistanceItem = item
      } else if (item.distance < shortestDistanceItem.distance) {
        shortestDistanceItem = item
      }
    })
    return shortestDistanceItem
  },
  cardElementFromPosition (x, y) {
    let elements = document.elementsFromPoint(x, y)
    const cardElement = elements.find(element => {
      return element.nodeName === 'ARTICLE' // cards are <article>s
    })
    return cardElement
  },
  cardElementFromId (cardId) {
    return document.querySelector(`article[data-card-id="${cardId}"]`)
  },
  cardRectFromId (cardId) {
    const element = this.cardElementFromId(cardId)
    if (!element) { return }
    return element.getBoundingClientRect()
  },
  cardPositionFromElement (cardId) {
    const element = this.cardElementFromId(cardId)
    if (!element) { return }
    const x = parseInt(element.style.left)
    const y = parseInt(element.style.top)
    return { x, y }
  },
  boxElementFromId (boxId) {
    return document.querySelector(`.box[data-box-id="${boxId}"]`)
  },
  boxRectFromId (boxId) {
    const element = this.boxElementFromId(boxId)
    if (!element) { return }
    return element.getBoundingClientRect()
  },
  boxPositionFromElement (boxId) {
    const element = this.boxElementFromId(boxId)
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
  isRectInsideViewport (rect) {
    const viewport = this.visualViewport()
    const viewportRect = {
      x: window.scrollX,
      y: window.scrollY,
      width: viewport.width,
      height: viewport.height
    }
    return this.isRectAInsideRectB(rect, viewportRect)
  },
  isRectAInsideRectB (rectA, rectB) {
    // udpate rects to support space zoom
    rectA = this.rectDimensions(rectA)
    rectB = this.rectDimensions(rectB)
    // Check if any part of rectA intersects with rectB
    return (
      rectA.x < rectB.x + rectB.width &&
      rectA.x + rectA.width > rectB.x &&
      rectA.y < rectB.y + rectB.height &&
      rectA.y + rectA.height > rectB.y
    )
  },
  itemsPositionsShifted (items, position) {
    const origin = this.topLeftItem(items)
    const delta = {
      x: position.x - origin.x,
      y: position.y - origin.y
    }
    return items.map(item => {
      item.x = item.x + delta.x
      item.y = item.y + delta.y
      return item
    })
  },
  textFromCardNames (cards) {
    cards = cards.filter(card => Boolean(card))
    const data = cards.map(card => card.name)
    return join(data, '\n\n')
  },
  trim (string) {
    if (!string) { return '' }
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
  boundaryRectFromItems (items) {
    items = this.clone(items)
    items = items.filter(item => item.x && item.y)
    if (!items.length) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }
    const defaultSize = 200
    let rect = {}
    // x, width
    let sortedItems = sortBy(items, ['x', 'width'])
    const xStart = sortedItems[0]
    let xEnd = last(sortedItems)
    xEnd.width = xEnd.resizeWidth || xEnd.width || defaultSize
    rect.x = xStart.x
    rect.width = xEnd.x + xEnd.width - xStart.x
    // y, height
    sortedItems = sortBy(items, ['y', 'height'])
    const yStart = sortedItems[0]
    let yEnd = last(sortedItems)
    yEnd.height = xEnd.resizeHeight || xEnd.height || defaultSize
    rect.y = yStart.y
    rect.height = yEnd.y + yEnd.height - yStart.y
    return rect
  },
  pageSizeFromItems (items) {
    const padding = 250
    const defaultSize = 200
    items = this.clone(items)
    items = items.filter(item => item.x && item.y)
    if (!items.length) {
      return { width: 0, height: 0 }
    }
    let width = 0
    let height = 0
    items.forEach(item => {
      let itemWidth = item.resizeWidth || item.width || defaultSize
      let itemHeight = item.resizeHeight || item.height || defaultSize
      itemWidth = item.x + itemWidth + padding
      itemHeight = item.y + itemHeight + padding
      if (itemWidth > width) {
        width = itemWidth
      }
      if (itemHeight > height) {
        height = itemHeight
      }
    })
    return { width, height }
  },

  // estimated card connector positions

  estimatedNewCardConnectorPosition (position) {
    if (!position) { return }
    const zoom = this.spaceCounterZoomDecimal()
    const offset = 15 * zoom
    return {
      x: position.x + consts.defaultCardWidth - offset,
      y: position.y + offset
    }
  },
  estimatedCardConnectorPosition (card) {
    const offset = 15
    let rightSide = card.x + card.width
    let x = rightSide
    x = x - offset
    let y = card.y
    y = y + offset
    const position = {
      x: Math.round(x),
      y: Math.round(y)
    }
    return position
  },

  // Connection Path Utils 🐙

  spaceZoomDecimal () {
    const element = document.getElementById('space')
    return element.dataset.zoom || 1
  },
  spaceCounterZoomDecimal () {
    return 1 / this.spaceZoomDecimal()
  },
  connectorCoords (cardId) {
    const cardConnector = document.querySelector(`.connector[data-card-id="${cardId}"] button`)
    const cardUnlockButton = document.querySelector(`.card-unlock-button[data-card-id="${cardId}"] button`)
    const element = cardConnector || cardUnlockButton
    if (!element) { return }
    const cardElement = document.querySelector(`article#card[data-card-id="${cardId}"]`)
    if (!cardElement.dataset.shouldRender) { return }
    let rect = element.getBoundingClientRect()
    rect.x = rect.x + window.scrollX
    rect.y = rect.y + window.scrollY
    return this.rectCenter(rect)
  },
  coordsWithCurrentScrollOffset ({ x, y, shouldIgnoreZoom }) {
    let zoom = this.spaceCounterZoomDecimal() || 1
    if (shouldIgnoreZoom) {
      zoom = 1
    }
    x = (x + window.scrollX) * zoom
    y = (y + window.scrollY) * zoom
    return { x, y }
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
  boundingBoxFromPath (d) {
    // from https://stackoverflow.com/a/77749799
    // create temporary and hidden svg
    let ns = 'http://www.w3.org/2000/svg'
    let svg = document.createElementNS(ns, 'svg')
    let path = document.createElementNS(ns, 'path')
    svg.setAttribute('style', 'width:0!important; height:0!important; position:fixed!important; overflow:hidden!important; visibility:hidden!important; opacity:0!important')
    path.setAttribute('d', d)
    svg.append(path)
    document.body.append(svg)
    let bb = path.getBBox()
    // remove temporary svg
    svg.remove()
    return bb
  },
  startCoordsFromConnectionPath (path) {
    // https://regexr.com/66idp
    // matches first 2 digit groups in path: m295,284 q90,40 87,57 → [295, 284]
    const pathCoordsPattern = new RegExp(/m([\d.-]{1,}),([\d-.]{1,})/)
    let coords = path.match(pathCoordsPattern)
    if (!coords) { return }
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
    const start = this.startCoordsFromConnectionPath(path)
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
  filterCircles (circles, max) {
    max = max || 300
    const startIndex = circles.length - max
    if (startIndex > 0) {
      circles = circles.slice(startIndex, circles.length)
    }
    circles = circles.filter(circle => circle.iteration < max)
    return circles
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
    return prevSpace.editedAt === newSpace.editedAt
  },
  mergeSpaceKeyValues ({ prevItems, newItems, selectedItems }) {
    prevItems = prevItems.filter(item => Boolean(item))
    newItems = newItems.filter(item => Boolean(item))
    selectedItems = selectedItems || []
    const selectedItemIds = selectedItems.map(item => item.id)
    const prevIds = prevItems.map(item => item.id)
    const newIds = newItems.map(item => item.id)
    newItems = this.normalizeItems(newItems)
    prevItems = this.normalizeItems(prevItems)
    let addItems = []
    let updateItems = []
    let removeItems = []
    newIds.forEach(id => {
      const selectedItem = selectedItems.find(item => item.id === id)
      const itemExists = prevIds.includes(id)
      if (selectedItem) {
        const prevItem = prevItems[id]
        let newItem = newItems[id]
        // use prevItem position to avoid ppsition item jumping while selected items dragging
        newItem.x = prevItem.x
        newItem.y = prevItem.y
        updateItems.push(newItem)
      } else if (itemExists) {
        updateItems.push(newItems[id])
      } else {
        addItems.push(newItems[id])
      }
    })
    prevIds.forEach(id => {
      const prevItemNotFoundInNewItems = !newIds.includes(id)
      const threshold = 10 * 1000 // 10 seconds
      const prevItemUpdatedInCurrentSession = dayjs(Date.now()).diff(prevItems[id].updatedAt) < threshold
      const itemIsRemoved = prevItemNotFoundInNewItems && !prevItemUpdatedInCurrentSession
      if (itemIsRemoved) {
        removeItems.push(prevItems[id])
      }
    })
    return { addItems, updateItems, removeItems }
  },
  newSpaceBackground (space, currentUser) {
    if (currentUser.defaultSpaceBackgroundGradient) {
      space.backgroundGradient = currentUser.defaultSpaceBackgroundGradient
      space.backgroundIsGradient = true
    } else {
      space.background = currentUser.defaultSpaceBackground
    }
    space.backgroundTint = currentUser.defaultSpaceBackgroundTint
    return space
  },
  updateSpaceCardsCreatedThroughPublicApi (space) {
    space.cards = space.cards.map(card => {
      card.isCreatedThroughPublicApi = true
      return card
    })
    return space
  },
  emptySpace (spaceId) {
    return {
      id: spaceId,
      name: 'Loading…',
      moonPhase: '',
      background: '',
      backgroundTint: '',
      backgroundGradient: null,
      backgroundIsGradient: false,
      cards: [],
      connections: [],
      connectionTypes: [],
      boxes: [],
      tags: [],
      users: [],
      userId: '',
      collaborators: [],
      spectators: [],
      clients: [],
      isHidden: false,
      visits: 0
    }
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
    space.collaboratorKey = nanoid()
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
      if (card.userId === consts.rootUserId) {
        card.userId = null
        return card
      }
      if (card.userId === null) { return card }
      if (card.nameUpdatedByUserId) {
        card.nameUpdatedByUserId = userId
      }
      card.userId = userId
      return card
    })
    space.boxes = space.boxes.map(box => {
      box.userId = userId
      return box
    })
    space.connectionTypes = space.connectionTypes.map(type => {
      type.userId = userId
      return type
    })
    space.connections = space.connections.map(connection => {
      connection.userId = userId
      return connection
    })
    space.userId = userId
    space.editedByUserId = userId
    return space
  },
  itemUserId (user, item, nullItemUsers) {
    let userId
    if (nullItemUsers) {
      userId = null
    } else {
      userId = item.userId || user.id
    }
    return userId
  },
  uniqueSpaceItems (items, nullItemUsers) {
    const cardIdDeltas = []
    const connectionTypeIdDeltas = []
    const user = cache.user()
    let { cards, connections, connectionTypes, boxes, tags } = items
    tags = tags || []
    boxes = boxes || []
    cards = cards.map(card => {
      const userId = this.itemUserId(user, card, nullItemUsers)
      const newId = nanoid()
      cardIdDeltas.push({
        prevId: card.id,
        newId
      })
      card.id = newId
      card.userId = userId
      return card
    })
    connectionTypes = connectionTypes.map(type => {
      const userId = this.itemUserId(user, type, nullItemUsers)
      const newId = nanoid()
      connectionTypeIdDeltas.push({
        prevId: type.id,
        newId
      })
      type.id = newId
      type.userId = userId
      return type
    })
    connections = connections.map(connection => {
      const userId = this.itemUserId(user, connection, nullItemUsers)
      connection.id = nanoid()
      connection.connectionTypeId = this.updateAllIds(connection, 'connectionTypeId', connectionTypeIdDeltas)
      connection.startCardId = this.updateAllIds(connection, 'startCardId', cardIdDeltas)
      connection.endCardId = this.updateAllIds(connection, 'endCardId', cardIdDeltas)
      connection.userId = userId
      return connection
    })
    boxes = boxes.map(box => {
      const userId = this.itemUserId(user, box, nullItemUsers)
      box.id = nanoid()
      box.userId = userId
      return box
    })
    tags = tags.map(tag => {
      tag.id = nanoid()
      tag.cardId = this.updateAllIds(tag, 'cardId', cardIdDeltas)
      return tag
    })
    items = { cards, connections, connectionTypes, boxes, tags }
    return items
  },
  updateItemsSpaceId (items, spaceId) {
    return items.map(item => {
      item.spaceId = spaceId
      return item
    })
  },
  updateConnectionsType ({ connections, prevTypeId, newTypeId }) {
    return connections.map(connection => {
      if (connection.connectionTypeId === prevTypeId) {
        connection.connectionTypeId = newTypeId
      }
      return connection
    })
  },
  updateSpacesUserId (userId, spaces) {
    spaces = spaces.map(space => {
      space = this.updateSpaceItemsUser(space, userId)
      space = this.updateSpaceUserId(space, userId)
      delete space.users
      return space
    })
    return spaces
  },
  updateSpaceItemsUser (space, userId) {
    const itemNames = ['boxes', 'cards', 'connections', 'connectionTypes']
    itemNames.forEach(itemName => {
      if (!space[itemName]) { return }
      space[itemName] = space[itemName].map(item => {
        item.userId = userId
        item.nameUpdatedByUserId = userId
        return item
      })
    })
    return space
  },
  newHelloSpace (user) {
    const emptyStringKeys = ['id', 'collaboratorKey', 'readOnlyKey']
    const emptyArrayKeys = ['users', 'collaborators', 'spectators', 'clients']
    const deleteKeys = ['url', 'originSpaceId', 'editedAt', 'editedByUserId', 'createdAt', 'updatedAt', 'updateHash']
    const userId = user?.id || consts.moderatorUserId
    let space = this.clone(helloSpace)
    space.name = 'Hello Kinopio'
    space.privacy = 'private'
    space.visits = 0
    space.showInExplore = false
    space.isTemplate = false
    space.showInExploreUpdatedAt = null
    emptyStringKeys.forEach(key => {
      space[key] = ''
    })
    emptyArrayKeys.forEach(key => {
      space[key] = []
    })
    deleteKeys.forEach(key => {
      delete space[key]
    })
    this.updateSpaceItemsUser(space, userId)
    space.userId = userId
    return space
  },
  normalizeSpace (space) {
    if (!this.objectHasKeys(space)) { return space }
    if (!this.arrayHasItems(space.connections)) { return space }
    const connections = space.connections.filter(connection => {
      const hasTypeId = Boolean(connection.connectionTypeId)
      return hasTypeId
    })
    space.connections = connections
    space.cards = space.cards.filter(card => card.name)
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
    if (!spaces) { return }
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
  spaceReadDate (space, type) {
    this.typeCheck({ value: space, type: 'object' })
    this.typeCheck({ value: type, type: 'string' }) // 'explore', 'following', 'everyone'
    let date
    if (type === 'explore') {
      date = space.showInExploreUpdatedAt
    } else if (type === 'following') {
      date = space.updatedAt
    } else if (type === 'everyone') {
      date = space.createdAt
    }
    return dayjs(date)
  },

  // Journal Space 🌚

  journalSpace ({ currentUser, isTomorrow, weather, journalDailyPrompt, journalDailyDateImage }) {
    let date = dayjs(new Date())
    if (isTomorrow) {
      date = date.add(1, 'day')
    }
    const moonPhase = moonphase(date)
    // space
    const spaceId = nanoid()
    let space = this.emptySpace(spaceId)
    space.name = this.journalSpaceName({ isTomorrow })
    space.privacy = 'private'
    space.moonPhase = moonPhase.name
    space.removedCards = []
    space.userId = currentUser.id
    space.connectionTypes = []
    space.connections = []
    space.isTemplate = false
    space.isHidden = false
    space.isFromTweet = false
    space.collaboratorKey = nanoid()
    space = this.newSpaceBackground(space, currentUser)
    space.background = space.background || consts.defaultSpaceBackground
    // date
    let dateCard = {
      id: nanoid(),
      name: `${journalDailyDateImage} ${date.format('dddd, MMM D')}`,
      x: 86,
      y: 157,
      resizeWidth: 260,
      frameId: 0
    }
    if (weather) {
      dateCard.name += weather
    }
    space.cards.push(dateCard)
    // daily prompt
    if (journalDailyPrompt) {
      let card = { id: nanoid() }
      card.name = journalDailyPrompt
      const position = this.promptCardPosition(space.cards, card.name)
      card.x = position.x
      card.y = 467
      card.z = 0
      card.spaceId = spaceId
      card.frameId = 5
      space.cards.push(card)
    }
    // user prompts
    const userPrompts = currentUser.journalPrompts
    userPrompts.forEach(prompt => {
      if (!prompt.name) { return }
      let card = { id: nanoid() }
      card.name = prompt.name
      const position = this.promptCardPosition(space.cards, card.name)
      card.x = position.x
      card.y = position.y
      card.z = 0
      card.spaceId = spaceId
      space.cards.push(card)
    })
    return space
  },

  journalSpaceName ({ isTomorrow, isYesterday }) {
    let date = dayjs(new Date())
    if (isTomorrow) {
      date = date.add(1, 'day')
    } else if (isYesterday) {
      date = date.subtract(1, 'day')
    }
    return `${date.format('ddd MMM D/YY')}` // Thu Oct 8/20
  },
  journalSpaceDateFromName (name) {
    // https://regexr.com/6471p
    const datePattern = new RegExp(/^['A-Za-z]+ ['A-Za-z]+ [0-9]+\/[0-9]{2}/g)
    let matches = name.match(datePattern)
    if (matches) {
      return matches[0]
    }
  },
  promptCardPosition (cards, newCardName) {
    const lastCard = last(cards)
    const lastCardY = lastCard.y
    let lastCardName = lastCard.name.replaceAll('[', '')
    lastCardName = lastCardName.replaceAll(']', '')
    const averageCharactersPerLine = 25
    const lines = Math.ceil(lastCardName.length / averageCharactersPerLine)
    const lineHeight = 14
    const padding = 26
    const lastCardHeight = (lines * lineHeight) + padding + lines
    let distanceBetween = 50
    let x = 120
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
  spaceUrl ({ spaceId, spaceName, collaboratorKey, readOnlyKey }) {
    let url
    if (collaboratorKey || readOnlyKey) {
      url = this.inviteUrl({ spaceId, spaceName, collaboratorKey, readOnlyKey })
    } else {
      url = this.url({ name: spaceName, id: spaceId })
    }
    return url
  },
  spaceAndCardIdFromUrl (url) {
    url = new URL(url)
    return this.spaceAndCardIdFromPath(url.pathname) // /spaceId/cardId
  },
  urlFromSpaceAndCard ({ spaceId, cardId }) {
    let url = `${consts.kinopioDomain()}/${spaceId}`
    if (cardId) {
      url = `${url}/${cardId}`
    }
    return url
  },
  inviteUrl ({ spaceId, spaceName, collaboratorKey, readOnlyKey }) {
    spaceName = this.normalizeString(spaceName)
    let invite = ''
    if (collaboratorKey) {
      invite = `collaboratorKey=${collaboratorKey}`
    } else if (readOnlyKey) {
      invite = `readOnlyKey=${readOnlyKey}`
    }
    const url = `${consts.kinopioDomain()}/invite?spaceId=${spaceId}&${invite}&name=${spaceName}`
    return url
  },
  spaceAndCardIdFromPath (path) {
    // https://regexr.com/5kr4g
    // matches (text after /) twice
    const urlPattern = new RegExp(/\/([^?\s/]+)\/{0,1}([^?\s/]+){0,1}/i)
    let matches = path.match(urlPattern)
    if (!matches) { return }
    const spaceUrl = matches[1]
    const spaceId = spaceUrl.substring(spaceUrl.length - uuidLength, spaceUrl.length)
    matches = {
      spaceUrl,
      cardId: matches[2],
      spaceId
    }
    return matches
  },
  spaceIdFromUrl (url) {
    url = url || window.location.href
    url = url.replaceAll('?hidden=true', '')
    const id = url.substring(url.length - uuidLength, url.length)
    if (this.idIsValid(id)) { return id }
  },
  idIsValid (id) {
    if (!id) { return }
    if (id.includes('/')) {
      return undefined
    }
    return true
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
  urlIsValidLocalhost (url) {
    // https://regexr.com/7vc0o
    // matches ':' then numbers
    // then ends or continues with '/' or '?'
    const portPattern = new RegExp(/(:[0-9]+)(\?|\/(\w+|\d+)| |$)/igm)
    if (url.match(portPattern)) {
      return true
    }
  },
  urlIsValidTld (url) {
    if (!url) { return }
    const isLocalhostUrl = url.match(this.localhostUrlPattern())
    const isDevelopmentUrl = url.includes(consts.kinopioDomain())
    if (isLocalhostUrl || isDevelopmentUrl) { return true }
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
  emailsFromString (string) {
    // https://stackoverflow.com/a/42408099
    return string.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gim) || []
  },
  urlsFromString (string) {
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
    // starts with http/s protocol
    // followed by alphanumerics
    // then '.', or ':' + portnumbers
    // followed by alphanumerics
    // then trailing '/' or '-'
    // matches multiple urls and returns [urls]
    const urlPattern = new RegExp(/(^|\n| )(http[s]?:\/\/)[^\s(["<>]{2,}(\.|(:[0-9]+))[^\s."><]+[\w=]\/?-?/igm)
    let localhostUrls = string.match(this.localhostUrlPattern()) || []
    let urls = string.match(urlPattern) || []
    urls = urls.concat(localhostUrls)
    urls = urls.filter(url => Boolean(url))
    if (!urls.length) { return }
    // filter out empty or non-urls
    urls = urls.map(url => this.trim(url))
    urls = urls.filter(url => {
      if (!url) { return }
      // const urlIsMarkdownEmphasis = Boolean(this.markdown().emphasisPattern2.exec(url))
      const isInvalidUrl = this.urlIsFloatOrIp(url) || this.urlIsCurrencyFloat(url)
      if (!isInvalidUrl) {
        return true
      }
    })
    // ensure url has protocol
    urls = urls.map(url => {
      const isFile = this.urlIsFile(url)
      const hasProtocol = this.urlHasProtocol(url)
      if (isFile || hasProtocol) {
        return url
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
  urlWithProtocol (url) {
    if (!url) { return }
    if (this.urlHasProtocol(url)) { return url }
    return `https://${url}`
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
    const imageUrlPattern = new RegExp(/(?:\.gif|\.jpg|\.jpeg|\.jpe|\.jif|\.jfif|\.png|\.svg|\.webp|\.avif)(?:\n| |\?|&)/igm)
    const isImage = url.match(imageUrlPattern) || url.includes('is-image=true')
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
    const audioUrlPattern = new RegExp(/(?:\.mp3|\.m4a|\.ogg)(?:\n| |\?|&)/igm)
    const isAudio = url.match(audioUrlPattern)
    return Boolean(isAudio)
  },
  urlIsFile (url) {
    if (!url) { return }
    url = url + ' '
    const fileUrlPattern = new RegExp(/(?:\.txt|\.md|\.markdown|\.pdf|\.ppt|\.pptx|\.doc|\.docx|\.csv|\.xsl|\.xslx|\.rtf|\.zip|\.tar|\.xml|\.psd|\.ai|\.ind|\.sketch|\.mov|\.heic|\.7z|\.woff|\.woff2|\.otf|\.ttf|\.wav|\.flac)(?:\n| |\?|&)/igm)
    const isFile = url.toLowerCase().match(fileUrlPattern)
    return Boolean(isFile)
  },
  urlIsInvite (url) {
    url = this.urlWithProtocol(url)
    if (!url) { return }
    try {
      url = new URL(url)
      return url.pathname === '/invite'
    } catch (error) {
      console.warn('🚑 urlIsInvite', error)
    }
  },
  urlIsSpace (url) {
    if (!url) { return }
    if (this.urlIsInvite(url)) { return true }
    let spaceUrlPattern
    if (consts.isDevelopment()) {
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
  urlIsWebsite (url) {
    const isImage = this.urlIsImage(url)
    const isVideo = this.urlIsVideo(url)
    const isAudio = this.urlIsAudio(url)
    const isFile = this.urlIsFile(url)
    const isSpace = this.urlIsSpace(url)
    return !isImage && !isVideo && !isAudio && !isFile && !isSpace
  },
  urlIsYoutube (url) {
    if (url.includes('/channel/')) { return }
    const domains = ['https://youtube.com', 'https://www.youtube.com', 'https://m.youtube.com', 'https://youtu.be']
    let isRoot, isVideo
    domains.forEach(domain => {
      if (url === domain) { isRoot = true }
      if (url === domain + '/') { isRoot = true }
    })
    if (isRoot) { return }
    domains.forEach(domain => {
      if (url.includes(domain)) { isVideo = true }
    })
    return isVideo
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
  removeTrackingQueryStringsFromURLs (name) {
    const urls = this.urlsFromString(name)
    // https://www.bleepingcomputer.com/PoC/qs.html
    // https://www.bleepingcomputer.com/news/security/new-firefox-privacy-feature-strips-urls-of-tracking-parameters
    const trackingKeys = ['is_copy_url', 'is_from_webapp', 'utm_', 'oly_enc_id', 'oly_anon_id', '__s', 'vero_id', '_hsenc', 'mkt_tok', 'fbclid', 'mc_eid', 'pf_', 'pd_']
    urls.forEach(url => {
      url = url.trim()
      url = this.removeTrailingSlash(url)
      const queryString = this.queryString(url)
      const domain = this.urlWithoutQueryString(url)
      if (!queryString) { return }
      let queryObject = qs.decode(queryString)
      let keys = Object.keys(queryObject)
      let keysToRemove = []
      trackingKeys.forEach(trackingKey => {
        keys.forEach(key => {
          if (key.startsWith(trackingKey)) {
            keysToRemove.push(key)
          }
        })
      })
      if (!keysToRemove.length) { return }
      console.log('🫧 trackingKeysToRemove', keysToRemove)
      keysToRemove.forEach(key => delete queryObject[key])
      const newUrl = qs.encode(domain, queryObject)
      name = name.replace(url, newUrl)
    })
    return name
  },
  addHiddenQueryStringToURLs (name) {
    const urls = this.urlsFromString(name)
    urls.forEach(url => {
      if (url.includes('https://www.icloud.com')) { return } // https://club.kinopio.club/t/icloud-albums-dont-work-with-hidden-true/1153
      url = url.trim()
      url = this.removeTrailingSlash(url)
      if (!this.urlIsWebsite(url)) { return }
      const queryString = this.queryString(url) || ''
      const domain = this.urlWithoutQueryString(url)
      let queryObject = {}
      if (queryString) {
        queryObject = qs.decode(queryString)
      }
      queryObject.hidden = 'true'
      const newUrl = qs.encode(domain, queryObject)
      name = name.replace(url, newUrl)
    })
    return name
  },
  removeHiddenQueryStringFromURLs (name) {
    const urls = this.urlsFromString(name)
    urls.forEach(url => {
      const prevUrl = url
      url = url.replace('?hidden=true', '')
      url = url.replace('&hidden=true', '')
      name = name.replace(prevUrl, url)
    })
    return name
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
      return this.uniqueCardPosition(point, existingPoints)
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
      isDonor: user.isDonor
    }
  },
  spaceMeta (space) {
    return {
      id: space.id,
      name: space.name,
      privacy: space.privacy,
      previewThumbnailImage: space.previewThumbnailImage,
      showInExplore: space.showInExplore
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

  isFileTooBig ({ file, userIsUpgraded, spaceUserIsUpgraded }) {
    const isUpgraded = userIsUpgraded || spaceUserIsUpgraded
    const sizeLimit = 1024 * 1024 * 5 // 5mb
    if (file.size > sizeLimit && !isUpgraded) {
      return true
    }
  },
  async dataFromClipboard () {
    let text, file
    const items = await navigator.clipboard.read()
    console.log('🍇 clipboard paste', items)
    for (const item of items) {
      const imageMatch = 'image/'
      const imageType = item.types.find(type => {
        if (!type) { return }
        return type.includes(imageMatch)
      })
      if (imageType) {
        const blob = await item.getType(imageType)
        let index = imageType.indexOf(imageMatch)
        index = index + imageMatch.length
        const extension = imageType.substring(index)
        file = new File([blob], `pasted.${extension}`)
      } else {
        text = await navigator.clipboard.readText()
      }
    }
    return { text, file }
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
    search = search.replaceAll('+', '\\+')
    const extraCharacters = 2 + (search.length - prevSearch.length)
    const searchPattern = new RegExp(search, 'gim')
    let results = []
    while (searchPattern.exec(string)) {
      const position = searchPattern.lastIndex - search.length + extraCharacters
      results.push(position)
    }
    return results
  },
  tagStyle (tag) {
    let styles = { backgroundColor: tag.color }
    const isDark = this.colorIsDark(tag.color)
    if (isDark) {
      const color = this.cssVariable('primary')
      styles.color = this.invertColor(color)
    }
    return styles
  },

  // App Buttons

  commandsFromString (string) {
    const allowedCommands = Object.keys(consts.systemCommands)
    // https://regexr.com/7h3ia
    const commandPattern = new RegExp(/::systemCommand=\w+/gm)
    let commands = string.match(commandPattern)
    if (!commands) { return }
    commands = commands.filter(command => {
      const name = this.commandNameFromCommand(command)
      return allowedCommands.includes(name)
    })
    return commands
  },
  commandNameFromCommand (string) {
    // https://regexr.com/7h3ig
    // ::system_command=xyz → matches xyz
    const commandNamePattern = new RegExp(/=\w+/gm)
    let name = string.match(commandNamePattern)
    name = name[0]
    name = name.replace('=', '')
    return name
  },

  // Name Segments 🎫

  segmentsWithTextSegments (name, segments) {
    let currentStart = 0
    let textSegments = []
    segments = sortBy(segments, ['startPosition'])
    segments.forEach(({ startPosition, endPosition }) => {
      if (currentStart < startPosition) {
        const start = currentStart
        const end = startPosition
        const content = name.substring(start, end)
        textSegments.push({ startPosition: start, endPosition: end, content, isText: true })
      }
      currentStart = endPosition
    })
    // handle trailing text
    if (currentStart < name.length) {
      const start = currentStart
      const end = name.length
      const content = name.substring(start, end)
      textSegments.push({ startPosition: start, endPosition: end, content, isText: true })
    }
    segments = segments.concat(textSegments)
    segments = sortBy(segments, ['startPosition'])
    return segments
  },
  cardNameSegments (name) {
    if (!name) { return [] }
    const tags = this.tagsFromString(name) || []
    const urls = this.urlsFromString(name) || []
    const commands = this.commandsFromString(name) || []
    const markdownLinks = name.match(this.markdown().linkPattern) || []
    const links = urls.filter(url => {
      const linkIsMarkdown = markdownLinks.find(markdownLink => markdownLink.includes(url))
      if (linkIsMarkdown) { return }
      return this.urlIsSpace(url) || this.urlIsInvite(url)
    })
    const files = urls.filter(url => this.urlIsFile(url))
    let segments = []
    tags.forEach(tag => {
      // remove previous duplicate tag names
      let startPositions = this.indexesOf(name, tag)
      segments.forEach(segment => {
        startPositions = startPositions.filter(position => position > segment.startPosition)
      })
      const startPosition = startPositions[0]
      const endPosition = startPosition + tag.length
      segments.push({ tag, startPosition, endPosition, name: tag.substring(2, tag.length - 2), isTag: true })
    })
    links.forEach(link => {
      const startPosition = name.indexOf(link)
      const endPosition = startPosition + link.length
      const { spaceId, spaceUrl, cardId } = this.spaceAndCardIdFromUrl(link)
      let segment = { link, name: link, startPosition, endPosition, spaceId, spaceUrl, cardId, isLink: true }
      if (this.urlIsInvite(link)) {
        segment.isInviteLink = true
        const url = new URL(link)
        const queryObject = qs.decode(url.search)
        segment.spaceId = queryObject.spaceId
        segment.collaboratorKey = queryObject.collaboratorKey
      } else if (this.urlIsSpace(link)) {
        segment.isLink = true
      }
      segments.push(segment)
    })
    files.forEach(file => {
      const startPosition = name.indexOf(file)
      const endPosition = startPosition + file.length
      segments.push({ file, startPosition, endPosition, name: this.fileNameFromUrl(file), isFile: true })
    })
    commands.forEach(command => {
      const startPosition = name.indexOf(command)
      const endPosition = startPosition + command.length
      const commandName = this.commandNameFromCommand(command)
      segments.push({ startPosition, endPosition, command: commandName, name: consts.systemCommands[commandName], isCommand: true })
    })
    segments = this.segmentsWithTextSegments(name, segments)
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
      h4Pattern: /^#### ()(.+$)/gmi,
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
          type: 'h4',
          result: markdown.h4Pattern.exec(text)
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
  },
  languageFromCodeBlock (string) {
    // https://regexr.com/7lt5b
    // matches first word on first line
    const languagePattern = /^(\w)+\s/g
    let newString = string
    let match = string.match(languagePattern)
    if (!match) { return }
    const name = match[0].trim()
    // match language
    let language = codeLanguages.find(codeLanguage => {
      const isName = codeLanguage.name === name
      let isAlias
      if (codeLanguage.aliases) {
        isAlias = codeLanguage.aliases.includes(name)
      }
      return isName || isAlias
    })
    if (!language) { return }
    newString = string.replace(match[0], '')
    return { language, newString }
  },

  // Background Gradient

  backgroundGradientLayers () {
    let layers = []
    const numberOfLayers = 6
    times(numberOfLayers, function (index) {
      let layer = {
        x: random(140),
        y: random(140),
        color1: randomRGBA(1),
        color2: randomRGBA(0)
      }
      layers.push(layer)
    })
    const backgroundLayer = {
      color: randomRGBA(1)
    }
    layers.push(backgroundLayer)
    return layers
  }
}
