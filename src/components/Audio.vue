<template lang="pug">
.audio(v-if="visible" :class="{'card-has-name': normalizedName}")
  audio.hidden(ref="audio" controls="controls" :src="url" type="audio/mpeg" preload="metadata")
  //- use controls to playback <audio>
  .controls(
    @keyup.stop.prevent="cancelClick"
    @mouseup.stop.prevent="cancelClick"
    @touchend.stop.prevent="cancelClick"
  )
    .button-wrap(:class="{active: isPlaying}" @click="togglePlayPause")
      button
        img.icon.play.pause(v-if="isPlaying" src="@/assets/pause.svg")
        img.icon.play(v-else src="@/assets/play.svg")
    .progress-wrap(
      @mousedown.stop.prevent="startMovePlayhead"
      @touchstart.stop.prevent="startMovePlayhead"

      @mousemove.prevent="dragPlayhead"
      @touchmove.prevent="dragPlayhead"

      @mouseleave.prevent="stopMovingPlayhead"
      @mouseenter.prevent="stopMovingPlayhead"

      @mouseup="endMovePlayhead"
      @touchend="endMovePlayhead"
    )
      progress(
        :value="progressPercent"
        max="100"
        ref="progress"
      )
  .row
    span.badge.time(:class="{info: isPlaying}")
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
    normalizedName: String
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
      if (mutation.type === 'triggerPauseAllAudio') {
        this.isPlaying = false
      }
    })
  },
  mounted () {
    const audio = this.$refs.audio
    if (!audio) { return }
    audio.addEventListener('loadedmetadata', this.getTotalTime)
  },
  methods: {
    cancelClick () {
      this.$store.commit('currentUserIsDraggingCard', false)
      this.$store.dispatch('closeAllDialogs')
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
      const audio = this.$refs.audio
      const isPlaying = !this.isPlaying
      this.$store.commit('triggerPauseAllAudio')
      if (isPlaying && this.progressPercent >= 98) {
        this.progressPercent = 0
        audio.currentTime = 0
      }
      audio.volume = 0.25
      this.isPlaying = isPlaying
      this.getCurrentTime()
      audio.addEventListener('timeupdate', this.getCurrentTime)
      this.getTotalTime()
      audio.addEventListener('ended', this.pauseAudio)
      audio.addEventListener('error', this.handleErrors)
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
    pauseAudio () {
      const audio = this.$refs.audio
      audio.pause()
      this.isPlaying = false
      audio.removeEventListener('timeupdate')
      audio.removeEventListener('ended')
      audio.removeEventListener('error')
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
    },
    updateCurrentTime () {
      const audio = this.$refs.audio
      audio.currentTime = audio.duration * this.progressPercent / 100
    }
  },
  watch: {
    isPlaying (value) {
      this.$emit('isPlaying', value)
      const audio = this.$refs.audio
      if (value) {
        audio.play()
        this.updateCurrentTime()
      } else {
        this.pauseAudio()
      }
    },
    progressPercent (value) {
      if (value >= 100) {
        this.pauseAudio()
      }
    }
  }
}
</script>

<style lang="stylus">
.audio
  display block
  width 160px
  &.selected
    mix-blend-mode color-burn
  &.card-has-name
    margin-bottom 8px
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
      background transparent
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
    padding-bottom 11px
    progress
      background-color transparent
    progress::-webkit-progress-bar
      background-color transparent
  .play
    position absolute
    left 6px
    top 3px
    &.pause
      left 5px
  .hidden
    display none
  .time
    margin-right 0
</style>
