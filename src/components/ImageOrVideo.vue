<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'

const store = useStore()

const videoElement = ref(null)

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

// video

const isInteractingWithItem = computed(() => store.getters.isInteractingWithItem)
watch(() => isInteractingWithItem.value, (value) => {
  if (utils.isSafari()) { return } // fixes: safari hides video when pausing
  if (value) {
    pause()
  } else {
    play()
  }
})

const pause = () => {
  if (!props.video) { return }
  const element = videoElement.value
  element.pause()
}
const play = () => {
  if (!props.video) { return }
  const element = videoElement.value
  element.play()
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
img.image(v-if="state.imageUrl" :src="state.imageUrl" :class="{selected: isSelectedOrDragging}" @load="handleSuccess" @error="handleError")
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
