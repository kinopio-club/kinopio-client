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
  border-radius 0
  padding 0

button,
label // used for checkbox buttons
  padding 7px
  padding-top 2px
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
  .row
    margin-bottom 10px
    display flex
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

// checkboxes
label
  &:hover
    input
      background-color var(--secondary-hover-background)
  input
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

</style>
