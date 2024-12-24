<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

const store = useStore()

let unsubscribe

const audioElement = ref(null)
const progressElement = ref(null)

onMounted(() => {
  unsubscribe = store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerPauseAllAudio' && state.isPlaying) {
      pauseAudio()
    }
  })
  const audio = audioElement.value
  audio.addEventListener('loadedmetadata', getTotalTime)
})
onBeforeUnmount(() => {
  unsubscribe()
  const audio = audioElement.value
  audio.removeEventListener('loadedmetadata', getTotalTime)
  pauseAudio()
})

const emit = defineEmits(['isPlaying'])

const props = defineProps({
  visible: Boolean,
  url: String,
  selectedColor: String,
  normalizedName: String,
  parentIsCardDetails: Boolean
})
const state = reactive({
  isPlaying: false,
  totalTime: '--:--',
  currentTime: '00:00',
  timeFormat: 'seconds',
  progressPercent: 0,
  playheadIsBeingDragged: false
})

watch(() => state.progressPercent, (value, prevValue) => {
  if (value >= 100) {
    pauseAudio()
  } else if (state.isPlaying) {
    emit('isPlaying', true)
  }
})

const cancelClick = (event) => {
  store.commit('currentUserIsDraggingCard', false)
  if (props.parentIsCardDetails) { return }
  const isConnectingTo = store.state.currentConnectionSuccess.id
  if (isConnectingTo) { return }
  store.dispatch('closeAllDialogs')
  event.stopPropagation()
}
const handleErrors = (event) => {
  console.warn('🚒', event)
}

// time helpers

const convertToTwoDigits = (number) => {
  if (!number) { return undefined }
  if (number <= 9) {
    return `0${number}`
  } else {
    return number
  }
}
const formatTime = ({ hours, minutes, seconds, format }) => {
  hours = convertToTwoDigits(hours)
  minutes = convertToTwoDigits(minutes)
  seconds = convertToTwoDigits(seconds)
  if (hours || format === 'hours') {
    state.timeFormat = 'hours'
    hours = hours || '00'
    minutes = minutes || '00'
    seconds = seconds || '00'
    return `${hours}:${minutes}:${seconds}`
  } else if (minutes || format === 'minutes') {
    state.timeFormat = 'minutes'
    minutes = minutes || '00'
    seconds = seconds || '00'
    return `${minutes}:${seconds}`
  } else {
    state.timeFormat = 'seconds'
    return seconds
  }
}
const duration = (seconds) => {
  const minuteSeconds = 60
  const hourSeconds = 3600
  let minutes, hours
  if (seconds < minuteSeconds) {
    return { seconds }
  } else if (seconds < hourSeconds) {
    minutes = Math.floor(seconds / minuteSeconds)
    seconds = seconds - (minutes * minuteSeconds)
    return { minutes, seconds }
  } else {
    hours = Math.floor(seconds / hourSeconds)
    seconds = seconds - (hours * hourSeconds)
    minutes = Math.floor(seconds / minuteSeconds)
    seconds = seconds - (minutes * minuteSeconds)
    return { hours, minutes, seconds }
  }
}

// controls

const togglePlayPause = (event) => {
  const isPlaying = state.isPlaying
  store.commit('triggerPauseAllAudio')
  if (isPlaying) {
    pauseAudio()
  } else {
    playAudio()
  }
}
const playAudio = () => {
  const audio = audioElement.value
  if (state.progressPercent >= 98) {
    state.progressPercent = 0
    audio.currentTime = 0
  }
  audio.volume = 0.25
  audio.play()
  state.isPlaying = true
  updateCurrentTime()
  getTotalTime()
  audio.addEventListener('timeupdate', getCurrentTime.value)
  audio.addEventListener('ended', pauseAudio.value)
  audio.addEventListener('error', handleErrors.value)
  emit('isPlaying', true)
}
const pauseAudio = () => {
  const audio = audioElement.value
  audio.pause()
  state.isPlaying = false
  audio.removeEventListener('timeupdate', getCurrentTime.value)
  audio.removeEventListener('ended', pauseAudio.value)
  audio.removeEventListener('error', handleErrors.value)
  emit('isPlaying', false)
}
const getTotalTime = () => {
  const audio = audioElement.value
  if (!audio) { return }
  const seconds = Math.floor(audio.duration)
  const time = duration(seconds)
  state.totalTime = formatTime(time)
}
const getCurrentTime = () => {
  const audio = audioElement.value
  const seconds = Math.floor(audio.currentTime)
  const time = duration(seconds)
  time.format = state.timeFormat
  state.currentTime = formatTime(time) || '00:00'
  updateProgressFromTime(audio.currentTime, audio.duration)
}
const updateProgressFromTime = (currentTime, duration) => {
  state.progressPercent = (currentTime / duration) * 100
}

// playhead progress

const movePlayhead = (event) => {
  const progress = progressElement.value
  const rect = progress.getBoundingClientRect()
  const progressStartX = rect.x + window.scrollX
  const progressWidth = rect.width - 2
  const clickX = utils.cursorPositionInViewport(event).x + window.scrollX
  const progressX = clickX - progressStartX
  state.progressPercent = (progressX / progressWidth) * 100
  updateCurrentTime()
}
const updateCurrentTime = () => {
  const audio = audioElement.value
  audio.currentTime = Math.floor(audio.duration * state.progressPercent / 100)
  const time = duration(audio.currentTime)
  time.format = state.timeFormat
  state.currentTime = formatTime(time) || '00:00'
}
const dragPlayhead = (event) => {
  if (!state.playheadIsBeingDragged) { return }
  movePlayhead(event)
}
const startMovePlayhead = (event) => {
  state.playheadIsBeingDragged = true
  movePlayhead(event)
}
const endMovePlayhead = (event) => {
  state.playheadIsBeingDragged = false
  movePlayhead(event)
}
const stopMovingPlayhead = () => {
  state.playheadIsBeingDragged = false
}
</script>

<template lang="pug">
.audio(v-if="props.visible" :class="{'card-has-no-name': !props.normalizedName}")
  audio.hidden(ref="audioElement" controls="controls" :src="props.url" type="audio/mpeg" preload="metadata" loop="true")
  //- use controls to playback <audio>
  .controls(
    @keyup.prevent="cancelClick"
    @mouseup.left.prevent="cancelClick"
    @touchend.prevent="cancelClick"
  )
    .button-wrap(:class="{active: state.isPlaying}"
      @mousedown.left="togglePlayPause"
      @touchend="togglePlayPause"
    )
      button
        img.icon.play.pause(v-if="state.isPlaying" src="@/assets/pause.svg")
        img.icon.play(v-else src="@/assets/play.svg")
    .progress-wrap(
      @mousedown.left.stop.prevent="startMovePlayhead"
      @touchstart.stop.prevent="startMovePlayhead"

      @mousemove.prevent="dragPlayhead"
      @touchmove.prevent="dragPlayhead"

      @mouseleave.left.prevent="stopMovingPlayhead"
      @mouseenter.prevent="stopMovingPlayhead"

      @mouseup.left="endMovePlayhead"
      @touchend="endMovePlayhead"
    )
      progress(
        :value="state.progressPercent"
        max="100"
        ref="progressElement"
        :style="{'background-color': props.selectedColor}"
      )
  .row
    span.badge(:class="{info: state.isPlaying, status: !state.isPlaying}" :style="{background: props.selectedColor}")
      img.icon(v-if="!state.isPlaying" src="@/assets/autoplay.svg")
      Loader(:visible="state.isPlaying")
      span {{state.currentTime}}/{{state.totalTime}}
</template>

<style lang="stylus">
.audio
  display block
  width 100%
  &.selected
    mix-blend-mode color-burn
  &.card-has-no-name
    padding-bottom 8px
  .controls
    display flex
    align-items center
    margin-top -2px
  .button-wrap
    align-self right
    padding-right 6px
    padding-bottom 8px
    padding-top 2px
    button
      position relative
      width 20px
      height 16px
      vertical-align top
      background var(--primary-background)
      cursor pointer
    &:hover
      button
        box-shadow 3px 3px 0 var(--heavy-shadow)
        background var(--secondary-hover-background)
    &:active,
    &.active
      button
        box-shadow none
        color var(--primary)
        background var(--secondary-active-background)
  .progress-wrap
    height 100%
    width 100%
    padding-bottom 10px
    margin-top -6px
    progress
      background-color var(--secondary-background)
    progress::-webkit-progress-bar
      background-color var(--secondary-background)
  .play
    position absolute
    left 6px
    top 3px
    &.pause
      left 5px
  .hidden
    display none
  .badge
    &.status
      background var(--secondary-active-background)
</style>
