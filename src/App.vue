<template lang='pug'>
#app.app(
  @mousemove="broadcastCursor"
  @touchmove="broadcastCursor"
)
  MagicPaint
  router-view
  Header
  Footer
  KeyboardShortcutsHandler
  .preload
    .logo-hover
    .logo-active
  .badge.label-badge.development(v-if="isDevelopment") DEV
</template>

<script>
import Header from '@/components/Header.vue'
import MagicPaint from '@/components/MagicPaint.vue'
import Footer from '@/components/Footer.vue'
import KeyboardShortcutsHandler from '@/components/KeyboardShortcutsHandler.vue'

import utils from '@/utils.js'

export default {
  components: {
    Header,
    MagicPaint,
    Footer,
    KeyboardShortcutsHandler
  },
  computed: {
    isDevelopment () {
      if (process.env.NODE_ENV === 'development') {
        return true
      } else {
        return false
      }
    }
  },
  methods: {
    broadcastCursor (event) {
      const canEditSpace = this.$store.getters['currentUser/canEditSpace']()
      if (!canEditSpace) { return }
      let updates = utils.cursorPositionInPage(event)
      updates.userId = this.$store.state.currentUser.id
      this.$store.commit('broadcast/update', { updates, type: 'updateRemoteUserCursor' })
    }

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

  --danger-background #ffb8b3
  --danger-hover-background #ffa49e
  --danger-active-background #ff928b

  --info-background #90ffff
  --success-background #98f49f

  // non-theme vars
  --max-z 2147483647
  --hover-shadow 3px 3px 0 var(--heavy-shadow)
  --active-shadow 5px 5px 0 var(--light-shadow)
  --active-inset-shadow inset 0 2px 3px var(--light-shadow)
  --button-hover-shadow 2px 2px 0 var(--heavy-shadow)
  --button-active-inset-shadow inset 0 1px 2px var(--heavy-shadow)

@font-face
  font-family 'OsakaMono-Kinopio'
  src url("assets/OsakaMono-Kinopio.woff2") format("woff2")
  font-weight normal
  font-style normal

*
  -webkit-overflow-scrolling touch
  -webkit-tap-highlight-color transparent
  box-sizing border-box
  font-family "OsakaMono-Kinopio", monospace
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
  > .label-badge
    color var(--primary-background)
    min-height initial
    left initial
    right 12px
    bottom 12px
    position fixed
    pointer-events none

img,
video
  max-width 100%

input,
textarea
  touch-action manipulation
  margin 0
  font-size 1em // required to disable ios input zooming
  resize none
  width 100%
  background transparent
  border 0
  border-bottom 1px solid var(--primary)
  border-radius 0
  padding 0
  margin-bottom 10px
  &:disabled
    color var(--primary)
    border-bottom 0

button,
label // used for checkbox buttons
  touch-action manipulation
  text-align left
  padding 7px
  padding-top 4px
  padding-bottom 3px
  margin 0
  border 1px solid var(--primary)
  background-color var(--primary-background)
  border-radius 3px
  cursor pointer
  user-select none
  .down-arrow
    padding-left 4px
    vertical-align middle
  &.borderless
    border-color transparent
    background-color transparent
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
  .badge
    display inline
    vertical-align middle
  &.danger
    &:hover,
    &.hover,
    &:focus
      background var(--danger-hover-background)
    &:active,
    &.active
      background var(--danger-active-background)
  &.success
    background var(--success-background)
  .loader
    height 14px
    width 14px
    vertical-align -3px
    margin-left 3px
  &:disabled
    cursor default
    color var(--primary)
    opacity 0.5
    &:hover,
    &:active
      box-shadow none
      background-color var(--primary-background)
    &.active
      &:hover,
      &:active
        box-shadow var(--button-active-inset-shadow)
        background var(--secondary-active-background)

label
  padding-bottom 4px
  display inline-block
  height 24px
  input
    margin 0
  &.disabled
    cursor default
    color var(--primary)
    opacity 0.5
    pointer-events none

p
  margin 0
  margin-top 10px
  .badge
    display inline
    vertical-align middle

dialog
  width 250px
  left 8px
  top 8px
  position absolute
  max-height calc(100vh - 100px)
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
    width 200px
  button,
  label
    background-color var(--primary-background)
  button + button,
  button + input,
  button + label,
  label + button,
  .button-wrap + .button-wrap,
  button + .button-wrap,
  .button-wrap + button,
  label + label,
  label + .button-wrap,
  .button-wrap + label
    margin-left 6px

  p + button,
  button + p,
  p + .button-wrap,
  .button-wrap + p,
  p + .segmented-buttons,
  button + .segmented-buttons
    margin-top 10px
  .row
    margin-bottom 10px
    display flex
    align-items center
    position relative
    > input
      margin-bottom 0
    &:last-child
      margin-bottom 0
  section
    padding 8px
    &:first-child
      border-top-left-radius 2px
      border-top-right-radius 2px
    &:last-child
      border-bottom-left-radius 2px
      border-bottom-right-radius 2px
    p
      user-select text
      &:first-child
        margin-top 0
  section + section
    border-top 1px solid var(--primary)
  .change-color
    padding-top 4px
    .current-color
      height 14px
      width 14px
      margin-bottom 1px
      border-radius 3px

.segmented-buttons
  button
    margin 0
    border-radius 0
    &:first-child
      border-top-left-radius 3px
      border-bottom-left-radius 3px
    &:last-child
      border-top-right-radius 3px
      border-bottom-right-radius 3px
  button + button
    margin-left -1px

.icon
  vertical-align -1px

.icon + span
  margin-left 5px

.button-wrap
  display inline-block
  position relative

  dialog
    top calc(100% - 8px)

label,
li
  &:hover,
  &:focus
    input[type="checkbox"]
      background-color var(--secondary-hover-background)
  input[type="checkbox"]
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
    &.add
      background-image url('assets/add.svg')
      background-repeat no-repeat
      background-position center
      background-size 70%

li
  input[type="checkbox"]
    margin 0
    margin-right 5px

.results-actions
  padding-bottom 4px
.results-section
  padding 4px
  padding-top 0
  border-top 0
  overflow auto
  max-height calc(92vh - 245px)

ul.results-list
  margin 0
  padding 0
  li
    display flex
    padding 4px 7px
    align-items center
    border-radius 3px
    user-select none
    cursor pointer
    &:hover,
    &:focus
      background-color var(--secondary-hover-background)
      box-shadow var(--hover-shadow)
    &:active,
    &.active
      background-color var(--secondary-active-background)
      box-shadow var(--active-inset-shadow)
    &.disabled
      opacity 0.5
      pointer-events none

.badge,
code
  min-width 17px
  min-height 19px
  border-radius 3px
  padding 2px 5px
  margin-right 6px
  vertical-align -1px
  position relative
  &.info
    background var(--info-background)
  &.success
    background var(--success-background)
  &.status
    background var(--secondary-background)
  input
    margin 0
  .user
    vertical-align middle
    margin-right 3px
    .user-avatar
      width 16px
      height 15px

.label-badge
  position absolute
  padding 0 3px
  height 12px
  border-radius 3px
  left 0
  bottom 9px
  background-color var(--primary)
  display flex
  justify-content center
  span
    font-size 12px
    color var(--primary-background)

.danger
  background-color var(--danger-background)

.anon-avatar
  background-image url('assets/anon-avatar.svg')
  background-size 70%

.marker
  background-image url('assets/marker.svg')

.updated,
.open
  vertical-align -2px

.visit
  vertical-align 1px

.cut
  vertical-align 0

.cancel
  transform rotate(45deg)

.users
  display inline-block
  > .user
    > .user-avatar
      border-radius 0
    &:first-child
      > .user-avatar
        border-top-left-radius 3px
        border-bottom-left-radius 3px
    &:last-child
      > .user-avatar
        border-top-right-radius 3px
        border-bottom-right-radius 3px

.filtered
  opacity 0.3

.clear-input-wrap
  cursor pointer
  border-radius 3px
  padding-left 5px
  padding-right 5px
  margin-top -2px
  height 20px
  img
    padding 0
    transform rotate(45deg)
    vertical-align 2px

.logo-image
  background-image url('assets/logo-base.png')
.logo
  .logo-image
    width 45px
    height 40px
    background-repeat no-repeat
    background-size cover
    display inline-block
    vertical-align middle
    position relative
  &:hover,
  &:focus
    outline none
    .logo-image
      background-image url('assets/logo-hover.png')
  &:active,
  &.active
    .logo-image
      background-image url('assets/logo-active.png')

.preload
  .logo-hover
    background-image url('assets/logo-hover.png')
  .logo-active
    background-image url('assets/logo-active.png')

.search-wrap
  margin-left 5px
  padding-top 4px
  display flex
  .search
    margin-top -11px
    padding-right 5px
    cursor text
    flex-shrink 0

</style>
