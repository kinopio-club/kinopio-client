<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

import debounce from 'lodash-es/debounce'

// deferred image loading queue, module scope, shared by all instances.
// unloaded images render as placeholders, then load a few at a time once zooming and scrolling ends.
// loading everything at once crashes mobile browsers on image heavy spaces
const maxConcurrentLoads = 10
const loadQueue = []
let activeLoadCount = 0
let isGesturing = false
const processLoadQueue = () => {
  if (isGesturing) { return }
  while (activeLoadCount < maxConcurrentLoads && loadQueue.length) {
    const item = loadQueue.shift()
    activeLoadCount = activeLoadCount + 1
    item.load(() => {
      activeLoadCount = activeLoadCount - 1
      processLoadQueue()
    })
  }
}
const addToLoadQueue = (item) => {
  loadQueue.push(item)
  processLoadQueue()
}
const removeFromLoadQueue = (item) => {
  const index = loadQueue.indexOf(item)
  if (index >= 0) {
    loadQueue.splice(index, 1)
  }
}
const updateIsGesturing = (value) => {
  isGesturing = value
  if (!value) {
    processLoadQueue()
  }
}

const globalStore = useGlobalStore()

const videoElement = ref(null)
const imageElement = ref(null)

let unsubscribes

onMounted(() => {
  requestImageUrl()
  window.addEventListener('mousemove', updateCanvasSelectedClass)
  window.addEventListener('touchmove', updateCanvasSelectedClass)
  window.addEventListener('focus', updateIsPlaying)
  window.addEventListener('blur', updateIsPlaying)
  document.addEventListener('visibilitychange', updateIsPlaying)

  const globalActionUnsubscribe = globalStore.$onAction(
    async ({ name, args }) => {
      if (name === 'triggerUploadComplete') {
        const { url, fileName } = args[0]
        if (props.video.includes(fileName)) {
          await nextTick()
          videoElement.value.load()
        }
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  if (queuedLoadItem) {
    removeFromLoadQueue(queuedLoadItem)
    queuedLoadItem = null
  }
  window.removeEventListener('mousemove', updateCanvasSelectedClass)
  window.removeEventListener('touchmove', updateCanvasSelectedClass)
  window.removeEventListener('focus', updateIsPlaying)
  window.removeEventListener('blur', updateIsPlaying)
  document.removeEventListener('visibilitychange', updateIsPlaying)
  unsubscribes()
})

const emit = defineEmits(['loadSuccess'])

const props = defineProps({
  isSelectedOrDragging: Boolean,
  pendingUploadDataUrl: String,
  image: String,
  video: String,
  videoIsPaused: Boolean,
  cardId: String,
  width: Number,
  height: Number
})

const state = reactive({
  imageUrl: null,
  imageBreakpoint: 0 // largest imgproxy size loaded so far, Infinity is original size
})

const isTouching = computed(() => globalStore.isPinchZooming || globalStore.isTouchScrolling)

watch(() => props.image, (url) => {
  if (!url && !props.pendingUploadDataUrl) {
    state.imageUrl = null
  }
  state.imageBreakpoint = 0
  requestImageUrl()
})
watch(() => props.pendingUploadDataUrl, (url) => {
  if (url) {
    state.imageUrl = url
  }
})
watch(() => props.width, (width) => {
  requestImageUrl()
})
watch(() => props.height, (height) => {
  requestImageUrl()
})
watch(() => globalStore.multipleSelectedActionsIsVisible, (value) => {
  if (value) { return }
  removeCanvasSelectedClass()
})

const lazyLoading = computed(() => {
  if (globalStore.disableViewportOptimizations) {
    return 'eager' // default
  } else {
    return 'lazy'
  }
})

// pause when item details dialog is visible

const handleItemDetailsDialogIsVisible = (value) => {
  if (value) {
    pause()
  } else {
    play()
  }
}
watch(() => globalStore.cardDetailsIsVisibleForCardId, (value) => {
  handleItemDetailsDialogIsVisible(value)
})
watch(() => globalStore.connectionDetailsIsVisibleForConnectionId, (value) => {
  handleItemDetailsDialogIsVisible(value)
})
watch(() => globalStore.boxDetailsIsVisibleForBoxId, (value) => {
  handleItemDetailsDialogIsVisible(value)
})
watch(() => globalStore.listDetailsIsVisibleForListId, (value) => {
  handleItemDetailsDialogIsVisible(value)
})
watch(() => globalStore.lineDetailsIsVisibleForLineId, (value) => {
  handleItemDetailsDialogIsVisible(value)
})

// video

watch(() => props.videoIsPaused, (value) => {
  if (!props.video) { return }
  if (value) {
    pauseVideo()
  } else {
    playVideo()
  }
})
const pause = () => {
  pauseVideo()
  pauseGif()
}
const play = () => {
  playVideo()
  playGif()
}
const pauseVideo = () => {
  if (!props.video) { return }
  const element = videoElement.value
  element.pause()
}
const playVideo = () => {
  if (!props.video) { return }
  if (props.videoIsPaused) { return }
  const element = videoElement.value
  element.play()
}

// gif

watch(() => isTouching.value, (value) => {
  updateIsGesturing(value)
  if (value) {
    pause()
  } else {
    play()
  }
})
const imageIsGif = computed(() => {
  const url = state.imageUrl
  if (!url) { return }
  return url.includes('.gif')
})
const updateIsPlaying = () => {
  // pause gifs and videos while the window or tab is inactive to reduce idle cpu and gpu use
  const windowIsActive = !document.hidden && document.hasFocus()
  if (windowIsActive) {
    play()
  } else {
    pause()
  }
}
const pauseGif = () => {
  // adapted from https://stackoverflow.com/a/24707088
  // create canvas element from first frame of video
  if (globalStore.disableViewportOptimizations) { return }
  if (!imageIsGif.value) { return }
  if (canvasElement()) { return } // already paused
  const image = imageElement.value
  const width = image.width
  const height = image.height
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(image, 0, 0, width, height)
  let attr
  let i = 0
  for (i = 0; i < image.attributes.length; i++) {
    attr = image.attributes[i]
    if (attr.name !== '"') { // test for invalid attributes
      canvas.setAttribute(attr.name, attr.value)
    }
  }
  canvas.style.position = 'absolute'
  canvas.classList.add('pause')
  image.parentNode.insertBefore(canvas, image)
  image.style.opacity = 0
}
const canvasElement = () => {
  const canvasElement = imageElement.value?.previousElementSibling
  const isCanvas = canvasElement?.nodeName === 'CANVAS'
  if (!isCanvas) { return }
  return canvasElement
}
const playGif = () => {
  // remove pause canvas
  if (globalStore.disableViewportOptimizations) { return }
  if (!imageIsGif.value) { return }
  const canvas = canvasElement()
  if (!canvas) { return }
  canvas.remove()
  imageElement.value.style.opacity = 1
}
const updateCanvasSelectedClass = () => {
  if (!globalStore.currentUserIsPaintSelecting) { return }
  const canvas = canvasElement()
  if (!canvas) { return }
  const multipleCardsSelectedIds = globalStore.multipleCardsSelectedIds
  const isSelected = multipleCardsSelectedIds.includes(props.cardId)
  if (!isSelected) { return }
  canvas.classList.add('selected')
}
const removeCanvasSelectedClass = () => {
  const canvas = canvasElement()
  if (!canvas) { return }
  canvas.classList.remove('selected')
}

// serve smaller images w imgproxy, loaded through the shared queue

let queuedLoadItem = null

const imgproxyUrl = (imageUrl, breakpoint) => {
  if (breakpoint === Infinity) {
    return utils.imgproxyUrl(imageUrl)
  }
  const devicePixelRatio = Math.round(window.devicePixelRatio || 1)
  return utils.imgproxyUrl(imageUrl, breakpoint * devicePixelRatio)
}
// when the space is zoomed out, cards are displayed smaller, so request smaller images
const targetBreakpoint = () => {
  const containerBreakpoints = [100, 400, 600, 800, 1200, 3000]
  const zoom = Math.min(globalStore.getSpaceZoomDecimal, 1)
  const maxDimensions = Math.max(props.width, props.height) * zoom
  return containerBreakpoints.find(breakpoint => maxDimensions <= breakpoint) || Infinity
}
const requestImageUrl = () => {
  if (props.pendingUploadDataUrl) {
    state.imageUrl = props.pendingUploadDataUrl
    return
  }
  const imageUrl = props.image
  if (!imageUrl) { return }
  const breakpoint = targetBreakpoint()
  // only upgrade sizes: browsers downscale loaded images fine, and swapping in a smaller image is jarring
  if (breakpoint <= state.imageBreakpoint) { return }
  if (queuedLoadItem) {
    queuedLoadItem.breakpoint = Math.max(queuedLoadItem.breakpoint, breakpoint)
    return
  }
  const item = {
    breakpoint,
    load (done) {
      queuedLoadItem = null
      const url = imgproxyUrl(imageUrl, item.breakpoint)
      // preload, then swap in place so the image never flashes
      const complete = () => {
        state.imageUrl = url
        state.imageBreakpoint = item.breakpoint
        done()
      }
      const image = new Image()
      image.addEventListener('load', complete)
      image.addEventListener('error', complete)
      image.src = url
    }
  }
  queuedLoadItem = item
  addToLoadQueue(item)
}
// after zooming in ends, load sharper images for the new zoom level
const requestImageUrlDebounced = debounce(() => {
  requestImageUrl()
}, 500)
watch(() => globalStore.getSpaceZoomDecimal, (value, prevValue) => {
  requestImageUrlDebounced()
})

// placeholder, shown until the image loads

const placeholderIsVisible = computed(() => {
  return !state.imageUrl && Boolean(props.image) && !props.video
})
const placeholderStyles = computed(() => {
  const styles = { backgroundColor: '#333' }
  if (props.width && props.height) {
    styles.aspectRatio = `${props.width} / ${props.height}`
  } else {
    styles.height = '100px'
  }
  return styles
})

// events

const handleSuccess = (event) => {
  emit('loadSuccess')
}
const handleError = (event) => {
}
</script>

<template lang="pug">
//- Video
video(v-if="Boolean(props.video)" :autoplay="!props.videoIsPaused" loop muted playsinline :key="props.video" :class="{selected: isSelectedOrDragging}" @canplay="handleSuccess" ref="videoElement" @load="handleSuccess")
  source(:src="props.video")
//- Image
img.image(
  v-if="state.imageUrl"
  ref="imageElement"
  :src="state.imageUrl"
  :class="{selected: isSelectedOrDragging}"
  @load="handleSuccess"
  @error="handleError"
  :loading="lazyLoading"
  decoding="async"
)
//- placeholder until the image loads through the queue
.image-placeholder(v-else-if="placeholderIsVisible" :style="placeholderStyles")
</template>

<style lang="stylus">
.media-card
  .image,
  video
    border-radius var(--entity-radius)
    display block
    -webkit-touch-callout none // prevents safari mobile press-and-hold from interrupting
    content-visibility auto
    &.selected
      mix-blend-mode color-burn
  .image-placeholder
    display block
    width 100%
    border-radius var(--entity-radius)
</style>
