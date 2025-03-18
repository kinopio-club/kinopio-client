<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import collisionDetection from '@/collisionDetection.js'
import postMessage from '@/postMessage.js'
import DropGuideLine from '@/components/layers/DropGuideLine.vue'
const store = useStore()

// a sequence of circles that's broadcasted to others and is used for multi-card selection
const circleRadius = 20
const circleSelectionRadius = circleRadius - 10 // magnitude of sensitivity
const maxIterations = 300 // higher is longer tail
const rateOfIterationDecay = 0.08 // higher is faster tail decay
const rateOfIterationDecaySlow = 0.03
let prevScroll
let prevPosition, prevCursor
let canvas, gl, startCursor, timer
// WebGL variables
let circleProgram
let positionBuffer, sizeBuffer, colorBuffer, alphaBuffer
// paint select
// ephemeral brush strokes that select items
let paintSelectCircles = []
// initial circles
// shows immediate feedback without having to move cursor
let initialCircles = []
// remote paint strokes
let remotePaintingCircles = []
// locking
// long press to lock scrolling
const lockingPreDuration = 100 // ms
const lockingDuration = 150 // ms
const initialLockCircleRadius = 65
let currentUserIsLocking, lockingStartTime, shouldCancelLocking, lockingPercentComplete

// notify offscreen cards
// similar to initial circle feedback
let notifyOffscreenCircles = []
let notifyOffscreenCircleCanvas, notifyOffscreenCirclesTimer

// post scroll timer
// runs scroll events after scrollend to compensate for android inertia scrolling
const postScrollDuration = 300 // ms
let postScrollAnimationTimer, postScrollStartTime, shouldCancelPostScroll

let selectableCardsInViewport = []
let selectableBoxes = []
let selectableConnectionsInViewport = []
let selectableCardsGrid

let unsubscribe

// WebGL shaders
const vertexShaderSource = `
  attribute vec2 a_position;
  attribute float a_size;
  
  uniform vec2 u_resolution;
  
  void main() {
    // Convert from pixel space to clip space
    // Fix scaling issues by properly normalizing coordinates
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    
    // Flip Y to match canvas coordinate system
    gl_Position = vec4(clipSpace.x, -clipSpace.y, 0, 1);
    
    // Make sure point size is properly scaled
    gl_PointSize = a_size;
  }
`

const fragmentShaderSource = `
  precision mediump float;
  
  uniform vec4 u_color;
  uniform float u_alpha;
  
  void main() {
    // Calculate distance from center of point (normalized coordinates)
    float distance = length(gl_PointCoord - vec2(0.5));
    
    // Create a sharp circle
    if (distance > 0.5) {
      discard; // Outside of circle
    }
    
    // Apply color with alpha
    gl_FragColor = vec4(u_color.rgb, u_alpha);
  }
`

// Initialize WebGL
const initWebGL = () => {
  // Get proper dimensions from the element
  const displayWidth = canvas.clientWidth
  const displayHeight = canvas.clientHeight

  // Set canvas size correctly (important for resolution)
  const dpr = window.devicePixelRatio || 1
  canvas.width = displayWidth * dpr
  canvas.height = displayHeight * dpr

  // Log dimensions for debugging
  console.debug(`Canvas size: ${canvas.width} x ${canvas.height}, DPR: ${dpr}`)
  console.debug(`Display size: ${displayWidth} x ${displayHeight}`)

  // Try to get WebGL context with proper options
  gl = canvas.getContext('webgl', {
    alpha: true,
    premultipliedAlpha: false,
    antialias: true
  })

  if (!gl) {
    console.error('WebGL not supported')
    return false
  }

  // Create shader program
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
  circleProgram = createProgram(gl, vertexShader, fragmentShader)

  // Create buffers
  positionBuffer = gl.createBuffer()
  sizeBuffer = gl.createBuffer()

  // Set up WebGL state
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.clearColor(0, 0, 0, 0)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  return true
}

// Create a shader
const createShader = (gl, type, source) => {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }

  return shader
}

// Create a program
const createProgram = (gl, vertexShader, fragmentShader) => {
  const program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program))
    return null
  }

  return program
}

// Convert hex color to RGB values (0-1 range)
const hexToRgb = (hex) => {
  // Handle hex colors with or without #
  const normalizedHex = hex.charAt(0) === '#' ? hex.substring(1) : hex

  // Handle both 3-digit and 6-digit hex
  const r = normalizedHex.length === 3
    ? parseInt(normalizedHex.charAt(0) + normalizedHex.charAt(0), 16) / 255
    : parseInt(normalizedHex.substring(0, 2), 16) / 255

  const g = normalizedHex.length === 3
    ? parseInt(normalizedHex.charAt(1) + normalizedHex.charAt(1), 16) / 255
    : parseInt(normalizedHex.substring(2, 4), 16) / 255

  const b = normalizedHex.length === 3
    ? parseInt(normalizedHex.charAt(2) + normalizedHex.charAt(2), 16) / 255
    : parseInt(normalizedHex.substring(4, 6), 16) / 255

  // Log color parsing for debugging
  console.debug(`Color ${hex} parsed as RGB: ${r}, ${g}, ${b}`)

  return { r, g, b }
}

onMounted(() => {
  unsubscribe = store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerPaintFramePosition') {
      const event = mutation.payload
      const position = utils.cursorPositionInSpace(event)
      createPaintingCircle(event)
      selectItems([position])
    } else if (mutation.type === 'triggerUpdatePaintSelectCanvasPositionOffset') {
      updateCirclesWithScroll()
    } else if (mutation.type === 'triggerAddRemotePaintingCircle') {
      let circle = mutation.payload
      delete circle.type
      const position = updateRemotePosition(circle)
      circle.x = position.x
      circle.y = position.y
      createRemotePaintingCircle(circle)
    } else if (mutation.type === 'triggerNotifyOffscreenCardCreated') {
      const card = mutation.payload
      const user = store.getters['currentSpace/userById'](card.userId)
      const color = user.color
      const position = updateRemotePosition(card)
      let circle = {
        x: position.x,
        y: position.y,
        color,
        shouldDrawOffscreen: true
      }
      if (checkIsCircleVisible(circle)) { return }
      createNotifyOffscreenCircle(circle)
    }
  })

  // init canvas
  canvas = document.getElementById('paint-select-canvas')

  // Initialize WebGL
  const useWebGL = initWebGL()
  if (!useWebGL) {
    console.error('WebGL initialization failed')
    return
  }

  // trigger stopPainting even if mouse is outside window
  window.addEventListener('mouseup', stopPainting)
  window.addEventListener('touchend', stopPainting)
  // mousedown
  window.addEventListener('mousedown', startPainting)
  window.addEventListener('touchstart', startPainting)
  // mousemove
  window.addEventListener('mousemove', painting)
  window.addEventListener('touchmove', painting)
  // shift circle positions with scroll to simulate full size canvas
  updatePrevScrollPosition()
  window.addEventListener('scroll', userScroll)
  window.addEventListener('touchmove', userScroll) // android fix
  window.addEventListener('load', clearCircles)
  startPostScroll()
  state.dropGuideLineIsVisible = !utils.isMobile()
  window.addEventListener('visibilitychange', clearRect)
})

onBeforeUnmount(() => {
  window.removeEventListener('mouseup', stopPainting)
  window.removeEventListener('touchend', stopPainting)
  window.removeEventListener('scroll', userScroll)
  window.removeEventListener('touchmove', userScroll)
  window.removeEventListener('load', clearCircles)
  window.removeEventListener('visibilitychange', clearRect)
  window.removeEventListener('mousedown', startPainting)
  window.removeEventListener('touchstart', startPainting)
  window.removeEventListener('mousemove', painting)
  window.removeEventListener('touchmove', painting)
  unsubscribe()

  if (gl) {
    // Clean up WebGL resources
    gl.deleteProgram(circleProgram)
    gl.deleteBuffer(positionBuffer)
    gl.deleteBuffer(sizeBuffer)
  }
})

const state = reactive({
  currentCursor: {},
  dropGuideLineIsVisible: false
})

// Clear canvas
const clearRect = () => {
  gl.clear(gl.COLOR_BUFFER_BIT)
}

const triggerHideTouchInterface = () => {
  if (!store.state.currentUserIsPaintingLocked) { return }
  store.commit('triggerHideTouchInterface')
}

const isCanvasScope = (event) => {
  const fromDialog = event.target.closest('dialog')
  if (fromDialog) { return }
  const tagName = event.target.tagName
  return tagName === 'CANVAS'
}

// current user
const currentUserColor = computed(() => store.state.currentUser.color)
const userCannotEditSpace = computed(() => !store.getters['currentUser/canEditSpace']())
const isPanning = computed(() => store.state.currentUserIsPanningReady)
const isBoxSelecting = computed(() => store.state.currentUserIsBoxSelecting)
const toolbarIsCard = computed(() => store.state.currentUserToolbar === 'card')
const toolbarIsBox = computed(() => store.state.currentUserToolbar === 'box')
const toolbarIsDrawing = computed(() => store.state.currentUserToolbar === 'drawing')

// page size
// keep canvases updated to viewport size so you can draw on newly created areas
const pageHeight = computed(() => store.state.pageHeight)
const pageWidth = computed(() => store.state.pageWidth)
const viewportHeight = computed(() => store.state.viewportHeight)
const viewportWidth = computed(() => store.state.viewportWidth)
const spaceZoomDecimal = computed(() => store.getters.spaceZoomDecimal)

// Watch for canvas size changes to update WebGL viewport
watch([pageWidth, pageHeight, viewportWidth, viewportHeight], () => {
  if (gl) {
    canvas.width = viewportWidth.value * window.devicePixelRatio
    canvas.height = viewportHeight.value * window.devicePixelRatio
    gl.viewport(0, 0, canvas.width, canvas.height)
  }
})

// selectable items
const updateSelectableCardsInViewport = () => {
  const selectableCards = store.getters['currentCards/isSelectableInViewport']
  if (!selectableCards) { return }
  selectableCardsInViewport = selectableCards
  selectableCardsGrid = collisionDetection.createGrid(selectableCards)
}

const updateSelectableBoxesInViewport = () => {
  const boxes = store.getters['currentBoxes/isNotLocked']
  let array = []
  boxes.forEach(box => {
    const element = document.querySelector(`.box-info[data-box-id="${box.id}"]`)
    if (!element) { return }
    if (element.dataset.isVisibleInViewport === 'false') { return }
    const rect = element.getBoundingClientRect()
    box = {
      id: box.id,
      name: box.name,
      x: box.x,
      y: box.y,
      width: rect.width,
      height: rect.height
    }
    array.push(box)
  })
  selectableBoxes = array
}

const updateSelectableConnectionsInViewport = () => {
  const selectableConnections = store.getters['currentConnections/isSelectableInViewport']()
  if (!selectableConnections) { return }
  selectableConnectionsInViewport = selectableConnections
}

// position
const updateRemotePosition = (position) => {
  const zoom = spaceZoomDecimal.value
  const scroll = { x: window.scrollX, y: window.scrollY }
  const space = document.getElementById('space')
  const rect = space.getBoundingClientRect()
  position = {
    x: (position.x * zoom) + rect.x + scroll.x,
    y: (position.y * zoom) + rect.y + scroll.y
  }
  return position
}

const userScroll = () => {
  if (postScrollAnimationTimer) {
    shouldCancelPostScroll = true
  }
  // update selectable cards during paint autoscroll at edges
  if (store.state.currentUserIsPainting) {
    updateSelectableCardsInViewport()
    updateSelectableBoxesInViewport()
    updateSelectableConnectionsInViewport()
  }
  scroll()
}

const scroll = () => {
  updateCirclesWithScroll()
  cancelLocking()
}

const clearCircles = () => {
  initialCircles = []
  paintSelectCircles = []
  remotePaintingCircles = []
}

const updatePrevScrollPosition = () => {
  prevScroll = {
    x: window.scrollX,
    y: window.scrollY
  }
}

const updateCirclePositions = (circles, scrollDelta) => {
  return circles.map(circle => {
    circle.x = circle.x - scrollDelta.x
    circle.y = circle.y - scrollDelta.y
    return circle
  })
}

const updateCirclesWithScroll = () => {
  if (store.state.isPinchZooming) {
    updatePrevScrollPosition()
    return
  }
  const scrollDelta = {
    x: window.scrollX - prevScroll.x,
    y: window.scrollY - prevScroll.y
  }
  if (initialCircles.length) {
    initialCircles = updateCirclePositions(initialCircles, scrollDelta) // covers locking circles of varialbe radius/
  }
  if (paintSelectCircles.length) {
    paintSelectCircles = updateCirclePositions(paintSelectCircles, scrollDelta)
  }
  updatePrevScrollPosition()
}

const updateCircleForAndroid = (circle) => {
  if (!utils.isAndroid()) { return circle }
  circle.x = circle.x - window.visualViewport.offsetLeft
  circle.y = circle.y - window.visualViewport.offsetTop
  return circle
}

const checkIsCircleVisible = (circle) => {
  let { x, y, radius } = circle
  radius = radius || circleRadius
  let isBetween = {
    value: x + radius,
    min: 0,
    max: viewportWidth.value
  }
  const isCircleVisibleX = utils.isBetween(isBetween)
  isBetween = {
    value: y + radius,
    min: 0,
    max: viewportHeight.value
  }
  const isCircleVisibleY = utils.isBetween(isBetween)
  return Boolean(isCircleVisibleX && isCircleVisibleY)
}

const offscreenCircle = (circle) => {
  if (circle.x > viewportWidth.value) {
    circle.x = viewportWidth.value
  } else if (circle.x < 0) {
    circle.x = 0
  }
  if (circle.y > viewportHeight.value) {
    circle.y = viewportHeight.value
  } else if (circle.y < 0) {
    circle.y = 0
  }
  return circle
}

// Render circles using WebGL (batch rendering for performance)
const renderCirclesGL = (circles) => {
  if (circles.length === 0) return

  // Use the program
  gl.useProgram(circleProgram)

  // Set the resolution uniform - IMPORTANT: use actual canvas size for correct scaling
  const resolutionUniformLocation = gl.getUniformLocation(circleProgram, 'u_resolution')
  gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height)

  // For each unique color, batch render circles
  const colorGroups = {}

  circles.forEach(circle => {
    if (!circle.color) return

    // Skip circles with very low alpha
    let decay = circle.shouldDecaySlow ? rateOfIterationDecaySlow : rateOfIterationDecay
    let alpha = circle.alpha || utils.exponentialDecay(circle.iteration, decay)
    if (alpha < 0.05) return

    // Group by color
    if (!colorGroups[circle.color]) {
      colorGroups[circle.color] = []
    }

    // Make sure circle is visible or handle offscreen rendering
    circle = updateCircleForAndroid(circle)
    const isCircleVisible = checkIsCircleVisible(circle)
    if (!isCircleVisible && !circle.shouldDrawOffscreen) return
    if (!isCircleVisible && circle.shouldDrawOffscreen) circle = offscreenCircle(circle)

    // Account for device pixel ratio when setting positions
    const dpr = window.devicePixelRatio || 1
    colorGroups[circle.color].push({
      x: circle.x * dpr,
      y: circle.y * dpr,
      radius: (circle.radius || circleRadius) * dpr,
      alpha
    })
  })

  // For each color group, render all circles
  Object.entries(colorGroups).forEach(([color, circleGroup]) => {
    if (circleGroup.length === 0) return

    const rgb = hexToRgb(color)

    // Prepare position and size arrays
    const positions = []
    const sizes = []
    const alphas = []

    circleGroup.forEach(circle => {
      positions.push(circle.x, circle.y)
      sizes.push(circle.radius * 2) // Double the radius for diameter
      alphas.push(circle.alpha)
    })

    // Set the color uniform - fixed to ensure color is correctly applied
    const colorUniformLocation = gl.getUniformLocation(circleProgram, 'u_color')
    gl.uniform4f(colorUniformLocation, rgb.r, rgb.g, rgb.b, 1.0)

    // Set position attribute
    const positionAttributeLocation = gl.getAttribLocation(circleProgram, 'a_position')
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(positionAttributeLocation)
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)

    // Set size attribute
    const sizeAttributeLocation = gl.getAttribLocation(circleProgram, 'a_size')
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(sizeAttributeLocation)
    gl.vertexAttribPointer(sizeAttributeLocation, 1, gl.FLOAT, false, 0, 0)

    // Draw each circle with its own alpha
    for (let i = 0; i < circleGroup.length; i++) {
      const alphaUniformLocation = gl.getUniformLocation(circleProgram, 'u_alpha')
      gl.uniform1f(alphaUniformLocation, alphas[i])
      gl.drawArrays(gl.POINTS, i, 1)
    }
  })
}

const shouldCancel = (event) => {
  let shouldCancelOutsideOfBrowser = !(event.target instanceof Element)
  if (shouldCancelOutsideOfBrowser) {
    return false
  }
  const fromDialog = event.target.closest('dialog')
  const fromHeader = event.target.closest('header')
  const fromFooter = event.target.closest('footer')
  return fromDialog || fromHeader || fromFooter
}

const stopPainting = (event) => {
  if (store.state.isAddPage) { return }
  if (shouldCancel(event)) { return }
  startCursor = startCursor || {}
  const endCursor = utils.cursorPositionInViewport(event)
  const shouldAddCard = store.state.shouldAddCard
  currentUserIsLocking = false
  shouldCancelLocking = false
  store.commit('currentUserIsPaintingLocked', false)
  store.commit('currentUserIsPainting', false)
  if (utils.cursorsAreClose(startCursor, endCursor) && shouldAddCard && event.cancelable) {
    store.commit('shouldAddCard', true)
    event.preventDefault()
  } else {
    store.commit('shouldAddCard', false)
  }
  // prevent mouse events from firing after touch events on touch device
  if (event.cancelable) { event.preventDefault() }
  startPostScroll()
}

// Post Scrolling (for android)
const startPostScroll = () => {
  shouldCancelPostScroll = false
  if (!postScrollAnimationTimer) {
    postScrollAnimationTimer = window.requestAnimationFrame(postScrollFrame)
  }
}

const postScrollFrame = (timestamp) => {
  if (!postScrollStartTime) {
    postScrollStartTime = timestamp
  }
  const elaspedTime = timestamp - postScrollStartTime
  const percentComplete = (elaspedTime / postScrollDuration) // between 0 and 1
  if (shouldCancelPostScroll) {
    endPostScroll()
  } else if (percentComplete <= 1) {
    scroll()
    window.requestAnimationFrame(postScrollFrame)
  } else {
    endPostScroll()
  }
}

const endPostScroll = () => {
  shouldCancelPostScroll = false
  window.cancelAnimationFrame(postScrollAnimationTimer)
  postScrollAnimationTimer = undefined
  postScrollStartTime = undefined
}

// paint circles
const createPaintingCircle = (event) => {
  const isTouch = Boolean(event.touches)
  const isPaintingLocked = store.state.currentUserIsPaintingLocked
  if (isTouch && !isPaintingLocked) { return }
  if (isBoxSelecting.value) { return }
  if (isTouch && !isPaintingLocked) { return }
  if (utils.isMultiTouch(event)) { return }
  createPaintingCircles(event)
  const position = utils.cursorPositionInSpace(event)
  selectItemsBetweenCurrentAndPrevPosition(position)
}

const createPaintingCircles = (event) => {
  state.currentCursor = utils.cursorPositionInViewport(event)
  if (!prevCursor) {
    prevCursor = state.currentCursor
    return
  }
  const color = store.state.currentUser.color
  const points = utils.pointsBetweenTwoPoints(prevCursor, state.currentCursor)
  points.forEach(point => {
    const circle = { x: point.x, y: point.y, color, iteration: 0 }
    paintSelectCircles.push(circle)
  })
  const circle = { x: state.currentCursor.x, y: state.currentCursor.y, color, iteration: 0 }
  broadcastCircle(event, circle)
  prevCursor = state.currentCursor
}

const startPainting = (event) => {
  if (toolbarIsDrawing.value) { return }
  if (!isCanvasScope(event)) { return }
  if (isPanning.value) { return }
  if (isBoxSelecting.value) { return }
  if (store.state.isPinchZooming) { return }
  if (utils.isMultiTouch(event)) { return }
  if (!utils.isEventTouchOrMouseLeftButton(event)) { return }
  updateSelectableCardsInViewport()
  updateSelectableBoxesInViewport()
  updateSelectableConnectionsInViewport()
  startCursor = utils.cursorPositionInViewport(event)
  state.currentCursor = startCursor
  store.dispatch('currentCards/updateCanBeSelectedSortedByY')
  if (utils.isMultiTouch(event)) { return }
  startLocking()
  if (event.touches) {
    store.commit('currentUserIsPainting', false)
  } else {
    store.commit('currentUserIsPainting', true)
    createInitialCircle()
  }
  const multipleCardsIsSelected = Boolean(store.state.multipleCardsSelectedIds.length)
  const shouldAdd = !multipleCardsIsSelected && !utils.unpinnedDialogIsVisible()
  // add card
  if (shouldAdd && toolbarIsCard.value) {
    store.commit('shouldAddCard', true)
  // add box
  } else if (shouldAdd && toolbarIsBox.value) {
    store.commit('triggerAddBox', event)
    return
  }
  // clear selected
  if (!event.shiftKey) {
    store.dispatch('clearMultipleSelected')
  }
  prevPosition = null
  prevCursor = null
  store.commit('previousMultipleCardsSelectedIds', store.state.multipleCardsSelectedIds)
  store.commit('previousMultipleConnectionsSelectedIds', store.state.multipleConnectionsSelectedIds)
  store.dispatch('closeAllDialogs')
}

const circlesAnimationFrame = (timestamp) => {
  clearRect()

  // Prepare WebGL circles for batch rendering
  let webglCircles = []

  // paint select
  paintSelectCircles = utils.filterCircles(paintSelectCircles, maxIterations)
  paintSelectCircles = paintSelectCircles.map(item => {
    item.iteration++
    const circle = JSON.parse(JSON.stringify(item))
    webglCircles.push(circle)
    return item
  })

  // initial circles
  initialCircles = utils.filterCircles(initialCircles, 60)
  initialCircles = initialCircles.map(item => {
    item.iteration++
    const circle = JSON.parse(JSON.stringify(item))
    webglCircles.push(circle)
    return item
  })

  // remote paint
  remotePaintingCircles = utils.filterCircles(remotePaintingCircles, maxIterations)
  remotePaintingCircles = remotePaintingCircles.map(item => {
    item.iteration++
    let circle = JSON.parse(JSON.stringify(item))
    circle.x = circle.x - window.scrollX
    circle.y = circle.y - window.scrollY
    circle.shouldDrawOffscreen = true
    webglCircles.push(circle)
    return item
  })

  // notify offscreen
  notifyOffscreenCircles = utils.filterCircles(notifyOffscreenCircles, maxIterations)
  notifyOffscreenCircles = notifyOffscreenCircles.map(item => {
    item.iteration++
    const circle = JSON.parse(JSON.stringify(item))
    circle.shouldDrawOffscreen = true
    webglCircles.push(circle)
    return item
  })

  // Batch render all circles with WebGL
  if (webglCircles.length > 0) {
    renderCirclesGL(webglCircles)
  }

  // locking
  lockingAnimationFrame(timestamp)

  // continue
  const isLocking = currentUserIsLocking && lockingPercentComplete < 1
  const nextFrame = paintSelectCircles.length || initialCircles.length || remotePaintingCircles.length || notifyOffscreenCircles.length || isLocking

  if (nextFrame) {
    window.requestAnimationFrame(circlesAnimationFrame)
  } else {
    setTimeout(() => {
      window.cancelAnimationFrame(timer)
      timer = undefined
    }, 0)
  }
}

const broadcastCircle = (event, circle) => {
  const position = utils.cursorPositionInSpace(event)
  store.commit('broadcast/update', {
    updates: {
      userId: store.state.currentUser.id,
      x: position.x,
      y: position.y,
      color: circle.color,
      iteration: circle.iteration,
      zoom: spaceZoomDecimal.value
    },
    type: 'addRemotePaintingCircle',
    handler: 'triggerAddRemotePaintingCircle'
  })
}

// Paint select
const startPaintingCirclesTimer = () => {
  if (!timer) {
    timer = window.requestAnimationFrame(circlesAnimationFrame)
  }
}

const painting = (event) => {
  const isPainting = store.state.currentUserIsPainting
  if (isPanning.value) { return }
  if (isBoxSelecting.value) { return }
  if (!toolbarIsCard.value) { return }
  if (!isPainting) { return }
  if (store.state.isPinchZooming) { return }
  if (store.getters.shouldScrollAtEdges(event) && event.cancelable) {
    event.preventDefault() // prevents touch swipe viewport scrolling
  }
  startPaintingCirclesTimer()
  if (event.getCoalescedEvents) {
    const events = event.getCoalescedEvents()
    events.forEach(event => createPaintingCircle(event))
  } else {
    createPaintingCircle(event)
  }
  triggerHideTouchInterface()
}

// Initial Circles
const createInitialCircle = (circle) => {
  if (toolbarIsBox.value) { return }
  const initialCircle = {
    x: startCursor.x,
    y: startCursor.y,
    color: currentUserColor.value,
    iteration: 1
  }
  initialCircles.push(initialCircle)
  startPaintingCirclesTimer()
}

// Remote Paint Strokes
const createRemotePaintingCircle = (circle) => {
  const { color, zoom } = circle
  const prevCircle = remotePaintingCircles.findLast(item => item.userId === circle.userId)
  if (prevCircle) {
    const points = utils.pointsBetweenTwoPoints(prevCircle, circle)
    points.forEach(point => {
      point = { x: point.x, y: point.y, color, zoom, iteration: 0 }
      remotePaintingCircles.push(point)
    })
    remotePaintingCircles.push(circle)
  } else {
    remotePaintingCircles.push(circle)
  }
  startPaintingCirclesTimer()
}

// Notify Offscreen Circles
const createNotifyOffscreenCircle = (circle) => {
  circle.x = circle.x - window.scrollX
  circle.y = circle.y - window.scrollY
  const notifyOffscreenCircle = {
    x: circle.x,
    y: circle.y,
    color: circle.color,
    iteration: 1,
    shouldDrawOffscreen: true
  }
  notifyOffscreenCircles.push(notifyOffscreenCircle)
  startPaintingCirclesTimer()
}

// Locking
const cancelLocking = () => {
  shouldCancelLocking = true
}

const startLocking = () => {
  if (toolbarIsBox.value) { return }
  currentUserIsLocking = true
  shouldCancelLocking = false
  setTimeout(() => {
    startPaintingCirclesTimer()
  }, lockingPreDuration)
}

const lockingAnimationFrame = (timestamp) => {
  if (!lockingStartTime) {
    lockingStartTime = timestamp
  }
  const elaspedTime = timestamp - lockingStartTime
  lockingPercentComplete = (elaspedTime / lockingDuration) // between 0 and 1
  const zoom = Math.min(utils.pinchCounterZoomDecimal(), 1)
  const cursorsAreClose = utils.cursorsAreClose(startCursor, state.currentCursor, zoom)
  if (!cursorsAreClose) {
    currentUserIsLocking = false
  }
  if (shouldCancelLocking) {
    currentUserIsLocking = false
    shouldCancelLocking = false
  }
  if (!currentUserIsLocking) {
    lockingStartTime = undefined
    return
  }
  if (lockingPercentComplete <= 1) {
    const minSize = circleRadius
    const percentRemaining = Math.abs(lockingPercentComplete - 1)
    const circleRadiusDelta = initialLockCircleRadius - minSize
    const radius = (circleRadiusDelta * percentRemaining) + minSize
    const alpha = utils.easeOut(lockingPercentComplete, elaspedTime, lockingDuration)
    const circle = {
      x: startCursor.x,
      y: startCursor.y,
      color: currentUserColor.value,
      radius,
      alpha: alpha || 0.01, // to ensure truthyness
      iteration: 1
    }
    renderCirclesGL([circle])
  } else if (lockingPercentComplete >= 1) {
    store.commit('currentUserIsPainting', true)
    store.commit('currentUserIsPaintingLocked', true)
    console.info('🔒 lockingAnimationFrame locked')
    postMessage.sendHaptics({ name: 'softImpact' })
    cancelLocking()
    lockingStartTime = undefined
  }
}

// Selecting
const shouldPreventSelectionOnMobile = () => {
  const isMobile = utils.isMobile()
  const isPaintingLocked = store.state.currentUserIsPaintingLocked
  return isMobile && !isPaintingLocked
}

const selectItemsBetweenCurrentAndPrevPosition = (position) => {
  if (!prevPosition) {
    prevPosition = position
    return
  }
  const points = utils.pointsBetweenTwoPoints(prevPosition, position)
  selectItems(points)
  prevPosition = position
}

const selectItems = (points) => {
  if (shouldPreventSelectionOnMobile()) { return }
  if (userCannotEditSpace.value) { return }
  selectCards(points)
  selectBoxes(points)
  selectConnections(points)
}

const selectCards = (points) => {
  const matches = collisionDetection.checkPointsInRects(points, selectableCardsInViewport, selectableCardsGrid)
  const cardIds = matches.map(match => match.id)
  store.dispatch('addMultipleToMultipleCardsSelected', cardIds)
}

const selectBoxes = (points) => {
  const matches = collisionDetection.checkPointsInRects(points, selectableBoxes)
  const boxIds = matches.map(match => match.id)
  store.dispatch('addMultipleToMultipleBoxesSelected', boxIds)
}

const selectConnections = (points) => {
  selectableConnectionsInViewport.forEach(svg => {
    if (svg.dataset.isVisibleInViewport === 'false') { return }
    const path = svg.querySelector('path.connection-path')
    const matches = collisionDetection.checkPointsInsidePath(points, svg, path)
    if (!matches) { return }
    const connectionIds = matches.map(match => match.id)
    store.dispatch('addMultipleToMultipleConnectionsSelected', connectionIds)
  })
}
</script>

<template lang="pug">
//- Paint select is ephemeral brush strokes that select items
canvas#paint-select-canvas(
  :width="viewportWidth"
  :height="viewportHeight"
)
DropGuideLine(
  v-if="state.dropGuideLineIsVisible"
  :viewportWidth="viewportWidth"
  :viewportHeight="viewportHeight"
)
</template>

<style lang="stylus" scoped>
canvas
  position fixed
  background transparent
  top 0
  left 0
  width 100dvw
  height 100dvh
  opacity 1
  pointer-events none
</style>
