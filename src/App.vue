<template lang='pug'>
#app.app
  Header
  MagicPaint
  router-view
</template>

<script>
import Header from '@/components/Header.vue'
import MagicPaint from '@/components/MagicPaint.vue'

import smoothscroll from 'smoothscroll-polyfill'

export default {
  components: {
    Header,
    MagicPaint
  },
  mounted () {
    smoothscroll.polyfill() // remove when 'smooth' is supported by safari: https://caniuse.com/#search=scroll
  }
}
</script>

<style lang="stylus">
:root
  // theme vars
  --primary black
  --primary-background white

  // --secondary #818181
  --secondary-background #e3e3e3
  --secondary-hover-background #d8d8d8
  --secondary-active-background #cdcdcd

  --light-shadow rgba(0,0,0,0.20)
  --heavy-shadow rgba(0,0,0,0.25)

  // non-theme vars
  --max-z 2147483647
  --hover-shadow 3px 3px 0 var(--heavy-shadow)
  --active-shadow 5px 5px 0 var(--light-shadow)
  --active-inset-shadow inset 0 2px 3px var(--light-shadow)
  --button-hover-shadow 2px 2px 0 var(--heavy-shadow)
  --button-active-inset-shadow inset 0 1px 2px var(--light-shadow)

@font-face
  font-family 'OsakaMono-Kinopio'
  src url("assets/OsakaMono-Kinopio.woff2") format("woff2")
  font-weight normal
  font-style normal

*
  -webkit-overflow-scrolling touch
  -webkit-tap-highlight-color transparent
  box-sizing border-box
  font-family "OsakaMono-Kinopio", "Osaka-Mono", "Osaka−等幅", monospace
  font-size 14px
  line-height 1.1
  button:focus
    outline none

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
  border-radius 0
  padding 0

button,
label // used for checkbox buttons
  text-align left
  padding 7px
  padding-top 4px
  padding-bottom 3px
  margin 0
  border 1px solid var(--primary)
  border-radius 3px
  background transparent
  cursor pointer
  user-select none
  &:hover,
  &.hover,
  &:focus
    box-shadow var(--button-hover-shadow)
    background var(--secondary-hover-background)
  &:active,
  &.active
    box-shadow var(--button-active-inset-shadow)
    color var(--primary)
    background var(--secondary-active-background)
  // &:disabled
  //   opacity 0.25
  //   color var(--primary)
  //   pointer-events none

label
  padding-bottom 4px

p
  margin 0
  margin-top 10px

dialog
  width: 250px
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
  &.narrow
    width: 200px
  button,
  label
    background-color var(--primary-background)
  button + button,
  button + input,
  button + label,
  label + button
    margin-left 6px
  p
    margin 0
  p + button,
  button + p
    margin-top 10px
  .row
    margin-bottom 10px
    display flex
    position relative
  section
    padding 8px
    &:first-child
      border-top-left-radius 2px
      border-top-right-radius 2px
    &:last-child
      border-bottom-left-radius 2px
      border-bottom-right-radius 2px
  section + section
    border-top: 1px solid var(--primary)
  .icon
    vertical-align -1px
    margin-right 5px
  .change-color
    padding-top 4px
    .current-color
      height 14px
      width 14px
      margin-bottom 1px
      border-radius 3px

// checkboxes
label
  &:hover
    input
      background-color var(--secondary-hover-background)
  input
    pointer-events none
    margin-right 5px
    vertical-align -2px
    cursor pointer
    appearance none
    border 1px solid var(--primary)
    width 12px
    height 12px
    border-radius 3px
    background-color var(--primary-background)
    &:checked
      background-color var(--secondary-active-background)
      background-image url('assets/checkmark.svg')
      background-repeat no-repeat
      background-position center

.results-section
  padding 4px

ul
  margin 0
  padding 0
  li
    display flex
    padding 4px 7px
    align-items center
    border-radius 3px
    user-select none
    cursor pointer
    &:hover
      background-color var(--secondary-hover-background)
      box-shadow var(--hover-shadow)
    &:active,
    &.active
      background-color var(--secondary-active-background)
      box-shadow var(--active-inset-shadow)

.badge
  min-width 17px
  min-height 19px
  border-radius 3px
  padding 2px 5px
  margin-right 6px
  vertical-align -1px
  &.checked
    background-image url('assets/checkmark.svg')
    background-repeat no-repeat
    background-position center

.anon-avatar
  background-image url('assets/anon-avatar.svg')
  background-size 70%

.marker
  background-image url('assets/marker.svg')
</style>
