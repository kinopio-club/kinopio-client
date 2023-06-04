<template lang="pug">
.audio(v-if="visible" :class="{'card-has-no-name': !normalizedName}")
  audio.hidden(ref="audio" controls="controls" :src="url" type="audio/mpeg" preload="metadata")
  //- use controls to playback <audio>
  .controls(
    @keyup.prevent="cancelClick"
    @mouseup.left.prevent="cancelClick"
    @touchend.prevent="cancelClick"
  )
    .button-wrap(:class="{active: isPlaying}"
      @mousedown.left="togglePlayPause"
      @touchend="togglePlayPause"
    )
      button
        img.icon.play.pause(v-if="isPlaying" src="@/assets/pause.svg")
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
        :value="progressPercent"
        max="100"
        ref="progress"
        :style="{'background-color': selectedColor}"
      )
  .row
    span.badge(:class="{info: isPlaying, status: !isPlaying}" :style="{background: selectedColor}")
      img.icon(v-if="!isPlaying" src="@/assets/autoplay.svg")
      Loader(:visible="isPlaying")
      span {{currentTime}}/{{totalTime}}
</template>

<script>
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

export default {
  name: 'Audio',
  components: {
    Loader
  },
  props: {
    visible: Boolean,
    url: String,
    selectedColor: String,
    normalizedName: String,
    parentIsCardDetails: Boolean
  },
  data () {
    return {
      isPlaying: false,
      totalTime: '--:--',
      currentTime: '00:00',
      timeFormat: 'seconds',
      progressPercent: 0,
      playheadIsBeingDragged: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerPauseAllAudio' && this.isPlaying) {
        this.pauseAudio()
      }
    })
  },
  mounted () {
    const audio = this.$refs.audio
    if (!audio) { return }
    audio.addEventListener('loadedmetadata', this.getTotalTime)
  },
  beforeUnmount () {
    this.pauseAudio()
  },
  methods: {
    cancelClick (event) {
      this.$store.commit('currentUserIsDraggingCard', false)
      if (this.parentIsCardDetails) { return }
      const isConnectingTo = this.$store.state.currentConnectionSuccess.id
      if (isConnectingTo) { return }
      this.$store.dispatch('closeAllDialogs')
      event.stopPropagation()
    },
    handleErrors (event) {
      console.warn('🚒', event)
    },

    // time helpers

    convertToTwoDigits (number) {
      if (!number) { return undefined }
      if (number <= 9) {
        return `0${number}`
      } else {
        return number
      }
    },
    formatTime ({ hours, minutes, seconds, format }) {
      hours = this.convertToTwoDigits(hours)
      minutes = this.convertToTwoDigits(minutes)
      seconds = this.convertToTwoDigits(seconds)
      if (hours || format === 'hours') {
        this.timeFormat = 'hours'
        hours = hours || '00'
        minutes = minutes || '00'
        seconds = seconds || '00'
        return `${hours}:${minutes}:${seconds}`
      } else if (minutes || format === 'minutes') {
        this.timeFormat = 'minutes'
        minutes = minutes || '00'
        seconds = seconds || '00'
        return `${minutes}:${seconds}`
      } else {
        this.timeFormat = 'seconds'
        return seconds
      }
    },
    duration (seconds) {
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
    },

    // controls

    togglePlayPause (event) {
      const isPlaying = this.isPlaying
      this.$store.commit('triggerPauseAllAudio')
      if (isPlaying) {
        this.pauseAudio()
      } else {
        this.playAudio()
      }
    },
    playAudio () {
      const audio = this.$refs.audio
      if (this.progressPercent >= 98) {
        this.progressPercent = 0
        audio.currentTime = 0
      }
      audio.volume = 0.25
      audio.play()
      this.isPlaying = true
      this.updateCurrentTime()
      this.getTotalTime()
      audio.addEventListener('timeupdate', this.getCurrentTime)
      audio.addEventListener('ended', this.pauseAudio)
      audio.addEventListener('error', this.handleErrors)
      this.$emit('isPlaying', true)
    },
    pauseAudio () {
      const audio = this.$refs.audio
      audio.pause()
      this.isPlaying = false
      audio.removeEventListener('timeupdate', this.getCurrentTime)
      audio.removeEventListener('ended', this.pauseAudio)
      audio.removeEventListener('error', this.handleErrors)
      this.$emit('isPlaying', false)
    },
    getTotalTime () {
      const audio = this.$refs.audio
      if (!audio) { return }
      const seconds = Math.floor(audio.duration)
      const time = this.duration(seconds)
      this.totalTime = this.formatTime(time)
    },
    getCurrentTime () {
      const audio = this.$refs.audio
      const seconds = Math.floor(audio.currentTime)
      const time = this.duration(seconds)
      time.format = this.timeFormat
      this.currentTime = this.formatTime(time) || '00:00'
      this.updateProgressFromTime(audio.currentTime, audio.duration)
    },
    updateProgressFromTime (currentTime, duration) {
      this.progressPercent = (currentTime / duration) * 100
    },

    // playhead progress

    movePlayhead (event) {
      const progress = this.$refs.progress
      const rect = progress.getBoundingClientRect()
      const progressStartX = rect.x + window.scrollX
      const progressWidth = rect.width - 2
      const clickX = utils.cursorPositionInViewport(event).x + window.scrollX
      const progressX = clickX - progressStartX
      this.progressPercent = (progressX / progressWidth) * 100
      this.updateCurrentTime()
    },
    updateCurrentTime () {
      const audio = this.$refs.audio
      audio.currentTime = Math.floor(audio.duration * this.progressPercent / 100)
      const time = this.duration(audio.currentTime)
      time.format = this.timeFormat
      this.currentTime = this.formatTime(time) || '00:00'
    },
    dragPlayhead (event) {
      if (!this.playheadIsBeingDragged) { return }
      this.movePlayhead(event)
    },
    startMovePlayhead (event) {
      this.playheadIsBeingDragged = true
      this.movePlayhead(event)
    },
    endMovePlayhead (event) {
      this.playheadIsBeingDragged = false
      this.movePlayhead(event)
    },
    stopMovingPlayhead () {
      this.playheadIsBeingDragged = false
    }
  },
  watch: {
    progressPercent (value) {
      if (value >= 100) {
        this.pauseAudio()
      } else if (this.isPlaying) {
        this.$emit('isPlaying', true)
      }
    }
  }
}
</script>

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
