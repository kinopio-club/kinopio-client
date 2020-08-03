<template lang="pug">
.audio(v-if="visible")
  .controls(
    @keyup.stop.prevent="cancelClick"
    @mouseup.stop.prevent="cancelClick"
    @touchend.stop.prevent="cancelClick"
  )
    .button-wrap(:class="{active: isPlaying}")
      button(@click="playPause")
        img.icon.pause(v-if="isPlaying" src="@/assets/pause.svg")
        img.icon(v-else src="@/assets/play.svg")
    .progress-wrap(@click="movePlayhead")
      progress(
        value="0"
        max="100"
      )
  .row
    span.badge.secondary Autoplay
    span.badge(:class="{info: isPlaying}")
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
    url: String
  },
  data () {
    return {
      isPlaying: false,
      totalTime: '3:33',
      currentTime: '0:00'
    }
  },
  methods: {
    cancelClick () {
      this.$store.commit('currentUserIsDraggingCard', false)
      this.$store.dispatch('closeAllDialogs')
    },
    playPause (event) {
      console.log('☔️', event)
      this.isPlaying = !this.isPlaying
      // this.cancelClick()
      // toggle isPlaying
      // emit isPlaying
    },
    movePlayhead (event) {
      console.log('🍄', event)
      // this.cancelClick()
    }
  }
}
</script>

<style lang="stylus">
.audio
  display block
  // padding 8px
  width 160px
  &.selected
    mix-blend-mode color-burn
  .controls
    display flex
    align-items center
    margin-top -2px
    margin-bottom 5px
  .button-wrap
    align-self right
    button
      position relative
      width 20px
      height 16px
      vertical-align top
      background transparent
      margin-right 6px
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
    padding-bottom 5px
    progress
      background-color transparent
    progress::-webkit-progress-bar
      background-color transparent
  .icon
    position absolute
    left 6px
    top 3px
    &.pause
      left 5px
  .secondary
    background var(--secondary-active-background)
</style>
