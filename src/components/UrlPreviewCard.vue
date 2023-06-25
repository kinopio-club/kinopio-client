<script setup>
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref } from 'vue'
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
  urlPreviewImageIsVisible: Boolean
})

const shouldHideImage = computed(() => props.card.shouldHideUrlPreviewImage)
const shouldHideInfo = computed(() => props.card.shouldHideUrlPreviewInfo)
const isImageCard = computed(() => props.isImageCard || props.urlPreviewImageIsVisible)
const updateDimensions = (event) => {
  store.dispatch('currentCards/updateDimensions', { cards: [props.card] })
}
const selectedColor = computed(() => {
  if (!props.isSelected) { return }
  return props.user.color
})
const isInteractingWithItem = computed(() => store.getters.isInteractingWithItem)
const embedIsScript = computed(() => {
  const embed = props.card.urlPreviewEmbedHtml
  if (!embed) { return }
  return embed.includes('<script')
})

// embed

const toggleShouldDisplayEmbed = () => {
  store.dispatch('closeAllDialogs')
  const embedIsVisibleForCardId = store.state.embedIsVisibleForCardId
  let value
  if (props.card.id === embedIsVisibleForCardId) {
    value = true
  }
  value = !value
  if (value) {
    store.commit('embedIsVisibleForCardId', props.card.id)
  } else {
    store.commit('embedIsVisibleForCardId', '')
  }
}
const shouldDisplayEmbed = computed(() => {
  const embedIsVisibleForCardId = store.state.embedIsVisibleForCardId
  return props.card.id === embedIsVisibleForCardId
})

const iframeHeightFromCardWidth = computed(() => {
  const width = props.card.resizeWidth || props.card.width
  const height = width * (2 / 3)
  return height
})

// twitter

const isTwitterUrl = computed(() => {
  const url = props.card.urlPreviewUrl
  return url.includes('twitter.com')
})
const removeTrailingTweetText = (description) => {
  const index = description.lastIndexOf('— ')
  description = description.substring(0, index)
  return description
}

// instagram url signature expiry

const retryPreviewImage = (event) => {
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
  let description = props.card.urlPreviewDescription
  if (isImageCard.value) {
    return
  } else if (isTwitterUrl.value) {
    return removeTrailingTweetText(description)
  }
  return utils.truncated(description, 200)
})

</script>

<template lang="pug">
//- image
.url-preview-card(v-if="visible" :style="{background: selectedColor}" :class="{'is-image-card': props.isImageCard}")
  //- image
  template(v-if="!shouldDisplayEmbed")
    .preview-image-wrap(v-if="card.urlPreviewImage && !shouldHideImage")
      img.preview-image(:src="card.urlPreviewImage" :class="{selected: isSelected, 'border-bottom-radius': !shouldHideInfo}" @load="updateDimensions" ref="image" @error="retryPreviewImage")

  //- embed
  template(v-if="shouldDisplayEmbed")
    .embed(v-if="embedIsScript")
      iframe(:srcdoc="card.urlPreviewEmbedHtml" :class="{ ignore: isInteractingWithItem }" :style="{ height: iframeHeightFromCardWidth + 'px' }")
    .embed(v-else v-html="card.urlPreviewEmbedHtml")

  .row.info.badge.status(v-if="!shouldHideInfo" :style="{background: selectedColor}")
    //- play
    .button-wrap.embed-button-wrap(v-if="card.urlPreviewEmbedHtml" @mousedown.stop @touchstart.stop @click.stop="toggleShouldDisplayEmbed" @touchend.stop="toggleShouldDisplayEmbed")
      button.small-button
        img.icon.stop(v-if="shouldDisplayEmbed" src="@/assets/box-filled.svg")
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

  .embed
    width 100%
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
