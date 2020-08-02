<template lang="pug">
.audio(v-if="visible")
  .controls(
    @keyup.stop.prevent="cancelClick"
    @mouseup.stop.prevent="cancelClick"
    @touchend.stop.prevent="cancelClick"
  )
    .button-wrap
      button(
        @click="playPause"
      )
        img.icon(src="@/assets/add.svg")
        //- pause if isPlaying
    .progress-wrap(@click="movePlayhead")
      progress(
        value="50"
        max="100"
      )
  .row
    span.badge(:class="{info: isPlaying}")
      Loader(:visible="isPlaying")
      span 0:00/3:33
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
      isPlaying: false
    }
  },
  methods: {
    cancelClick () {
      this.$store.commit('currentUserIsDraggingCard', false)
      this.$store.dispatch('closeAllDialogs')
    },
    playPause (event) {
      console.log('☔️', event)
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
  padding 8px
  &.selected
    mix-blend-mode color-burn
  .controls
    display flex
    align-items center
    margin-bottom 5px
  .button-wrap
    align-self right
    button
      background-color transparent
      position relative
      width 20px
      height 16px
      vertical-align top
      background-color var(--secondary-background)
      margin-right 6px
      cursor pointer
    &:hover
      button
        box-shadow 3px 3px 0 var(--heavy-shadow)
        background var(--secondary-hover-background)
    &:active
      button
        box-shadow none
        color var(--primary)
        background var(--secondary-active-background)
  .progress-wrap
    height 100%
    width 100%
    padding-bottom 5px
</style>
