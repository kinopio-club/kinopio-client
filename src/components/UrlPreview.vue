<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

import { nanoid } from 'nanoid'
const store = useStore()

let position

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerUpdateUrlPreviewComplete') {
      const cards = store.state.prevNewTweetCards
      store.commit('addNotificationWithPosition', { message: `Thread Created (${cards.length})`, position, type: 'success', layer: 'app', icon: 'add' })
    }
  })
})

const emit = defineEmits(['toggleUrlsIsVisible'])

const props = defineProps({
  visible: Boolean,
  loading: Boolean,
  card: Object,
  isSelected: Boolean,
  user: Object,
  urlsIsVisibleInName: Boolean
})
const state = reactive({
  imageCanLoad: false,
  moreOptionsIsVisible: false,
  previewImageIsHover: false
})

const isSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())
const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const cardIsCreatedByCurrentUser = computed(() => store.getters['currentUser/cardIsCreatedByCurrentUser'](props.card))
const canEditCard = computed(() => {
  if (isSpaceMember.value) { return true }
  if (canEditSpace.value && cardIsCreatedByCurrentUser.value) { return true }
  return false
})
const selectedColor = computed(() => {
  if (!props.isSelected) { return }
  return props.user.color
})

const previewHasInfo = computed(() => Boolean(props.card.urlPreviewTitle || props.card.urlPreviewDescription))
const isTextOnly = computed(() => shouldHideImage.value || !props.card.urlPreviewImage)
const filteredTitle = computed(() => {
  let title = props.card.urlPreviewTitle
  if (!title) { return }
  title = title.replace('on Twitter', '')
  return title
})
const description = computed(() => {
  const url = props.card.urlPreviewUrl
  const isTwitterUrl = url.includes('twitter.com')
  if (isTwitterUrl) {
    let description = props.card.urlPreviewDescription
    return utils.truncated(description, 350)
  }
  return null
})

// preview image

const shouldLoadUrlPreviewImage = computed(() => props.card.urlPreviewImage && state.imageCanLoad)
const previewHasImage = computed(() => Boolean(props.card.urlPreviewImage))
const updateImageCanLoad = () => {
  state.imageCanLoad = true
}
const updateDimensions = () => {
  store.dispatch('currentCards/updateDimensions', { cards: [props.card] })
}
const previewImageHover = (value) => {
  state.previewImageIsHover = value
}

// show options

const toggleUrlsIsVisible = () => {
  emit('toggleUrlsIsVisible')
}
const toggleMoreOptionsIsVisible = () => {
  const value = !state.moreOptionsIsVisible
  state.moreOptionsIsVisible = value
}
const shouldHideInfo = computed(() => props.card.shouldHideUrlPreviewInfo)
const shouldHideImage = computed(() => props.card.shouldHideUrlPreviewImage)
const isShowAll = computed(() => {
  if (isShowNone.value) { return }
  return !shouldHideImage.value && !shouldHideInfo.value
})
const isShowImage = computed(() => {
  if (isShowNone.value) { return }
  return shouldHideInfo.value && !shouldHideImage.value
})
const isShowInfo = computed(() => {
  if (isShowNone.value) { return }
  return shouldHideImage.value && !shouldHideInfo.value
})
const isShowNone = computed(() => !props.card.urlPreviewIsVisible)
const showAll = () => {
  const card = {
    id: props.card.id,
    urlPreviewIsVisible: true,
    shouldHideUrlPreviewInfo: false,
    shouldHideUrlPreviewImage: false
  }
  store.dispatch('currentCards/update', card)
}

// toggle show

const updatePaths = async () => {
  // similar to CardDetails.updateDimensionsAndPathsDebounced
  await nextTick()
  store.dispatch('currentCards/updateDimensions', { cards: [props.card] })
  await nextTick()
  await nextTick()
  store.dispatch('currentConnections/updatePaths', { cardId: props.card.id })
}
const showImage = () => {
  const card = {
    id: props.card.id,
    urlPreviewIsVisible: true,
    shouldHideUrlPreviewInfo: true,
    shouldHideUrlPreviewImage: false
  }
  store.dispatch('currentCards/update', card)
  updatePaths()
}
const showInfo = () => {
  const card = {
    id: props.card.id,
    urlPreviewIsVisible: true,
    shouldHideUrlPreviewInfo: false,
    shouldHideUrlPreviewImage: true
  }
  store.dispatch('currentCards/update', card)
  updatePaths()
}
const showNone = async () => {
  const card = {
    id: props.card.id,
    urlPreviewIsVisible: false,
    shouldHideUrlPreviewInfo: false,
    shouldHideUrlPreviewImage: false
  }
  store.dispatch('currentCards/update', card)
  store.commit('removeUrlPreviewLoadingForCardIds', props.card.id)
  updatePaths()
}
</script>

<template lang="pug">
.row.url-preview(v-if="visible")
  Loader(:visible="loading")
  template(v-if="!loading")
    .preview-content(:style="{background: selectedColor}" :class="{'no-padding': shouldHideInfo && !shouldHideImage, 'is-no-info': !previewHasInfo, 'min-height': state.moreOptionsIsVisible }")
      //- card details buttons
      .content-buttons(v-if="canEditCard")
        .row
          //- hide url
          .button-wrap(v-if="state.moreOptionsIsVisible")
            button(@click="toggleUrlsIsVisible" :class="{active: urlsIsVisibleInName}")
              img.icon(v-if="urlsIsVisibleInName" src="@/assets/view-hidden.svg")
              img.icon(v-else src="@/assets/view.svg")
              span Hide URL
          .button-wrap
            button.small-button(@click.stop="toggleMoreOptionsIsVisible" :class="{active: state.moreOptionsIsVisible}")
              img.icon.down-arrow(src="@/assets/down-arrow.svg")
        //- all, image, text, none
        .row(v-if="previewHasInfo && state.moreOptionsIsVisible")
          .segmented-buttons
            button(v-if="previewHasImage && previewHasInfo" @click="showAll" :class="{active : isShowAll}")
              span All
            button(v-if="previewHasImage" @click="showImage" :class="{active : isShowImage}")
              span Image
            button(v-if="previewHasInfo" @click="showInfo" :class="{active : isShowInfo}")
              span Text
            button(@click="showNone" :class="{active : isShowNone}")
              span None
      //- image
      img.hidden(v-if="card.urlPreviewImage" :src="card.urlPreviewImage" @load="updateImageCanLoad")
      a.preview-image-wrap(v-if="!shouldHideImage && card.urlPreviewImage" :href="card.urlPreviewUrl" :class="{'side-image': !shouldHideInfo, transparent: isShowNone}" @mouseover="previewImageHover(true)" @mouseleave="previewImageHover(false)" target="_blank")
        img.preview-image.clickable-item(:src="card.urlPreviewImage" @load="updateDimensions")
      .text.badge(v-if="!shouldHideInfo" :class="{'side-text': shouldLoadUrlPreviewImage, 'text-with-image': card.urlPreviewImage && !shouldHideImage, transparent: isShowNone, 'text-only': isTextOnly }" :style="{background: selectedColor}")
        //- text
        div
          .row.info-row
            a(:href="card.urlPreviewUrl" :class="{ hover: state.previewImageIsHover }" target="_blank")
              img.favicon(v-if="card.urlPreviewFavicon" :src="card.urlPreviewFavicon")
              img.icon.favicon.open(v-else src="@/assets/open.svg")
              .title {{filteredTitle}}
          .description(v-if="description") {{description}}
</template>

<style lang="stylus">
.url-preview
  max-height 148px
  overflow hidden
  flex-wrap wrap
  &.row
    display flex
  .info-row
    align-items flex-start
  .preview-content
    width 100%
    position relative
    display flex
    align-items flex-start !important
    color var(--primary)
    text-decoration none
    word-break break-word
    background var(--secondary-hover-background)
    border-radius var(--entity-radius)
    padding var(--subsection-padding)
    &.min-height
      min-height 78px
    &.no-padding
      padding 0
    &.is-no-info
      min-height 38px !important
  .preview-image
    display block
    width 100%
    border-radius var(--entity-radius)
    background var(--primary-background)
    pointer-events none
    -webkit-touch-callout none // prevents safari mobile press-and-hold from interrupting

  a
    color var(--primary)
    text-decoration none
    &:hover,
    &.hover
      text-decoration underline
  a.preview-image-wrap
    max-height 120px
    overflow hidden
    padding-bottom 4px

  .side-image
    max-width 40%
    margin-right 6px
    display block

  .text
    position absolute
    background var(--secondary-hover-background)
    user-select text
    display flex
    top 0
    overflow hidden
    &.text-with-image
      border-radius var(--entity-radius)
      bottom 0
    &.text-only
      position relative
      margin 0
      border-radius var(--entity-radius)

  .side-text
    max-width calc(100% - 24px)
    position static
    margin 0
    padding 0
    display block

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

  .inline-button-wrap
    cursor pointer
    button
      cursor pointer

  .transparent
    opacity 0.5

  .icon.down-arrow
    padding-right 3px
    vertical-align 2px

</style>
