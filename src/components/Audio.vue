<template lang="pug">
.audio(v-if="visible" :class="{'card-has-name': normalizedName}")
  audio.hidden(ref="audio" controls="controls" :src="url" :autoplay="shouldAutoplay" type="audio/mpeg")
  //- use controls to playback <audio>
  .controls(
    @keyup.stop.prevent="cancelClick"
    @mouseup.stop.prevent="cancelClick"
    @touchend.stop.prevent="cancelClick"
  )
    .button-wrap(:class="{active: isPlaying}" @click="playPause")
      button
        img.icon.play.pause(v-if="isPlaying" src="@/assets/pause.svg")
        img.icon.play(v-else src="@/assets/play.svg")
    .progress-wrap(@click="movePlayhead")
      progress(
        value="0"
        max="100"
      )
  .row
    span.badge.info
      img.icon(src="@/assets/autoplay-active.svg")
      //- span Autoplay
    span.badge.time(:class="{info: isPlaying}")
      Loader(:visible="isPlaying")
      span {{currentTime}}/{{totalTime}}
</template>

<script>
import Loader from '@/components/Loader.vue'

export default {
  name: 'Audio',
  components: {
    Loader
  },
  props: {
    visible: Boolean,
    url: String,
    normalizedName: String,
    shouldAutoplay: Boolean
  },
  data () {
    return {
      isPlaying: false,
      totalTime: '--:--',
      currentTime: '0:00'
    }
  },
  mounted () {
    const audio = this.$refs.audio
    console.log('👨‍🎤', audio)
    if (!audio) { return }
    audio.addEventListener('play', this.test)
    // audio.play = (event) => {
    //   console.log('🍄playing', event)
    // }
    // todo when complete reset to 0 pos, isplaying false
  },
  methods: {
    cancelClick () {
      this.$store.commit('currentUserIsDraggingCard', false)
      this.$store.dispatch('closeAllDialogs')
    },
    playPause (event) {
      console.log('☔️', event, this.url)
      const audio = this.$refs.audio
      this.isPlaying = !this.isPlaying
      this.$emit('isPlaying', this.isPlaying)
      if (this.isPlaying) {
        audio.play()
      } else {
        audio.pause()
      }
    },
    test (event) {
      console.log('👍', event)
    },
    movePlayhead (event) {
      console.log('🍄', event)
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
