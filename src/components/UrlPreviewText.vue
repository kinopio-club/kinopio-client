<script setup>
// import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch } from 'vue'
// https://vuex.vuejs.org/guide/composition-api.html#accessing-state-and-getters
import { useStore } from 'vuex'

import CardEmbed from '@/components/CardEmbed.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
const store = useStore()

const props = defineProps({
  card: Object,
  user: Object,
  visible: Boolean,
  isSelected: Boolean,
  isImageCard: Boolean
})
// const emit = defineEmits(['updateCount'])

// watch(() => props.visible, (value, prevValue) => {
//   if (value) {
//     console.log('💁‍♀️', value)
//   }
// })

const state = reactive({
  shouldDisplayEmbed: false,
  embedUrl: ''
})

const shouldHideImage = computed(() => props.card.shouldHideUrlPreviewImage)
const shouldHideInfo = computed(() => props.card.shouldHideUrlPreviewInfo)

const updateDimensions = () => {
  store.dispatch('currentCards/updateDimensions', { cards: [props.card] })
}

const isYoutubeUrl = computed(() => {
  const url = props.card.urlPreviewUrl
  return utils.urlIsYoutube(url)
})
const toggleShouldDisplayEmbed = () => {}

const selectedColor = computed(() => {
  if (!props.isSelected) { return }
  return props.user.color
})
const filteredTitle = computed(() => {
  let title = props.card.urlPreviewTitle
  if (!title) { return }
  title = title.replace('on Twitter', '')
  return title
})

// description

const description = computed(() => {
  let description = props.card.urlPreviewDescription
  // if (isYoutubeUrl) { return }
  description = utils.truncated(description, 200)
  console.log('🌺🌺🌺🌺', description)

  return description
})
const descriptionIsVisible = computed(() => {
  if (props.isImageCard) { return }
  return true
})

</script>

<template lang="pug">
//- CardEmbed(:visible="shouldDisplayEmbed" :url="embedUrl" :card="card")
//- image
//- .url-preview-image(v-if="visible && card.urlPreviewImage && !shouldHideImage")
//-   img.image(:src="card.urlPreviewImage" :class="{selected: isSelected}" @load="updateDimensions")

.badge.secondary.url-preview-text(v-if="visible && !shouldHideInfo" :style="{background: selectedColor}" :class="{'with-card-image': isImageCard}")
  //- play
  .button-wrap.embed-button-wrap(v-if="isYoutubeUrl" @mousedown.stop @touchstart.stop @click.stop="toggleShouldDisplayEmbed" @touchend.stop="toggleShouldDisplayEmbed")
    button
      img.icon.stop(v-if="state.shouldDisplayEmbed" src="@/assets/box-filled.svg")
      img.icon.play(v-else src="@/assets/play.svg")
  //- text
  .text(v-if="!shouldHideInfo")
    img.favicon(v-if="card.urlPreviewFavicon" :src="card.urlPreviewFavicon")
    img.icon.favicon.open(v-else src="@/assets/open.svg")
    .title {{filteredTitle}}
    .description(v-if="description && descriptionIsVisible") {{description}}
    //-

</template>

<style lang="stylus">
.badge.url-preview-text
  margin var(--subsection-padding)
  margin-top 0
  display inline-block
  width calc(100% - var(--subsection-padding) - var(--subsection-padding))
  padding var(--subsection-padding)
  .favicon
    border-radius var(--small-entity-radius)
    width 14px
    vertical-align -2px
    display inline
    margin-right 5px
    &.open
      width 12px
      vertical-align 0
  .title
    display inline
  .description
    margin-top 10px

  &.with-card-image
    border-top-left-radius 0
    border-top-right-radius 0

  .content-buttons
    z-index 1
    position absolute
    right 0
    top 0
    padding 4px
    pointer-events none
    .button-wrap,
    button
      pointer-events all
    .row
      justify-content flex-end

  .no-padding
    .card-inline-buttons
      padding 0

  .inline-button-wrap
    cursor pointer
    button
      cursor pointer

  .embed-button-wrap
    flex-shrink 0
    padding var(--subsection-padding)
    padding-top 8px
    padding-right 2px
    cursor pointer
    button
      background transparent
      .play
        width 8px
        vertical-align 1px
        margin-left 2px

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

  .preview-text-row
    display flex

</style>
