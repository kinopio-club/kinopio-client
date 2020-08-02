<template lang="pug">
.audio(v-if="visible")
  .controls
    .button-wrap
      button(@mousedown.stop @touchstart.stop)
        img.icon.cancel(src="@/assets/add.svg")
    progress(value="50" max="100" @mousedown.stop @touchstart.stop)
  .row
    //- ^ v-if="isPlaying"
    span.badge.info 0:00/3:33
</template>

<script>
// import Loader from '@/components/Loader.vue'

export default {
  name: 'Audio',
  props: {
    visible: Boolean,
    url: String
  },
  data () {
    return {
      isPlaying: false
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
    margin-bottom 10px
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
</style>
