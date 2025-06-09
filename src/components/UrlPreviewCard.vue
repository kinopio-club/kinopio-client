<script setup>
import { reactive, computed, onMounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useThemeStore } from '@/stores/useThemeStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const themeStore = useThemeStore()

let hasRetried

onMounted(() => {
  window.addEventListener('touchend', disableIsActive)
  window.addEventListener('mouseup', disableIsActive)
})
watch(() => globalStore.preventDraggedCardFromShowingDetails, (value, prevValue) => {
  disableIsActive()
})

// remove retryUrlPreview after 2025
const emit = defineEmits(['retryUrlPreview'])

const props = defineProps({
  card: Object,
  user: Object,
  visible: Boolean,
  isSelected: Boolean,
  isImageCard: Boolean,
  urlPreviewImageIsVisible: Boolean,
  backgroundColor: String
})

const state = reactive({
  isActive: null
})

const shouldHideImage = computed(() => props.card.shouldHideUrlPreviewImage)
const shouldHideInfo = computed(() => props.card.shouldHideUrlPreviewInfo)
const selectedColor = computed(() => {
  if (!props.isSelected) { return }
  return props.user.color
})
const isInteractingWithItem = computed(() => globalStore.isInteractingWithItem)

// colors

const isThemeDark = computed(() => themeStore.getIsThemeDark)
const background = computed(() => {
  const color = props.backgroundColor
  const defaultColor = utils.cssVariable('secondary-background')
  const colorIsDefaultColor = utils.colorsAreEqual(color, defaultColor)
  if (colorIsDefaultColor || !color) { return }
  return utils.alternateColor(color, isThemeDark.value)
})
const backgroundColorIsDark = computed(() => utils.colorIsDark(background.value))
const colorClasses = computed(() => {
  const recomputeOnThemeChange = isThemeDark.value // used to force recompute
  let color = background.value
  if (!color) {
    color = utils.cssVariable('secondary-background')
  }
  return utils.colorClasses({ backgroundColor: color })
})

// preview image

const previewImageIsVisible = computed(() => {
  return props.card.urlPreviewImage && !shouldHideImage.value
})

// embed play button

const handleMouseEnterPlayButton = () => {
  globalStore.preventDraggedCardFromShowingDetails = true
}
const handleMouseLeavePlayButton = () => {
  globalStore.preventDraggedCardFromShowingDetails = false
}

// iframe embed (spotify, youtube, etc.)

const toggleShouldDisplayIframe = (event) => {
  event.preventDefault()
  event.stopPropagation()
  if (isTwitterUrl.value) { return }
  globalStore.closeAllDialogs()
  cardStore.incrementCardZ(props.card.id)
  const iframeIsVisibleForCardId = globalStore.iframeIsVisibleForCardId
  let value
  if (props.card.id === iframeIsVisibleForCardId) {
    value = true
  }
  value = !value
  if (value) {
    globalStore.iframeIsVisibleForCardId = props.card.id
    // addAutoplay()
  } else {
    // removeAutoplay()
    globalStore.iframeIsVisibleForCardId = ''
  }
}
const shouldDisplayIframe = computed(() => {
  const iframeIsVisibleForCardId = globalStore.iframeIsVisibleForCardId
  return props.card.id === iframeIsVisibleForCardId
})
const iframeHeight = computed(() => {
  const url = props.card.urlPreviewUrl
  let width = props.card.resizeWidth || props.card.width
  width = Math.max(width, consts.minCardIframeWidth)
  let aspectRatio = 2 / 3
  if (utils.urlIsYoutube(url)) {
    aspectRatio = 9 / 15
  }
  const height = Math.round(width * aspectRatio)
  return height
})

// autoplay

// const addAutoplay = async () => {
//   await nextTick()
//   document.querySelector('.url-preview-card iframe').addEventListener('load', autoplay)
// }
// const removeAutoplay = () => {
//   document.querySelector('.url-preview-card iframe').removeEventListener('load', autoplay)
// }
// const autoplay = async (event) => {
//   await nextTick()
//   // spotify
//   setTimeout(() => {
//     document.querySelector('.url-preview-card iframe').contentWindow.postMessage({ command: 'play' }, '*')
//   }, '300')
// }

// twitter

const isTwitterUrl = computed(() => {
  const url = props.card.urlPreviewUrl
  return url.includes('twitter.com')
})
const removeTrailingTweetText = (description) => {
  const index = description.lastIndexOf('— ')
  if (index > 1) {
    description = description.substring(0, index)
  }
  // https://regexr.com/7gfja
  // remove pic.twitter.com/abc
  description = description.replace(/pic\.twitter.com\/\S+/g, '')
  // remove t.co
  description = description.replace(/https:\/\/t.co\/\S+/g, '')
  return description
}

const handleImageError = (event) => {
  console.info('🚑 urlPreviewCard handleImageError', event)
  // remove after 2025
  const url = props.card.urlPreviewUrl
  const isInstagram = url.includes('instagram')
  // generic image error
  if (!isInstagram) {
    const update = {
      id: props.card.id,
      shouldHideUrlPreviewImage: true
    }
    cardStore.updateCard(update)
    return
  }
  // instagram url signature expiry
  if (hasRetried) { return }
  emit('retryUrlPreview')
  hasRetried = true
}

// title, description

const title = computed(() => {
  let title = props.card.urlPreviewTitle
  if (!title) {
    return props.card.urlPreviewUrl
  }
  title = title.replace('on Twitter', '')
  return title
})
const description = computed(() => {
  if (isTwitterUrl.value) {
    let description = props.card.urlPreviewDescription
    description = removeTrailingTweetText(description)
    return utils.truncated(description, 200)
  }
  return null
})

// url

const disableIsActive = () => {
  state.isActive = false
}
const enableIsActive = () => {
  state.isActive = true
}
const handleMouseEnterUrlButton = () => {
  globalStore.currentUserIsHoveringOverUrlButtonCardId = props.card.id
}
const handleMouseLeaveUrlButton = () => {
  if (globalStore.currentUserIsDraggingCard) { return }
  globalStore.currentUserIsHoveringOverUrlButtonCardId = ''
}
const handleTouchMove = () => {
  globalStore.preventDraggedCardFromShowingDetails = true
  disableIsActive()
}
const openUrl = async (event, url) => {
  const userIsConnecting = globalStore.currentConnectionStartItemIds.length
  if (userIsConnecting) { return }
  state.isActive = false
  globalStore.clearAllInteractingWithAndSelected()
  if (globalStore.currentUserIsDraggingConnectionIdLabel) { return }
  if (globalStore.preventDraggedCardFromShowingDetails) { return }
  if (event) {
    if (event.metaKey || event.ctrlKey) {
      window.open(url) // opens url in new tab
      globalStore.preventDraggedCardFromShowingDetails = true
      return
    } else {
      event.preventDefault()
      event.stopPropagation()
    }
  }
  globalStore.closeAllDialogs()
  if (event.type === 'touchend') {
    window.location = url
  } else {
    window.open(url) // opens url in new tab
  }
}
</script>

<template lang="pug">
//- image
.url-preview-card(v-if="visible" :style="{background: background}" :class="{'is-image-card': props.isImageCard}" :data-card-id="props.card.id")
  //- image
  template(v-if="!shouldDisplayIframe")
    .preview-image-wrap(v-if="previewImageIsVisible")
      img.preview-image(:src="props.card.urlPreviewImage" :class="{selected: isSelected, 'border-bottom-radius': shouldHideInfo}" ref="image" @error="handleImageError" loading="lazy")

  //- embed
  template(v-if="shouldDisplayIframe")
    iframe(:src="props.card.urlPreviewIframeUrl" :class="{ ignore: isInteractingWithItem }" :style="{ height: iframeHeight + 'px' }" sandbox="allow-same-origin allow-scripts allow-forms")
  //- url
  a.row.info.badge.status.button-badge.badge-card-button(
    v-if="!shouldHideInfo"
    :title="props.card.urlPreviewUrl"
    :href="props.card.urlPreviewUrl"
    :class="{ 'iframe-info': props.card.urlPreviewIframeUrl, 'preview-image-is-visible': previewImageIsVisible, active: state.isActive, 'is-being-dragged': globalStore.preventDraggedCardFromShowingDetails }"
    :style="{background: background}"
    target="_blank"
    @mouseenter="handleMouseEnterUrlButton"
    @mouseleave="handleMouseLeaveUrlButton"
    @mousedown.left="enableIsActive"
    @touchstart="enableIsActive"
    @click.stop.prevent
    @mouseup.left="openUrl($event, props.card.urlPreviewUrl)"
    @touchmove="handleTouchMove"
    @touchend.prevent="openUrl($event, props.card.urlPreviewUrl)"
  )
    //- play button
    .button-wrap.play-button-wrap(
      v-if="props.card.urlPreviewIframeUrl"
      @mousedown.stop
      @touchstart.stop
      @mouseup.stop.prevent
      @click.stop="toggleShouldDisplayIframe"
      @touchend.stop="toggleShouldDisplayIframe"
      @mouseenter="handleMouseEnterPlayButton"
      @mouseleave="handleMouseLeavePlayButton"
    )
      button.small-button(v-if="!isTwitterUrl")
        img.icon.stop(v-if="shouldDisplayIframe" src="@/assets/box-filled.svg")
        img.icon.play(v-else src="@/assets/play.svg")
      img.favicon(v-if="props.card.urlPreviewFavicon" :src="props.card.urlPreviewFavicon")
    //- text
    .text(v-if="!shouldHideInfo")
      .row
        template(v-if="!props.card.urlPreviewIframeUrl")
          img.favicon(v-if="props.card.urlPreviewFavicon" :src="props.card.urlPreviewFavicon")
          img.icon.favicon.open(v-else src="@/assets/open.svg")
        .title(:class="colorClasses")
          span {{title}}
      .description(v-if="description" :class="colorClasses")
        span {{description}}
</template>

<style lang="stylus">
.url-preview-card
  flex-wrap wrap
  background var(--secondary-active-background)
  border-radius var(--entity-radius)
  &:hover
    .badge.info,
    .badge.danger
      text-decoration none
  .row
    display flex
  .preview-image
    width 100%
    border-radius var(--entity-radius)
    background var(--primary-background)
    pointer-events none
    -webkit-touch-callout none // prevents safari mobile press-and-hold from interrupting
    &.selected
      mix-blend-mode color-burn

  &.is-image-card
    .preview-image
      border-radius 0
    .border-bottom-radius
      border-bottom-left-radius var(--entity-radius)
      border-bottom-right-radius var(--entity-radius)
    .badge-card-button
      border-top-left-radius 0
      border-top-right-radius 0

  .preview-image-wrap
    display flex

  .info
    margin 0
    padding var(--subsection-padding)

  .favicon
    border-radius var(--small-entity-radius)
    width 14px
    height 14px
    display inline-block
    margin-right var(--subsection-padding)
    margin-top 2px
    &.open
      width 12px
      vertical-align -2px
  .title
    word-wrap anywhere
  .description
    margin-top 10px
    word-wrap anywhere
  .title,
  .description
    &.is-background-light
      span
        color var(--primary-on-light-background)
    &.is-background-dark
      span
        color var(--primary-on-dark-background)

  iframe
    border none
    border-radius var(--entity-radius)
    border-bottom-left-radius 0
    border-bottom-right-radius 0
    max-width 100%
    width 100%
    height 100%
    &.ignore
      pointer-events none

  .play-button-wrap
    flex-shrink 0
    padding-right 4px
    height fit-content
    button
      width 23px
      background transparent
      .icon.play
        pointer-events none
        vertical-align 1px
        margin-left 4px
        margin-right 2px
      .icon.stop
        pointer-events none
        width 7px
        margin-left 3px
        margin-bottom 2px
    .favicon
      margin-left 4px
      margin-right 0
      margin-top 0
      vertical-align -1px

  button
    &:disabled
      opacity 1
      background-color var(--secondary-background)
      border-color var(--primary-transparent)
      img,
      span
        opacity 0.5

  .transparent
    opacity 0.5

  .add-icon
    margin-right 4px
    vertical-align 0

  .badge.button-badge
    &.preview-image-is-visible,
    &.iframe-info
      border-top-left-radius 0
      border-top-right-radius 0
</style>
