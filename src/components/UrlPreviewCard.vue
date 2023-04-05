<script setup>
import CardEmbed from '@/components/CardEmbed.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref } from 'vue'
// https://vuex.vuejs.org/guide/composition-api.html#accessing-state-and-getters
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  card: Object,
  user: Object,
  visible: Boolean,
  isSelected: Boolean,
  isImageCard: Boolean,
  urlPreviewImageIsVisible: Boolean,
  isLoadingUrlPreview: Boolean
})

const state = reactive({
  shouldDisplayEmbed: false,
  embedUrl: '',
  embedHeight: ''
})

const shouldHideImage = computed(() => props.card.shouldHideUrlPreviewImage)
const shouldHideInfo = computed(() => props.card.shouldHideUrlPreviewInfo)
const isImageCard = computed(() => props.isImageCard || props.urlPreviewImageIsVisible)
const updateDimensions = () => {
  store.dispatch('currentCards/updateDimensions', { cards: [props.card] })
}
const selectedColor = computed(() => {
  if (!props.isSelected) { return }
  return props.user.color
})
const image = ref(null)

// youtube

const isYoutubeUrl = computed(() => {
  const url = props.card.urlPreviewUrl
  return utils.urlIsYoutube(url)
})
const isYoutubeShortenedUrl = computed(() => {
  const url = props.card.urlPreviewUrl
  return url.includes('https://youtu.be')
})
const youtubeUrlVideoId = computed(() => {
  if (!isYoutubeUrl.value) { return }
  const url = props.card.urlPreviewUrl
  let id
  if (isYoutubeShortenedUrl.value) {
    const idPattern = new RegExp(/([-a-zA-Z0-9])+$/g)
    // matches end from last '/'
    // https://youtu.be/-abABC123 → -abABC123
    id = url.match(idPattern)[0]
  } else {
    // matches 'v=' until next qs '&'
    // www.youtube.com/watch?v=PYeY8fWUyO8 → "v=PYeY8fWUyO8"
    const idPattern = new RegExp(/v=([^&]+)/g)
    id = url.match(idPattern)[0]
    id = id.slice(2, id.length)
  }
  return id
})
const youtubeEmbedUrl = computed(() => {
  if (!youtubeUrlVideoId.value) { return }
  const url = `https://www.youtube-nocookie.com/embed/${youtubeUrlVideoId.value}?autoplay=1`
  return url
})
const updateEmbedHeight = () => {
  console.log(image.value, image)
  const rect = image.value.getBoundingClientRect()
  state.embedHeight = rect.height + 'px'
}
const toggleShouldDisplayEmbed = () => {
  store.dispatch('closeAllDialogs')
  const value = !state.shouldDisplayEmbed
  if (value) {
    updateEmbedHeight()
    state.embedUrl = youtubeEmbedUrl.value
    if (!state.embedUrl) {
      store.commit('addNotification', { message: 'Could not get embed URL', type: 'danger' })
      return
    }
    store.commit('embedIsVisibleForCardId', props.card.id)
  } else {
    state.embedUrl = ''
    store.commit('embedIsVisibleForCardId', '')
  }
  state.shouldDisplayEmbed = value
}

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

// title, description

const title = computed(() => {
  let title = props.card.urlPreviewTitle
  if (!title) { return }
  title = title.replace('on Twitter', '')
  return title
})
const description = computed(() => {
  let description = props.card.urlPreviewDescription
  if (isImageCard.value || isYoutubeUrl.value) {
    return
  } else if (isTwitterUrl.value) {
    return removeTrailingTweetText(description)
  }
  return utils.truncated(description, 200)
})

</script>

<template lang="pug">
//- image
.url-preview-card(v-if="visible" :style="{background: selectedColor}" :class="{'border-top-radius': isImageCard}")
  //- TODO LOADer fix
  Loader(:visible="isLoadingUrlPreview")
  CardEmbed(:visible="state.shouldDisplayEmbed" :url="state.embedUrl" :card="card" :embedHeight="state.embedHeight")
  .preview-image-wrap(v-if="card.urlPreviewImage && !shouldHideImage && !state.shouldDisplayEmbed")
    img.preview-image(:src="card.urlPreviewImage" :class="{selected: isSelected, 'border-bottom-radius': !shouldHideInfo}" @load="updateDimensions" ref="image")
  .row.info.badge.secondary(v-if="!shouldHideInfo" :style="{background: selectedColor}")
    //- play
    .button-wrap.embed-button-wrap(v-if="isYoutubeUrl" @mousedown.stop @touchstart.stop @click.stop="toggleShouldDisplayEmbed" @touchend.stop="toggleShouldDisplayEmbed")
      button.small-button
        img.icon.stop(v-if="state.shouldDisplayEmbed" src="@/assets/box-filled.svg")
        img.icon.play(v-else src="@/assets/play.svg")
    //- text
    .text(v-if="!shouldHideInfo")
      .row
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

  &.border-top-radius
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

  .embed-button-wrap
    flex-shrink 0
    padding-right 8px
    padding-top 2px
    padding-left 5px
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
