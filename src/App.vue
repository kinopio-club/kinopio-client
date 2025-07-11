<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useGlobalStore } from '@/stores/useGlobalStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()
const broadcastStore = useBroadcastStore()
const themeStore = useThemeStore()
const globalStore = useGlobalStore()

let statusRetryCount = 0

let unsubscribes

onMounted(() => {
  console.info('🐢 kinopio-client build mode', import.meta.env.MODE)
  console.info('🐸 kinopio-server URL', consts.apiHost())
  if (utils.isLinux()) {
    utils.setCssVariable('sans-serif-font', '"Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif')
  }
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', logSystemThemeChange)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateSystemTheme)
  updateIsOnline()
  window.addEventListener('online', updateIsOnline)
  window.addEventListener('offline', updateIsOnline)

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerUserIsLoaded') { updateSystemTheme() }
    }
  )
  const broadcastActionUnsubscribe = broadcastStore.$onAction(
    ({ name, args }) => {
      if (name === 'joinSpaceRoom') {
        updateMetaRSSFeed()
      }
    }
  )
  unsubscribes = () => {
    broadcastActionUnsubscribe()
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', logSystemThemeChange)
  window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', updateSystemTheme)
  window.removeEventListener('online', updateIsOnline)
  window.removeEventListener('offline', updateIsOnline)
  unsubscribes()
})

const spaceName = computed(() => spaceStore.name)
const isSpacePage = computed(() => globalStore.getIsSpacePage)

// styles and position

const pageWidth = computed(() => {
  if (!isSpacePage.value) { return }
  const size = Math.max(globalStore.pageWidth, globalStore.viewportWidth)
  return size + 'px'
})
const pageHeight = computed(() => {
  if (!isSpacePage.value) { return }
  const size = Math.max(globalStore.pageHeight, globalStore.viewportHeight)
  return size + 'px'
})
const pageCursor = computed(() => {
  const isPanning = globalStore.currentUserIsPanning
  const isPanningReady = globalStore.currentUserIsPanningReady
  const toolbarIsBox = globalStore.getToolbarIsBox
  if (isPanning) {
    return 'grabbing'
  } else if (isPanningReady) {
    return 'grab'
  } else if (toolbarIsBox) {
    return 'crosshair'
  }
  return undefined
})
const spaceZoomDecimal = computed(() => globalStore.getSpaceZoomDecimal)

// users

const currentUserId = computed(() => userStore.id)

// online

const updateIsOnline = () => {
  const clientStatus = window.navigator.onLine
  if (!clientStatus) {
    globalStore.updateIsOnline(false)
    return
  }
  updateServerIsOnline()
}
const updateServerIsOnline = async () => {
  const maxIterations = 10
  const initialDelay = 1000 // 1 second
  const serverStatus = await apiStore.getStatus()
  if (serverStatus) {
    globalStore.updateIsOnline(true)
  // error offline
  } else {
    console.info('server online status', serverStatus)
    globalStore.updateIsOnline(false)
  }
  // retry
  let delay // delay increases up to ~15 minutes
  if (statusRetryCount < maxIterations) {
    statusRetryCount++
    delay = Math.pow(2, statusRetryCount) * initialDelay
  }
  delay = delay || 15 * 60 * 1000 // 15 minutes
  setTimeout(updateServerIsOnline, delay)
}

// theme

const isThemeDark = computed(() => themeStore.getIsThemeDark)
const logSystemThemeChange = (event) => {
  const themeIsSystem = userStore.themeIsSystem
  console.warn('🌓 logSystemThemeChange', window.matchMedia('(prefers-color-scheme: dark)'), event, { themeIsSystem })
}
const updateSystemTheme = () => {
  themeStore.updateSystemTheme()
}

// remote

const broadcastUserLabelCursor = (event) => {
  if (!globalStore.getIsSpacePage) { return }
  const updates = utils.cursorPositionInSpace(event)
  if (!updates) { return }
  updates.userId = userStore.id
  updates.zoom = spaceZoomDecimal.value
  broadcastStore.update({ updates, action: 'triggerUpdateRemoteUserCursor' })
}
const isTouchDevice = () => {
  globalStore.isTouchDevice = true
}

// rss

const clearMetaRSSFeed = () => {
  const link = document.querySelector("link[type='application/rss+xml']")
  if (link) {
    link.remove()
  }
}
const updateMetaRSSFeed = () => {
  const spaceIsPrivate = spaceStore.privacy === 'private'
  const spaceIsRemote = spaceStore.getSpaceIsRemote
  clearMetaRSSFeed()
  if (!spaceIsRemote) { return }
  if (spaceIsPrivate) { return }
  const head = document.querySelector('head')
  const spaceId = spaceStore.id
  const url = `${consts.apiHost()}/space/${spaceId}/feed.json`
  const link = document.createElement('link')
  link.rel = 'alternative'
  link.type = 'application/rss+xml'
  link.title = 'JSON Feed'
  link.href = url
  head.appendChild(link)
}
</script>

<template lang='pug'>
.app(
  @pointermove="broadcastUserLabelCursor"
  @touchstart="isTouchDevice"
  :style="{ width: pageWidth, height: pageHeight, cursor: pageCursor }"
  :class="{ 'no-background': !isSpacePage, 'is-dark-theme': isThemeDark }"
  :data-current-user-id="currentUserId"
)
  //- router-view is Space or Add
  router-view
</template>

<style lang="stylus">
:root
  color-scheme var(--color-scheme)
  // theme vars in themes.js
  // non-theme vars
  --primary-on-dark-background white
  --primary-on-light-background black
  --primary-border-on-light-background rgba(0,0,0,0.3)
  --primary-border-on-dark-background rgba(255,255,255,0.3)
  --text-link-on-light-background #143997
  --text-link-on-dark-background #788cc9
  --dark-background-tint-on-light-background rgba(0,0,0,0.3)
  --hover-shadow 3px 3px 0 var(--heavy-shadow)
  --active-shadow 5px 5px 0 var(--light-shadow)
  --active-inset-shadow inset 0 2px 3px var(--light-shadow)
  --button-hover-shadow 2px 2px 0 var(--heavy-shadow)
  --button-active-inset-shadow inset 0 1px 2px var(--heavy-shadow)
  --max-z 2147483646
  --entity-radius 6px
  --small-entity-radius 3px
  --small-user-avatar-radius 5px
  --subsection-padding 5px
  --button-fixed-height 30px
  --sans-serif-font "Helvetica Neue", Helvetica, Arial, sans-serif
  --mono-font Menlo, Monaco, monospace
  --serif-font georgia, serif
  --glyphs-font GoodGlyphs, wingdings
  --is-checked-opacity 0.6
  --focus-padding 20px

@font-face
  font-family 'GoodGlyphs'
  src url("/fonts/GoodGlyphs-No1.woff2") format("woff2")
  font-weight normal
  font-style normal

// header-font-0
:root
  --header-font-0 recoleta, var(--serif-font)
@font-face
  font-family 'recoleta'
  src url("/fonts/recoleta/Recoleta-Bold.woff2") format("woff2")
        // background-image url('assets/checkmark.svg')

  font-weight bold
  font-style normal
@font-face
  font-family 'recoleta'
  src url("/fonts/recoleta/Recoleta-Regular.woff2") format("woff2")
  font-weight normal
  font-style normal
// header-font-1
:root
  --header-font-1 apris, var(--mono-font)
@font-face
  font-family 'apris'
  src url("/fonts/apris/Apris-BoldItalic.woff2") format("woff2")
  font-weight bold
  font-style normal
@font-face
  font-family 'apris'
  src url("/fonts/apris/Apris-Regular.woff2") format("woff2")
  font-weight normal
  font-style normal
// header-font-2
:root
  --header-font-2 gaya, var(--serif-font)
@font-face
  font-family 'gaya'
  src url("/fonts/gaya/Gaya.woff2") format("woff2")
  font-weight bold
  font-style normal
@font-face
  font-family 'gaya'
  src url("/fonts/gaya/Gaya-Italic.woff2") format("woff2")
  font-weight normal
  font-style normal
// header-font-3
:root
  --header-font-3 gt-america, var(--sans-serif-font)
@font-face
  font-family 'gt-america'
  src url("/fonts/gt-america/GT-America-Standard-Bold.woff2") format("woff2")
  font-weight bold
  font-style normal
@font-face
  font-family 'gt-america'
  src url("/fonts/gt-america/GT-America-Standard-Regular.woff2") format("woff2")
  font-weight normal
  font-style normal
// header-font-4
:root
  --header-font-4 shinka-mono, var(--sans-serif-font)
@font-face
  font-family 'shinka-mono'
  src url("/fonts/shinka-mono/ShinkaMono-Bold.woff2") format("woff2")
  font-weight bold
  font-style normal
@font-face
  font-family 'shinka-mono'
  src url("/fonts/shinka-mono/ShinkaMono-Regular.woff2") format("woff2")
  font-weight normal
  font-style normal
// header-font-5
:root
  --header-font-5 microgramma, var(--sans-serif-font)
@font-face
  font-family 'microgramma'
  src url("/fonts/microgramma/MicrogrammaBoldExtendedD.woff2") format("woff2")
  font-weight bold
  font-style normal
@font-face
  font-family 'microgramma'
  src url("/fonts/microgramma/MicrogrammaMediumExtendedD.woff2") format("woff2")
  font-weight normal
  font-style normal
// header-font-6
:root
  --header-font-6 grotesk-remix, var(--sans-serif-font)
@font-face
  font-family 'grotesk-remix'
  src url("/fonts/grotesk-remix/GroteskRemix-bold.woff2") format("woff2")
  font-weight bold
  font-style normal
@font-face
  font-family 'grotesk-remix'
  src url("/fonts/grotesk-remix/GroteskRemix-regular.woff2") format("woff2")
  font-weight normal
  font-style normal
// header-font-7
:root
  --header-font-7 migra, var(--sans-serif-font)
@font-face
  font-family 'migra'
  src url("/fonts/migra/PPMigra-Bold.woff2") format("woff2")
  font-weight bold
  font-style normal
@font-face
  font-family 'migra'
  src url("/fonts/migra/PPMigra-Regular.woff2") format("woff2")
  font-weight normal
  font-style normal
// header-font-8
:root
  --header-font-8 eiko, var(--sans-serif-font)
@font-face
  font-family 'eiko'
  src url("/fonts/eiko/PPEiko-Medium.woff2") format("woff2")
  font-weight bold
  font-style normal
@font-face
  font-family 'eiko'
  src url("/fonts/eiko/PPEiko-LightItalic.woff2") format("woff2")
  font-weight normal
  font-style normal

*
  // -webkit-overflow-scrolling touch
  -webkit-tap-highlight-color transparent
  box-sizing border-box
  font-family  var(--sans-serif-font)
  font-size 15px
  line-height 1.2

html
  background transparent

body
  background transparent
  margin 0
  color var(--primary)
  -webkit-user-select none
  user-select none
  overflow auto // enables window.scrollBy support

.app
  position relative
  overflow hidden // enforces state.pageHeight/pageWidth
  > .development-badge
    min-height initial
    left initial
    right 0px
    bottom 40px
    position fixed
    pointer-events none
    z-index 100

.space-border-radius
  border-radius calc(var(--entity-radius) * 2)

img,
video
  max-width 100%

input,
textarea,
.stripe-element
  color var(--primary)
  touch-action manipulation
  margin 0
  font-size 1em // required to disable ios input zooming
  resize none
  width 100%
  min-width 0 // firefox hack
  background transparent
  border 0
  border-bottom 1px solid var(--primary-border)
  border-radius 0
  padding 1px
  margin-bottom 10px
  &:disabled,
  &:read-only
    color var(--primary)
    border-bottom 0
    outline none
  &.is-dark
    color var(--primary-background)
    border-color var(--primary-background)

button,
input[type="color"],
select,
label // used for checkbox buttons
  flex-shrink 0
  touch-action manipulation
  text-align left
  padding 5px 9px
  height fit-content
  margin 0
  background-color var(--button-background)
  border 1px solid var(--primary-border)
  border-radius var(--entity-radius)
  cursor pointer
  user-select none
  color var(--primary)
  max-width 100%
  .down-arrow
    padding-left 4px
    vertical-align 1px
  &.borderless
    border-color transparent
    background-color transparent
  &:hover,
  &.hover
    box-shadow var(--button-hover-shadow)
    background-color var(--secondary-hover-background)
    outline none
  &:focus
    box-shadow var(--button-hover-shadow)
    outline none
  &:active,
  &.active
    box-shadow var(--button-active-inset-shadow)
    color var(--primary)
    background-color var(--secondary-active-background)
  .badge
    display inline
    vertical-align 0
    margin-top -2px
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
    vertical-align -2px
    margin-left 5px
  &:disabled,
  .disabled
    cursor default
    color var(--primary)
    opacity 0.5
    pointer-events none !important
  &.is-dark
    border-color var(--primary-background)
    img
      filter invert(1)
  &.translucent-button
    backdrop-filter blur(8px) !important
    background var(--button-background-translucent)
    &:hover
      box-shadow var(--button-hover-shadow)
      background-color var(--secondary-hover-background)
      outline none
    &:active,
    &.active
      box-shadow var(--button-active-inset-shadow)
      color var(--primary)
      background-color var(--secondary-active-background)
  &.small-button
    height fit-content
    padding 0px 4px
    input[type="checkbox"]
      width 10px
      height 10px
      vertical-align 0
    span.small-button-text
      font-size 12px
      vertical-align 1px
    span.options-button-text
      font-size 12px
      vertical-align 4px

  &.fixed-height
    height var(--button-fixed-height)
.unselectable
  pointer-events none !important

.clickable-item
  box-shadow var(--button-hover-shadow)
  cursor pointer
  max-width calc(100% - 4px) !important
  user-select none
  user-drag none
  &:hover
    box-shadow var(--hover-shadow)
  &:active,
  &.active
    box-shadow var(--active-shadow)

table
  margin-top 10px
  border-collapse collapse
  td
    border 1px solid var(--secondary-active-background)
    color var(--primary)
    padding var(--subsection-padding)
    user-select text

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
textarea + p
  margin-top 0

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
  input
    margin 0
    &:focus
      outline none
  &.disabled
    cursor default
    color var(--primary)
    opacity 0.5
    pointer-events none

.input-button-wrap
  padding 8px
  cursor pointer
  position absolute
  right 0
  top 0
  > button
    padding 0
    padding-left 6px
    padding-right 6px
    font-size 12px
  &:hover
    > button
      box-shadow var(--button-hover-shadow)
      background-color var(--secondary-hover-background)
  &:active
    > button
      box-shadow var(--button-active-inset-shadow)
      background-color var(--secondary-active-background)

.bottom-button-wrap
  .inline-button-wrap
    transform translate(8px, 13px)
    &:hover
      background transparent
      button
        opacity 1
        background-color transparent
    button
      border 0
      width 12px
      height 12px
      padding 0
      background-color transparent
      opacity 0.3
      &:hover
        background-color transparent

hr
  border-top 1px solid var(--primary-border)
  border-bottom none

code,
pre
  font-family var(--mono-font)
  font-size 13px

p,
span
  -webkit-text-size-adjust auto
p
  margin 0
  margin-top 10px
  .badge
    display inline
    vertical-align middle

.segmented-buttons + .segmented-buttons,
.button-wrap + .button-wrap,
.button-wrap + .segmented-buttons
  margin-left 6px
.segmented-buttons
  > .button-wrap + .button-wrap
    margin-left 0

dialog
  width 250px
  left 8px
  top 8px
  position absolute
  max-height 90dvh
  margin 0
  padding 0
  user-select auto
  pointer-events all
  z-index var(--max-z)
  background-color var(--primary-background)
  border 1px solid var(--primary-border)
  box-shadow var(--hover-shadow)
  border-radius var(--entity-radius)
  overscroll-behavior-y contain
  cursor auto
  p,
  input,
  textarea
    color var(--primary)
  &.is-pinnable
    transition left 0.1s, top 0.1s, right 0.1s
  &.narrow
    width 230px
  &.wide
    width 280px
  &.overflow-auto
    overflow auto
  button + button,
  button + input,
  button + label,
  label + button,
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
  .title-row-flex
    display flex
    justify-content space-between

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
    user-select text
    &:first-child
      border-top-left-radius calc(var(--entity-radius) - 1px)
      border-top-right-radius calc(var(--entity-radius) - 1px)
    &:last-child
      border-bottom-left-radius calc(var(--entity-radius) - 1px)
      border-bottom-right-radius calc(var(--entity-radius) - 1px)
    p
      user-select text
      &:first-child
        margin-top 0
  section.subsection
    background-color var(--secondary-background)
    padding var(--subsection-padding)
    border-radius var(--entity-radius)
  section + section
    border-top 1px solid var(--primary-border)
  section.subsection + section,
  section.subsection + .row,
  .badge + .row,
  .loader + .row,
  p + .row
    margin-top 10px
  section.subsection + section.subsection
    border-top 0

  a
    text-decoration-thickness 1px
    color var(--text-link)
    &:hover
      text-decoration none

  .dark-theme-background-layer
    position absolute
    background-color var(--dark-background-tint-on-light-background)
    top -1px
    left -1px
    width calc(100% + 2px)
    height calc(100% + 2px)
    border-radius var(--entity-radius)
    z-index -1

.subsection-vertical-label
  writing-mode vertical-rl
  position absolute
  top 5px
  left -7px
  padding 2px 0
  width 14px
  span
    font-size 11px

.preview-thumbnail-image
  width 24px
  height 22px
  overflow hidden
  object-fit cover
  object-position 0 0
  border-radius var(--entity-radius)
  image-rendering crisp-edges
button
  > .preview-thumbnail-image
    width 20px
    height 18px
    vertical-align -4px
    margin-right 6px

.change-color
  height var(--button-fixed-height)
  .current-color
    height 14px
    width 14px
    border-radius var(--small-entity-radius)

.segmented-buttons
  display flex
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
  > label,
  > select,
  > a
    margin 0
    border-radius 0
    > button
      margin 0
      border-radius 0
    &:first-child
      border-top-left-radius var(--entity-radius)
      border-bottom-left-radius var(--entity-radius)
      > button
        border-top-left-radius var(--entity-radius)
        border-bottom-left-radius var(--entity-radius)
    &:last-child
      border-top-right-radius var(--entity-radius)
      border-bottom-right-radius var(--entity-radius)
  // &.vertical
  //   display flex
  //   flex-direction column
  //   .button-wrap
  //     button
  //       min-width 24px
  //       border-radius 0
  //       margin-bottom -1px
  //     &:first-child
  //       button
  //         border-top-left-radius var(--small-entity-radius)
  //         border-top-right-radius var(--small-entity-radius)
  //     &:last-child
  //       button
  //         border-bottom-left-radius var(--small-entity-radius)
  //         border-bottom-right-radius var(--small-entity-radius)

  > button + button,
  > label + button,
  > button + label,
  > label + label,
  > select + button,
  > button + select,
  > a + button
    margin-left -1px

.segmented-buttons-wrap
  .segmented-buttons
    &:first-child
      button,
      label
        &:first-child
          border-bottom-left-radius 0
    &:last-child
      margin-top -1px
      button,
      label
        &:first-child
          border-top-left-radius 0
        &:last-child
          border-top-right-radius 0

.title-row-small-button-wrap
  cursor pointer
  padding 8px
  padding-top 0
  padding-right 0
  &.section-top
    padding 5px
    padding-right 0

.is-dark-theme
  .icon
    filter invert()
.icon
  user-drag none
  -webkit-user-drag none
  &.is-background-light
    filter none
  &.is-background-dark
    filter invert(1)

.icon + span,
.icon + .icon
  margin-left 5px

.time
  height 12px
  vertical-align -1px

.minus
  vertical-align middle

.button-wrap
  display inline-block
  position relative
  flex-shrink 0
  max-width 100%
  dialog
    top calc(100% - 8px)

.icon.group
  height 11px

.icon.sunglasses
  height 12px
  vertical-align -1px

.icon.templates
  vertical-align -1px

.icon.minimap
  vertical-align -2px

.icon.left-arrow
  transform rotate(90deg)
  vertical-align 2px

.icon.right-arrow
  transform rotate(-90deg)
  vertical-align 2px

.icon.comment
  vertical-align -1px

.icon.leave
  transform rotate(-45deg)
  vertical-align -2px

.icon.stats
  vertical-align -1px

.icon.button-down-arrow
  padding 0
  vertical-align 2px

.icon.arena
  width 18px

.icon.clover
  width 12px
  vertical-align -1px

.icon.key
  height 10px
  vertical-align 1px

.icon.json-canvas
  width 10px

.icon.mail
  width 11px
  vertical-align 1px

.icon.duplicate
  vertical-align 1px

.icon.settings
  vertical-align -1px

label,
li
  position relative
  color var(--primary)
  &:hover,
  &:focus
    input[type="checkbox"]
      background-color var(--secondary-hover-background)
  input[type="checkbox"]
    pointer-events none
    margin-right 5px
    vertical-align -1px
    cursor pointer
    appearance none
    border 1px solid var(--primary)
    width 12px
    height 12px
    border-radius var(--small-entity-radius)
    background-color var(--primary-background)
    &:checked
      background-color var(--secondary-active-background)
      background-image url('assets/checkmark.svg')
      background-repeat no-repeat
      background-position center
    // &.add
    //   background-image url('assets/add.svg')
    //   background-repeat no-repeat
    //   background-position center
    //   background-size 60%
.is-dark-theme
  label
    input[type="checkbox"]
      &:checked
        background-image url('assets/checkmark-invert.svg')
      // &.add
      //   background-image url('assets/add-invert.svg')

details
  summary
    background url('assets/right-arrow.svg') left top no-repeat
    background-position 10px 11px
    list-style-type none
    cursor pointer
    border-radius var(--entity-radius)
    padding 5px 9px
    padding-left 22px
    &:hover
      box-shadow var(--button-hover-shadow)
      background-color var(--secondary-hover-background)
    &:active
      box-shadow var(--button-active-inset-shadow)
      background-color var(--secondary-active-background)
  section.subsection
    padding 5px 9px !important
    margin-top 0 !important
    border-top-right-radius 0
    border-top-left-radius 0
    img
      border-radius var(--entity-radius)
details[open]
  > summary
    background url('assets/down-arrow.svg') left top no-repeat
    background-position 10px 11px
    box-shadow var(--button-active-inset-shadow)
    background-color var(--secondary-active-background)
    border-bottom-right-radius 0
    border-bottom-left-radius 0
details + details
  margin-top 2px

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
.results-section-border-top
  border-top 1px solid var(--primary-border)
  padding-top 4px

ul.results-list
  margin 0
  padding 0
  li
    display flex
    padding 7px
    align-items flex-start
    border-radius var(--entity-radius)
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
  &.image-list
    display flex
    flex-wrap wrap
    align-items flex-start
    li
      position relative
      width 50%
      img
        border-radius var(--entity-radius)
        min-height 100px
    .small-button
      position absolute
      top 6px
      right 10px
      padding 0px
      padding-left 4px
      padding-right 3px
      max-width 80%
  .space-name
    align-items center

.badge,
code
  min-width 17px
  min-height 19px
  border-radius var(--entity-radius)
  padding 2px 5px
  margin-right 6px
  vertical-align -1px
  position relative
  color var(--primary)
  &.info
    background var(--info-background)
  &.success
    background var(--success-background)
  &.status
    background var(--secondary-active-background-dark)
  &.secondary
    background var(--secondary-background)
  &.secondary-on-dark-background
    background var(--secondary-active-background)
  &.search
    background var(--search-background)
  &.keyboard-shortcut
    min-height initial
    min-width initial
    background-color var(--secondary-active-background-dark)
  &.last-child
    margin 0
  &.new-unread-badge
    border-radius 100px
    position absolute
    min-width initial
    min-height initial
    width 8px
    height 8px
    right 4px
    top 4px
    margin 0
    padding 0
    z-index 10
    background var(--new-unread-background)
    &.notification-button-badge
      right -3px
      top -3px
  &.is-background-light
    color var(--primary-on-light-background)
  &.is-background-dark
    color var(--primary-on-dark-background)

  input
    margin 0
  .user
    vertical-align middle
    .user-avatar
      width 16px
      height 12px
      .anon-avatar
        top 5px
        left 0
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
  &.badge-card-button
    box-shadow none
    text-decoration none
    &:hover
      background var(--tertiary-hover-background)
      span
        text-decoration underline
    &.active
      box-shadow inset 0 3px 3px var(--inset-heavy-shadow)
    &.is-being-dragged
      box-shadow none
      text-decoration none
      span
        text-decoration none
  &.dot
    min-width initial
    min-height initial
    width 12px
    height 12px

.label-badge
  position absolute
  padding 0 3px
  height 14px
  border-radius var(--small-entity-radius)
  left 0
  bottom 9px
  background-color var(--primary)
  display flex
  justify-content center
  span
    font-size 12px
    color var(--primary-background)
  &.small-badge
    padding 0 1px
    span
      font-size 10px

.link-badge
  background-color var(--secondary-active-background)
  text-decoration none
  > .user
    .label-badge
      width 21px
      height 10px
  > .icon.private
    margin-left 5px
  .user-label-inline
    display inline-block
    min-height initial
    height 17px
    vertical-align -3px

.danger
  background-color var(--danger-background)

.anon-avatar
  position absolute
  top 11px
  left 6px
  width 16px
  &.is-dark
    filter invert(1)

.marker
  background-image url('assets/marker.svg')

.updated,
.open
  vertical-align -2px

.visit
  vertical-align 1px

.cut
  vertical-align 1px
.small-button
  .copy
    vertical-align -1px

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
  opacity 0 !important
  pointer-events none !important

.space-is-hidden
  opacity 0.5

.fade-out
  opacity 0

.users
  display inline-block
  > .user
    > .user-avatar
      border-radius 0
    &:first-child
      > .user-avatar
        border-top-left-radius var(--entity-radius)
        border-bottom-left-radius var(--entity-radius)
    &:last-child
      > .user-avatar
        border-top-right-radius var(--entity-radius)
        border-bottom-right-radius var(--entity-radius)
    &.is-small
      &:first-child
        > .user-avatar
          border-top-left-radius var(--small-user-avatar-radius)
          border-bottom-left-radius var(--small-user-avatar-radius)
      &:last-child
        > .user-avatar
          border-top-right-radius var(--small-user-avatar-radius)
          border-bottom-right-radius var(--small-user-avatar-radius)

.filtered
  opacity 0.3

.clear-input-wrap
  cursor pointer
  border-radius var(--entity-radius)
  padding-left 5px
  padding-right 5px
  margin-top -2px
  img
    padding 0
    vertical-align 2px

.url-textarea
  color var(--primary)
  background-color var(--secondary-background)
  border 0
  border-radius var(--small-entity-radius)
  padding 4px
  max-width 100%
  min-height 35px
  word-wrap anywhere
  overflow auto
  &.single-line
    max-height 35px
    overflow hidden
    span
      width 100000px
      display inline-block
      padding-top 5px

.logo-image
  background-image url('assets/logo-base.png')
.logo
  .logo-image
    margin-top 1px
    width 33px
    height 28px
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
    display inline-block
    margin-right 3px
  .badge + .badge,
  a + a
    margin-left 3px

progress
  appearance none
  width 100%
  height 8px
  border 1px solid var(--primary-border)
  border-radius var(--small-entity-radius)
  background-color var(--secondary-background)
progress::-webkit-progress-bar
  background-color var(--secondary-background)
  border-radius var(--small-entity-radius)
progress::-webkit-progress-value
  background-color var(--primary)
  border-radius 2px
progress::-moz-progress-bar
  background-color var(--primary)
  border-radius 2px

// .pulse
//   // https://easings.net/#easeOutQuad
//   animation fadeIn 1.2s cubic-bezier(0.5, 1, 0.89, 1) infinite
//   animation-direction alternate-reverse
.fadeIn-enter-active
  animation fadeIn 0.5s ease-out
@keyframes fadeIn
  0%
    opacity 0
  100%
    opacity 1

.focusing-frame
  position absolute
  z-index -1
  left 0px
  top 0px
  width 100%
  height 100%
  background-color pink
  transform-origin center
  animation: focusing .3s infinite alternate ease-out;
  // filter blur(10px)
  border-radius var(--entity-radius)
  pointer-events none

@keyframes focusing
  100%
    left calc(-1 * var(--focus-padding) / 2)
    top calc(-1 * var(--focus-padding) / 2)
    width calc(100% + var(--focus-padding))
    height: calc(100% + var(--focus-padding))
    border-radius calc(2 * var(--entity-radius))

.blink
  animation-duration 0.2s
  animation-name blink
  animation-iteration-count infinite
  animation-direction alternate
  animation-timing-function ease-out
@keyframes blink
  0%
    opacity 1
  100%
    opacity 0.6

</style>
