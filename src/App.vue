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
  --active-background #c9c9c9
  // non-theme vars
  --max-z 2147483647

*
  -webkit-overflow-scrolling touch
  -webkit-tap-highlight-color transparent
  box-sizing border-box

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
    box-shadow 2px 2px 0 rgba(0,0,0,0.25)
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
