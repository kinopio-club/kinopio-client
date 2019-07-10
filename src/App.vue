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
  --primary black
  --primary-background white

  --secondary-background #e3e3e3
  --secondary-hover-background #d8d8d8
  --secondary-active-background #cdcdcd

  --hover-shadow 3px 3px 0 rgba(0,0,0,0.25)
  --active-shadow 5px 5px 0 rgba(0,0,0,0.20)
  --button-hover-shadow 2px 2px 0 rgba(0,0,0,0.25)

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
  margin 0
  font-size: 1em // required to disable ios input zooming
  resize none
  width 100%
  background transparent
  border 0
  border-bottom 1px solid var(--primary)

button
  padding 7px
  padding-top 2px
  padding-bottom 3px
  margin 0
  border 1px solid var(--primary)
  border-radius 3px
  background transparent
  cursor pointer
  &:hover,
  &.hover
    box-shadow var(--button-hover-shadow)
    background var(--secondary-hover-background)
  &:active,
  &.active
    box-shadow none
    color var(--primary)
    background var(--secondary-active-background)
p
  margin 0
  margin-top 10px

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
  background-color var(--primary-background)
  border 1px solid var(--primary)
  box-shadow var(--hover-shadow)
  border-radius 3px
  overflow hidden
  &.narrow
    width: 200px
  button
    background-color var(--primary-background)
  .row
    margin-bottom 10px
    button + button
      margin-left 10px
  section
    padding 8px
  section + section
    border-top: 1px solid var(--primary)
  input
    margin-bottom 10px
</style>
