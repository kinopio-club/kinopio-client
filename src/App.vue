<template lang='pug'>
.app(
  @pointermove="broadcastCursor"
  @touchstart="isTouchDevice"
  :style="{ width: pageWidth, height: pageHeight, cursor: pageCursor }"
  :class="{ 'no-background': isAddPage }"
)
  base(v-if="isAddPage" target="_blank")
  #layout-viewport(:style="{ background: backgroundTint }")
  .locked-cards(:style="zoomScale")
    template(v-for="card in lockedCards")
      Card(:card="card")
  MagicPaint
  OffscreenMarkers
  //- router-view is Space or Add
  router-view
  Header(:isPinchZooming="isPinchZooming" :isTouchScrolling="isTouchScrolling")
  Footer(:isPinchZooming="isPinchZooming" :isTouchScrolling="isTouchScrolling")
  TagDetails
  LinkDetails
  Minimap
  WindowHistoryHandler
  KeyboardShortcutsHandler
  .preload
    .logo-hover
    .logo-active
  .badge.label-badge.development-badge(v-if="isDevelopment") DEV
  //- pre-cached icons
  .icons.hidden
    img.icon(src="@/assets/offline.svg")
    img.icon(src="@/assets/center-horizontally.svg")
    img.icon(src="@/assets/distribute-horizontally.svg")
</template>

<script>
import Header from '@/components/Header.vue'
import MagicPaint from '@/components/layers/MagicPaint.vue'
import Footer from '@/components/Footer.vue'
import WindowHistoryHandler from '@/components/WindowHistoryHandler.vue'
import KeyboardShortcutsHandler from '@/components/KeyboardShortcutsHandler.vue'
import TagDetails from '@/components/dialogs/TagDetails.vue'
import LinkDetails from '@/components/dialogs/LinkDetails.vue'
import OffscreenMarkers from '@/components/OffscreenMarkers.vue'
import Minimap from '@/components/Minimap.vue'
import Card from '@/components/Card.vue'
import utils from '@/utils.js'

let multiTouchAction, shouldCancelUndo

let inertiaScrollEndIntervalTimer, prevPosition

export default {
  components: {
    Header,
    MagicPaint,
    Footer,
    KeyboardShortcutsHandler,
    WindowHistoryHandler,
    TagDetails,
    LinkDetails,
    OffscreenMarkers,
    Minimap,
    Card
  },
  created () {
    console.log('🐢 kinopio-client build', this.buildHash, import.meta.env.MODE)
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'currentSpace/restoreSpace') {
        this.updateMetaDescription()
      }
      if (mutation.type === 'broadcast/joinSpaceRoom') {
        this.updateMetaRSSFeed()
      }
    })
  },
  mounted () {
    // use timer to prevent being fired from page reload scroll
    // https://stackoverflow.com/questions/34095038/on-scroll-fires-automatically-on-page-refresh
    setTimeout(() => {
      window.addEventListener('scroll', this.updateUserHasScrolled)
    }, 100)
    window.addEventListener('scroll', this.updateCardMap)
    this.updateMetaDescription()
    this.$store.dispatch('currentSpace/updateBackgroundZoom')
    this.updateCardMap()
    window.addEventListener('touchstart', this.touchStart)
    window.addEventListener('touchmove', this.touchMove)
    window.addEventListener('touchend', this.touchEnd)
  },
  beforeUnmount () {
    window.removeEventListener('scroll', this.updateUserHasScrolled)
    window.removeEventListener('scroll', this.updateCardMap)
    window.removeEventListener('touchstart', this.touchStart)
    window.removeEventListener('touchmove', this.touchMove)
    window.removeEventListener('touchend', this.touchEnd)
  },
  data () {
    return {
      isPinchZooming: false,
      isTouchScrolling: false
    }
  },
  computed: {
    lockedCards () { return this.$store.getters['currentCards/isLocked'] },
    backgroundTint () {
      const color = this.$store.state.currentSpace.backgroundTint
      const metaThemeColor = document.querySelector('meta[name=theme-color]')
      metaThemeColor.setAttribute('content', color)
      return color
    },
    spaceName () { return this.$store.state.currentSpace.name },
    isDevelopment () {
      if (import.meta.env.MODE === 'development') {
        return true
      } else {
        return false
      }
    },
    isAddPage () { return this.$store.state.isAddPage },
    pageWidth () {
      if (this.isAddPage) { return }
      const size = Math.max(this.$store.state.pageWidth, this.$store.state.viewportWidth)
      return size + 'px'
    },
    pageHeight () {
      if (this.isAddPage) { return }
      const size = Math.max(this.$store.state.pageHeight, this.$store.state.viewportHeight)
      return size + 'px'
    },
    buildHash () {
      const regex = /(index\.)([a-z0-9])\w+/
      const scripts = Array.from(document.querySelectorAll('script'))
      const path = scripts.find(script => {
        const src = script.src
        return src.includes('index')
      })
      if (!path) { return }
      let hash = path.src.match(regex)[0] // index.xyzabc123.js
      return hash.replace('index.', '') // xyzabc123
    },
    pageCursor () {
      const isPanning = this.$store.state.currentUserIsPanning
      const isPanningReady = this.$store.state.currentUserIsPanningReady
      const toolbarIsBox = this.$store.state.currentUserToolbar === 'box'
      if (isPanning) {
        return 'grabbing'
      } else if (isPanningReady) {
        return 'grab'
      } else if (toolbarIsBox) {
        return 'crosshair'
      }
      return undefined
    },
    spaceZoomDecimal () { return this.$store.getters.spaceZoomDecimal },
    zoomScale () {
      return {
        transform: `scale(${this.spaceZoomDecimal})`
      }
    }
  },
  methods: {
    toggleIsPinchZooming (event) {
      if (utils.shouldIgnoreTouchInteraction(event)) { return }
      this.isPinchZooming = true
    },
    touchStart (event) {
      shouldCancelUndo = false
      if (!utils.isMultiTouch(event)) {
        multiTouchAction = null
        return
      }
      this.$store.commit('shouldAddCard', false)
      const touches = event.touches.length
      if (touches >= 2) {
        this.toggleIsPinchZooming(event)
      }
      // undo/redo
      if (touches === 2) {
        multiTouchAction = 'undo'
      } else if (touches === 3) {
        multiTouchAction = 'redo'
      }
    },
    touchMove () {
      shouldCancelUndo = true
      this.isTouchScrolling = true
    },
    checkIfInertiaScrollEnd () {
      if (!utils.isMobile) { return }
      if (inertiaScrollEndIntervalTimer) { return }
      prevPosition = null
      inertiaScrollEndIntervalTimer = setInterval(() => {
        const viewport = utils.visualViewport()
        let current = {
          left: window.scrollX,
          top: window.scrollY
        }
        if (utils.isAndroid()) {
          current = {
            left: viewport.offsetLeft,
            top: viewport.offsetTop
          }
        }
        if (!prevPosition) {
          prevPosition = current
        } else if (prevPosition.left === current.left && prevPosition.top === current.top) {
          clearInterval(inertiaScrollEndIntervalTimer)
          inertiaScrollEndIntervalTimer = null
          this.isTouchScrolling = false
        } else {
          prevPosition = current
        }
      }, 60)
    },
    touchEnd () {
      this.isPinchZooming = false
      this.checkIfInertiaScrollEnd()
      if (shouldCancelUndo) {
        shouldCancelUndo = false
        multiTouchAction = ''
        return
      }
      if (!multiTouchAction) { return }
      if (multiTouchAction === 'undo') {
        this.$store.dispatch('history/undo')
        this.$store.commit('addNotification', { message: 'Undo', icon: 'undo' })
      } else if (multiTouchAction === 'redo') {
        this.$store.dispatch('history/redo')
        this.$store.commit('addNotification', { message: 'Redo', icon: 'redo' })
      }
      multiTouchAction = null
    },
    updateCardMap () {
      this.$store.dispatch('currentCards/updateCardMap') // debounced
    },
    broadcastCursor (event) {
      const canEditSpace = this.$store.getters['currentUser/canEditSpace']()
      if (!canEditSpace) { return }
      let updates = utils.cursorPositionInPage(event)
      updates.userId = this.$store.state.currentUser.id
      updates.zoom = this.spaceZoomDecimal
      this.$store.commit('broadcast/update', { updates, type: 'updateRemoteUserCursor', handler: 'triggerUpdateRemoteUserCursor' })
    },
    isTouchDevice () {
      this.$store.commit('isTouchDevice', true)
    },
    updateUserHasScrolled () {
      if (this.$store.state.userHasScrolled) { return }
      this.$store.commit('userHasScrolled', true)
    },
    updateMetaDescription () {
      let description = 'Kinopio is the thinking tool for building new ideas and solving hard problems. Create spaces to brainstorm, research, plan and take notes.'
      const metaDescription = document.querySelector('meta[name=description]')
      const cards = this.$store.getters['currentCards/all']
      const topLeftCard = utils.topLeftCard(cards)
      if (!topLeftCard.name) {
        metaDescription.setAttribute('content', description)
      } else {
        metaDescription.setAttribute('content', topLeftCard.name)
      }
    },
    clearMetaRSSFeed () {
      let link = document.querySelector("link[type='application/rss+xml']")
      if (link) {
        link.remove()
      }
    },
    updateMetaRSSFeed () {
      const spaceHasUrl = utils.spaceHasUrl()
      const spaceIsPrivate = this.$store.state.currentSpace.privacy === 'private'
      this.clearMetaRSSFeed()
      if (!spaceHasUrl) { return }
      if (spaceIsPrivate) { return }
      const head = document.querySelector('head')
      const spaceId = this.$store.state.currentSpace.id
      const url = `${utils.host(true)}/space/${spaceId}/feed.json`
      let link = document.createElement('link')
      link.rel = 'alternative'
      link.type = 'application/rss+xml'
      link.title = 'JSON Feed'
      link.href = url
      head.appendChild(link)
    }
  }
}
</script>

<style lang="stylus">
:root
  // theme vars
  --primary black
  --primary-background white
  --text-link #143997
  --primary-transparent rgba(0,0,0,0.5)

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
  --success-background #67ffbb
  --search-background yellow

  --user-badge-moderator Gold
  --user-badge-guide-maker DeepSkyBlue
  --user-badge-donor Pink

  // non-theme vars
  --max-z 2147483646
  --hover-shadow 3px 3px 0 var(--heavy-shadow)
  --active-shadow 5px 5px 0 var(--light-shadow)
  --active-inset-shadow inset 0 2px 3px var(--light-shadow)
  --button-hover-shadow 2px 2px 0 var(--heavy-shadow)
  --button-active-inset-shadow inset 0 1px 2px var(--heavy-shadow)

  --serif-font recoleta, georgia, serif

@font-face
  font-family 'OsakaMono-Kinopio'
  src url("assets/fonts/OsakaMono-Kinopio.woff2") format("woff2")
  font-weight normal
  font-style normal

@font-face
  font-family 'Recoleta'
  src url("assets/fonts/Recoleta-Regular.woff2") format("woff2")
  font-weight normal
  font-style normal

@font-face
  font-family 'Recoleta'
  src url("assets/fonts/Recoleta-Bold.woff2") format("woff2")
  font-weight bold
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
  -webkit-user-select none
  overflow auto // enables window.scrollBy support

.app
  background-image url('assets/background-2x.png')
  position relative
  > .development-badge
    color var(--primary-background)
    min-height initial
    left initial
    right 0px
    bottom 80px
    position fixed
    pointer-events none
    z-index 100
    font-size 12px
  &.no-background
    background-image none

img,
video
  max-width 100%

input,
textarea,
.stripe-element
  touch-action manipulation
  margin 0
  font-size 1em // required to disable ios input zooming
  resize none
  width 100%
  min-width 0 // firefox hack
  background transparent
  border 0
  border-bottom 1px solid var(--primary)
  border-radius 0
  padding 1px
  margin-bottom 10px
  &:disabled
    color var(--primary)
    border-bottom 0

button,
input[type="color"],
select,
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
  color var(--primary)
  .down-arrow
    padding-left 4px
    vertical-align 1px
  &.borderless
    border-color transparent
    background-color transparent
  &:hover,
  &.hover,
  &:focus
    box-shadow var(--button-hover-shadow)
    background-color var(--secondary-hover-background)
    outline none
  &:active,
  &.active
    box-shadow var(--button-active-inset-shadow)
    color var(--primary)
    background-color var(--secondary-active-background)
  .badge
    display inline
    vertical-align 0
  &.danger
    &:hover,
    &.hover,
    &:focus
      background-color var(--danger-hover-background)
    &:active,
    &.active
      background-color var(--danger-active-background)
  &.success
    background var(--success-background)
  &.info
    background var(--info-background)
  .loader
    height 14px
    width 14px
    vertical-align -3px
    margin-left 3px
  &:disabled,
  .disabled
    cursor default
    color var(--primary)
    opacity 0.5
    pointer-events none
    // &:hover,
    // &:active
    //   box-shadow none
    //   background-color var(--primary-background)
    // &.active
    //   &:hover,
    //   &:active
    //     box-shadow var(--button-active-inset-shadow)
    //     background var(--secondary-active-background)

select
  max-width 100%
  -webkit-appearance none
  background-image url('assets/down-arrow.svg')
  background-repeat no-repeat
  background-position center
  background-position-x calc(100% - 6px)
  background-position-y center

textarea
  &[disabled],
  &:disabled
    color var(--primary)
    -webkit-text-fill-color var(--primary)
    opacity 1
    -webkit-opacity 1

.inline-button
  background-color transparent
  cursor cell
  position relative
  width 20px
  height 16px
  vertical-align top
  background-color var(--secondary-background)
  font-size 12px
  span
    font-size 12px
.inline-button-wrap
  padding 8px
  &:hover
    .inline-button
      box-shadow 3px 3px 0 var(--heavy-shadow)
      background var(--secondary-hover-background)
  &:active,
  &.active
    .inline-button
      box-shadow none
      color var(--primary)
      background var(--secondary-active-background)
label
  padding-bottom 4px
  display inline-block
  height 24px
  input
    margin 0
    &:focus
      outline none
  &.disabled
    cursor default
    color var(--primary)
    opacity 0.5
    pointer-events none

p,
span
  -webkit-text-size-adjust auto

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
  overscroll-behavior-y contain
  &.is-pinnable
    transition left 0.1s, top 0.1s
  &.narrow
    width 203px
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
  .button-wrap + label,
  .segmented-buttons + .button-wrap,
  .button-wrap + .segmented-buttons
    margin-left 6px
  .title-row
    display flex
    justify-content space-between
    align-items center
    .button-wrap
      padding 8px
      margin -8px
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
    .button-wrap + .button-wrap
      margin-left 0px
    button
      padding-top 2px
      padding-bottom 0px
      padding-left 5px
      padding-right 5px
      border-radius 3px
      margin 0

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
    &.align-top
      align-items flex-start
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
  section.sub-section
    border 1px solid var(--primary)
    padding 4px
    padding-bottom 0
    border-radius 3px
  section + section
    border-top 1px solid var(--primary)
  section.sub-section + section,
  section.sub-section + .row
    margin-top 10px

  .change-color
    padding-top 4px
    .current-color
      height 14px
      width 14px
      margin-bottom 1px
      border-radius 3px
  a
    text-decoration-thickness 1px
    color var(--text-link)
    &:hover
      text-decoration none

.segmented-buttons
  &.first-row
    button
      margin-bottom -1px
    button:first-child
      border-bottom-left-radius 0
    button:last-child
      border-bottom-right-radius 0
  &.last-row
    button:first-child
      border-top-left-radius 0
    button:last-child
      border-top-right-radius 0
  > .button-wrap > button,
  > button,
  > label
    margin 0
    border-radius 0
    &:first-child
      border-top-left-radius 3px
      border-bottom-left-radius 3px
    &:last-child
      border-top-right-radius 3px
      border-bottom-right-radius 3px
  &.vertical
    display flex
    flex-direction column
    .button-wrap
      button
        min-width 24px
        border-radius 0
        margin-bottom -1px
      &:first-child
        button
          border-top-left-radius 3px
          border-top-right-radius 3px
      &:last-child
        button
          border-bottom-left-radius 3px
          border-bottom-right-radius 3px

  button + button,
  label + button
    margin-left -1px

.icon
  vertical-align -1px
  user-drag none
  -webkit-user-drag none
  pointer-events none

.icon + span
  margin-left 5px

.time
  height 12px
  vertical-align -2px

.minus
  vertical-align middle

.button-wrap
  display inline-block
  position relative

  dialog
    top calc(100% - 8px)

.icon.sunglasses
  height 12px
  vertical-align -1px

.icon.templates
  padding 0
  height 9px
  vertical-align 0px

.icon.minimap
  height 13px

.icon.left-arrow
  transform rotate(90deg)
  vertical-align 2px

.icon.right-arrow
  transform rotate(-90deg)
  vertical-align 2px

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
      background-size 69%

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
    word-break break-word
    &:hover,
    &.hover,
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
  &.secondary
    background var(--secondary-active-background)
  &.search
    background var(--search-background)
  &.keyboard-shortcut
    min-height initial
    min-width initial
    background-color var(--secondary-background)
  &.last-child
    margin 0

  input
    margin 0
  .user
    vertical-align middle
    margin-right 3px
    .user-avatar
      width 16px
      height 15px
  .loader
    width 14px
    height 14px
    vertical-align -3px
    margin-right 6px
  &.button-badge
    box-shadow var(--button-hover-shadow)
    cursor pointer
    &:hover
      box-shadow var(--hover-shadow)
    &:active,
    &.active
      box-shadow var(--button-active-inset-shadow)
  &.badge-in-button
    padding 0px 7px
    vertical-align 0
    margin-right 5px

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

.link-badge
  background-color var(--secondary-active-background)
  > .user
    .label-badge
      width 21px
      height 10px
      span
        font-size 10px
  > .icon.private
    margin-left 3px

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

.flower
  vertical-align -3px
  height 13px

.pin
  vertical-align 0

.remove-undo
  margin-left 5px
  width 10px

.hidden
  display none

.is-hidden-by-opacity
  opacity 0
  pointer-events none !important

.fade-out
  opacity 0

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
    vertical-align 2px

.url-textarea
  background-color var(--secondary-background)
  border 0
  border-radius 3px
  padding 4px

.logo-image
  background-image url('assets/logo-base.png')
.logo
  .logo-image
    width 47px
    height 41px
    background-repeat no-repeat
    background-size contain
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

.name-segments
  .badge
    &:last-child
      margin 0
      margin-right 2px
  .badge,
  a
    margin-right 3px
  .badge + .badge,
  a + a
    margin-left 3px

#layout-viewport
  position fixed
  width 100%
  height 100%
  pointer-events none
  z-index 0
  mix-blend-mode multiply

progress
  appearance none
  width 100%
  height 8px
  border 1px solid var(--primary)
  border-radius 3px
  background-color var(--secondary-background)
progress::-webkit-progress-bar
  background-color var(--secondary-background)
  border-radius 3px
progress::-webkit-progress-value
  background-color var(--primary)
  border-radius 2px
progress::-moz-progress-bar
  background-color var(--primary)
  border-radius 2px

.locked-cards
  position absolute
  top 0

</style>
