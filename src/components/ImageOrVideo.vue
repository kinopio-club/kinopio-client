<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useStoreAction } from '@/composables/useStoreAction.js'

import utils from '@/utils.js'
import consts from '@/consts.js'

const globalStore = useGlobalStore()

const videoElement = ref(null)
const imageElement = ref(null)

let pausedCanvas

onMounted(() => {
  updateImageUrl(props.image)
  window.addEventListener('mousemove', updateCanvasSelectedClass)
  window.addEventListener('touchmove', updateCanvasSelectedClass)
  window.addEventListener('focus', updateIsPlaying)
  window.addEventListener('blur', updateIsPlaying)
  document.addEventListener('visibilitychange', updateIsPlaying)
})
useStoreAction(globalStore, {
  triggerUploadComplete: async (updates) => {
    const { fileName } = updates
    if (!props.video.includes(fileName)) { return }
    await nextTick()
    videoElement.value.load()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', updateCanvasSelectedClass)
  window.removeEventListener('touchmove', updateCanvasSelectedClass)
  window.removeEventListener('focus', updateIsPlaying)
  window.removeEventListener('blur', updateIsPlaying)
  document.removeEventListener('visibilitychange', updateIsPlaying)
  pausedCanvas?.remove()
  pausedCanvas = null
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
  imageProxySrcSet: null,
  pendingImageIsDownscaled: false,
  imageIsDownscaled: false
})

const isTouching = computed(() => globalStore.isPinchZooming || globalStore.isTouchScrolling)

watch(() => props.image, (url) => {
  if (!url && !props.pendingUploadDataUrl) {
    state.imageUrl = null
    state.imageProxySrcSet = null
  }
  const onLoaded = () => {
    updateImageUrl(url)
  }
  const image = new Image()
  image.addEventListener('load', onLoaded)
  image.addEventListener('error', handleError)
  image.src = url
  if (image.complete) {
    onLoaded()
  }
})
watch(() => props.pendingUploadDataUrl, (url) => {
  if (url) {
    state.imageUrl = url
    state.pendingImageIsDownscaled = false
  }
})
watch(() => props.width, (width) => {
  updateImageUrl(props.image)
})
watch(() => props.height, (height) => {
  updateImageUrl(props.image)
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
  if (isZoomedOut.value) { return }
  const element = videoElement.value
  element.play()
}

// pause videos when zoomed out, to limit how many are decoding at once
const isZoomedOut = computed(() => globalStore.getMediaZoomLevel < 1)
const shouldAutoplayVideo = computed(() => !props.videoIsPaused && !isZoomedOut.value)
const videoPreload = computed(() => {
  if (shouldAutoplayVideo.value) {
    return 'auto'
  } else {
    return 'metadata'
  }
})
// ugc videos have no poster, so a media fragment makes ios safari draw the first frame while paused
const videoUrl = computed(() => {
  if (props.video.includes('#')) { return props.video }
  return `${props.video}#t=0.001`
})
watch(() => isZoomedOut.value, (value) => {
  if (isTouching.value) { return } // resumes after touching
  if (value) {
    pauseVideo()
  } else {
    playVideo()
  }
})

// gif

watch(() => isTouching.value, (value) => {
  if (value) {
    pause()
  } else {
    play()
  }
})
const imageIsGif = computed(() => {
  const url = state.imageUrl
  if (!url) { return }
  if (state.imageIsDownscaled) { return } // a still frame when zoomed out
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
  if (!image) { return }
  const width = image.width
  const height = image.height
  if (!width || !height) { return } // not laid out yet
  const canvas = pausedCanvas || document.createElement('canvas')
  pausedCanvas = canvas
  let attr
  let i = 0
  for (i = 0; i < image.attributes.length; i++) {
    attr = image.attributes[i]
    if (attr.name !== '"') { // test for invalid attributes
      canvas.setAttribute(attr.name, attr.value)
    }
  }
  const imageWasResized = canvas.width !== width || canvas.height !== height
  if (imageWasResized) {
    canvas.width = width
    canvas.height = height
  }
  const context = canvas.getContext('2d')
  context.clearRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)
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

// serve smaller images w imgproxy

const imgproxyUrl = (imageUrl, width, height, zoomLevel = globalStore.getMediaZoomLevel) => {
  if (props.pendingUploadDataUrl) {
    return props.pendingUploadDataUrl
  }
  // images are drawn smaller when the space is zoomed out, so load smaller ones, and gifs as still frames
  const maxDimensions = Math.max(width || 0, height || 0) * zoomLevel
  const shouldPauseGif = zoomLevel < 1
  return utils.imgproxyBreakpointUrl(imageUrl, maxDimensions, shouldPauseGif)
}
const updateImageUrl = (imageUrl) => {
  const url = imgproxyUrl(imageUrl, props.width, props.height)
  state.imageUrl = url
  // applied once it loads, because the previous image stays drawn until then
  state.pendingImageIsDownscaled = url !== imgproxyUrl(imageUrl, props.width, props.height, 1)
}
const mediaZoomLevel = computed(() => globalStore.getMediaZoomLevel)
const updateImageUrlForZoom = () => {
  if (!props.image) { return }
  if (globalStore.isPinchZooming) { return }
  // the previous image stays drawn until the new src loads, and offscreen lazy images aren't fetched
  updateImageUrl(props.image)
}
// a downscaled image would lay out smaller than at full zoom, so keep it at the card's saved width
const imageStyles = computed(() => {
  if (!state.imageIsDownscaled) { return }
  if (!props.width) { return }
  return { width: `${props.width}px` }
})
watch(() => mediaZoomLevel.value, updateImageUrlForZoom)
watch(() => globalStore.isPinchZooming, updateImageUrlForZoom)

// events

const handleSuccess = (event) => {
  emit('loadSuccess')
}
const handleImageLoad = (event) => {
  state.imageIsDownscaled = state.pendingImageIsDownscaled
  // the card's dimensions come from the full size image
  if (state.imageIsDownscaled) { return }
  handleSuccess(event)
}
const handleError = (event) => {
}
</script>

<template lang="pug">
//- Video
video(v-if="Boolean(props.video)" :autoplay="shouldAutoplayVideo" :preload="videoPreload" loop muted playsinline :key="props.video" :class="{selected: isSelectedOrDragging}" @canplay="handleSuccess" ref="videoElement" @load="handleSuccess")
  source(:src="videoUrl")
//- Image
img.image(
  v-if="state.imageUrl"
  ref="imageElement"
  :src="state.imageUrl"
  :class="{selected: isSelectedOrDragging}"
  :style="imageStyles"
  @load="handleImageLoad"
  @error="handleError"
  :loading="lazyLoading"
)
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
</style>
