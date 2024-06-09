<script setup>
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

let hasRetried
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

const shouldHideImage = computed(() => props.card.shouldHideUrlPreviewImage)
const shouldHideInfo = computed(() => props.card.shouldHideUrlPreviewInfo)
const isImageCard = computed(() => props.isImageCard || props.urlPreviewImageIsVisible)
const selectedColor = computed(() => {
  if (!props.isSelected) { return }
  return props.user.color
})
const isInteractingWithItem = computed(() => store.getters.isInteractingWithItem)

const background = computed(() => {
  const color = props.backgroundColor
  const defaultColor = utils.cssVariable('secondary-background')
  const colorIsDefaultColor = utils.colorsAreEqual(color, defaultColor)
  if (colorIsDefaultColor) { return }
  return color
})

// url embed (spotify, youtube, etc.)

const toggleShouldDisplayUrlEmbed = () => {
  if (isTwitterUrl.value) { return }
  store.dispatch('closeAllDialogs')
  store.dispatch('currentCards/incrementZ', props.card.id)
  const urlEmbedIsVisibleForCardId = store.state.urlEmbedIsVisibleForCardId
  let value
  if (props.card.id === urlEmbedIsVisibleForCardId) {
    value = true
  }
  value = !value
  if (value) {
    store.commit('urlEmbedIsVisibleForCardId', props.card.id)
    addAutoplay()
  } else {
    removeAutoplay()
    store.commit('urlEmbedIsVisibleForCardId', '')
  }
}
const shouldDisplayUrlEmbed = computed(() => {
  const urlEmbedIsVisibleForCardId = store.state.urlEmbedIsVisibleForCardId
  return props.card.id === urlEmbedIsVisibleForCardId
})
const urlEmbedIsIframeDoc = computed(() => {
  const embed = props.card.urlPreviewEmbedHtml
  if (!embed) { return }
  const isScript = embed.includes('<script')
  return isScript
})
const iframeHeight = computed(() => {
  const url = props.card.urlPreviewUrl
  let width = props.card.resizeWidth || props.card.width
  width = Math.max(width, consts.minCardEmbedWidth)
  let aspectRatio = 2 / 3
  if (utils.urlIsYoutube(url)) {
    aspectRatio = 9 / 15
  }
  let height = Math.round(width * aspectRatio)
  return height
})

// autoplay

const addAutoplay = async () => {
  await nextTick()
  document.querySelector('.embed iframe').addEventListener('load', autoplay)
}
const removeAutoplay = () => {
  document.querySelector('.embed iframe').removeEventListener('load', autoplay)
}
const autoplay = async () => {
  await nextTick()
  // spotify
  setTimeout(() => {
    document.querySelector('.embed iframe').contentWindow.postMessage({ command: 'play' }, '*')
  }, '200')
}

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
  console.log('🚑 urlPreviewCard handleImageError', event)
  const url = props.card.urlPreviewUrl
  const isInstagram = url.includes('instagram')
  // generic image error
  if (!isInstagram) {
    const card = {
      id: props.card.id,
      shouldHideUrlPreviewImage: true
    }
    store.commit('currentCards/update', card)
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
  if (!title) { return }
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

</script>

<template lang="pug">
//- image
.url-preview-card(v-if="visible" :style="{background: background}" :class="{'is-image-card': props.isImageCard}")
  //- image
  template(v-if="!shouldDisplayUrlEmbed")
    .preview-image-wrap(v-if="card.urlPreviewImage && !shouldHideImage")
      img.preview-image(:src="card.urlPreviewImage" :class="{selected: isSelected, 'border-bottom-radius': !shouldHideInfo}" ref="image" @error="handleImageError")

  //- embed
  template(v-if="shouldDisplayUrlEmbed")
    .embed.iframe-embed(v-if="urlEmbedIsIframeDoc")
      iframe(:srcdoc="card.urlPreviewEmbedHtml" :class="{ ignore: isInteractingWithItem }" :style="{ height: iframeHeight + 'px' }")
    .embed(v-else v-html="card.urlPreviewEmbedHtml")

  .row.info.badge.status.embed-info(v-if="!shouldHideInfo" :style="{background: background}")
    //- play
    .button-wrap.embed-button-wrap(v-if="card.urlPreviewEmbedHtml" @mousedown.stop @touchstart.stop @click.stop="toggleShouldDisplayUrlEmbed" @touchend.stop="toggleShouldDisplayUrlEmbed")
      button.small-button(v-if="!isTwitterUrl")
        img.icon.stop(v-if="shouldDisplayUrlEmbed" src="@/assets/box-filled.svg")
        img.icon.play(v-else src="@/assets/play.svg")
      img.favicon(v-if="card.urlPreviewFavicon" :src="card.urlPreviewFavicon")

    //- text
    .text(v-if="!shouldHideInfo")
      .row
        template(v-if="!card.urlPreviewEmbedHtml")
          img.favicon(v-if="card.urlPreviewFavicon" :src="card.urlPreviewFavicon")
          img.icon.favicon.open(v-else src="@/assets/open.svg")
        .title {{title}}
      .description(v-if="description") {{description}}

</template>

<style lang="stylus">
.url-preview-card
  flex-wrap wrap
  background var(--secondary-active-background)
  border-radius var(--entity-radius)
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
    border-top-left-radius 0
    border-top-right-radius 0
    .preview-image
      border-top-left-radius 0
      border-top-right-radius 0
  .border-bottom-radius
    border-bottom-left-radius 0
    border-bottom-right-radius 0

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

  .embed
    width 100%
    &.iframe-embed
      width calc(100% + 16px)
      margin-left -8px
      margin-bottom -20px

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

  .embed-info
    border-top-left-radius 0
    border-top-right-radius 0

  .embed-button-wrap
    flex-shrink 0
    padding-right 4px
    button
      width 23px
      background transparent
      .play
        vertical-align 1px
        margin-left 4px
        margin-right 2px
      .stop
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

</style>
