<template lang='pug'>
#app.app
  Header
  MagicPaint
  router-view
</template>

<script>
import Header from '@/components/Header.vue'
import MagicPaint from '@/components/MagicPaint.vue'

export default {
  components: {
    Header,
    MagicPaint
  }
}
</script>

<style lang="stylus">
:root
  // theme vars
  --primary-background white
  --primary black
  --block-background #e3e3e3
  --hover-background #d8d8d8
  --active-background #cdcdcd
  --button-hover-shadow 2px 2px 0 rgba(0,0,0,0.25)
  --block-hover-shadow 3px 3px 0 rgba(0,0,0,0.25)
  --block-active-shadow 5px 5px 0 rgba(0,0,0,0.20)

  // non-theme vars
  --max-z 2147483647

@font-face
  font-family 'OsakaMono'
  src url("assets/OsakaMono.woff2") format("woff2")
  font-weight normal
  font-style normal

*
  -webkit-overflow-scrolling touch
  -webkit-tap-highlight-color transparent
  box-sizing border-box
  font-family "Osaka-Mono", "OsakaMono", "Osaka−等幅", monospace
  font-size 14px
  line-height 1.1

body
  margin 0
  color var(--primary)
  background-color var(--primary-background)
  background-image url('assets/background.svg')
  -webkit-user-select none
  overflow auto // enables window.scrollBy support

.app
  position relative

input,
textarea
  font-size: 1em // required to disable ios input zooming
  resize none

button
  border 1px solid var(--primary)
  border-radius 3px
  background transparent
  margin 0
  &:hover,
  &.hover
    box-shadow var(--button-hover-shadow)
    background var(--hover-background)
  &:active,
  &.active
    box-shadow none
    color var(--primary)
    background var(--active-background)

dialog
  width: 300px
  left: 8px
  top: 8px
  position: absolute
  margin 0
  padding 0
  user-select auto
  pointer-events all
  z-index var(--max-z)
  section
    padding 8px
  section + section
    border-top: 1px solid var(--primary)
</style>
