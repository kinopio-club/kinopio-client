<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'

const store = useStore()

const videoElement = ref(null)
const imageElement = ref(null)

onMounted(() => {
  state.imageUrl = props.image || props.pendingUploadDataUrl
})

const emit = defineEmits(['loadSuccess'])

const props = defineProps({
  isSelectedOrDragging: Boolean,
  pendingUploadDataUrl: String,
  image: String,
  video: String
})
watch(() => props.image, (url) => {
  if (!url && !props.pendingUploadDataUrl) {
    state.imageUrl = null
  }
  const onLoaded = () => {
    state.imageUrl = url
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
  }
})

const state = reactive({
  imageUrl: null
})

const isTouching = computed(() => store.state.isPinchZooming || store.state.isTouchScrolling)
const isInteracting = computed(() => {
  const isInteractingWithItem = store.getters.isInteractingWithItem
  const isPainting = store.state.currentUserIsPainting
  const isPanning = store.state.currentUserIsPanningReady
  return isInteractingWithItem || isPainting || isPanning
})
watch(() => isInteracting.value, (value) => {
  if (value) {
    pause()
  } else {
    play()
  }
})
watch(() => isTouching.value, (value) => {
  if (value) {
    pause()
  } else {
    play()
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

// video

const pauseVideo = () => {
  if (!props.video) { return }
  const element = videoElement.value
  element.pause()
}
const playVideo = () => {
  if (!props.video) { return }
  const element = videoElement.value
  element.play()
}

// gif

const imageIsGif = computed(() => {
  const url = state.imageUrl
  if (!url) { return }
  return url.includes('.gif')
})
const pauseGif = () => {
  // adapted from https://stackoverflow.com/a/24707088
  // create canvas element from first frame of video
  if (!imageIsGif.value) { return }
  const image = imageElement.value
  const width = image.width
  const height = image.height
  const canvas = document.createElement('canvas', function (clone) {
    clone.width = width
    clone.height = height
  })
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
  canvas.classList.add('selected')
  image.parentNode.insertBefore(canvas, image)
  image.style.opacity = 0
}
const canvasElement = () => {
  const canvasElement = imageElement.value.previousElementSibling
  const isCanvas = canvasElement.nodeName === 'CANVAS'
  if (!isCanvas) { return }
  return canvasElement
}
const playGif = () => {
  // remove pause canvas
  if (!imageIsGif.value) { return }
  const canvas = canvasElement()
  canvas.remove()
  imageElement.value.style.opacity = 1
}

// events

const handleSuccess = (event) => {
  emit('loadSuccess')
}
const handleError = (event) => {
}

</script>

<template lang="pug">
//- Video
video(v-if="Boolean(video)" autoplay loop muted playsinline :key="video" :class="{selected: isSelectedOrDragging}" @canplay="handleSuccess" ref="videoElement" @load="handleSuccess")
  source(:src="video")
//- Image
img.image(v-if="state.imageUrl" ref="imageElement" :src="state.imageUrl" :class="{selected: isSelectedOrDragging}" @load="handleSuccess" @error="handleError" loading="lazy")
</template>

<style lang="stylus">
.media-card
  .image,
  video
    border-radius var(--entity-radius)
    display block
    -webkit-touch-callout none // prevents safari mobile press-and-hold from interrupting
    &.selected
      mix-blend-mode color-burn
</style>
