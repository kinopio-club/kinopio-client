<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import utils from '@/utils.js'
const store = useStore()

const props = defineProps({
  otherSpace: Object,
  url: String,
  card: Object,
  isSelected: Boolean,
  selectedColor: String
})

// space info

const otherSpaceIsPrivate = computed(() => {
  if (!props.otherSpace.privacy) { return }
  return props.otherSpace.privacy === 'private'
})
const isLoadingOtherItems = computed(() => store.state.isLoadingOtherItems)
const otherSpaceName = computed(() => {
  let name = props.otherSpace.name
  return name
})
const isRemoved = computed(() => {
  const space = props.otherSpace
  if (!space) { return }
  return space.isRemoved
})
const urlIsInvite = computed(() => utils.urlIsInvite(props.url))

// colors

const isThemeDark = computed(() => store.getters['themes/isThemeDark'])
const background = computed(() => {
  let color = props.selectedColor || props.card.backgroundColor
  const defaultColor = utils.cssVariable('secondary-background')
  const colorIsDefaultColor = utils.colorsAreEqual(color, defaultColor)
  if (colorIsDefaultColor || !color) { return }
  return utils.alternateColor(color, isThemeDark.value)
})

const textColorClasses = computed(() => {
  const defaultColor = utils.cssVariable('secondary-background')
  let color
  color = background.value || defaultColor
  if (isThemeDark.value) {
    color = background.value || defaultColor
  }
  return utils.textColorClasses({ backgroundColor: color })
})

// preivew image

const shouldShowPreviewImage = computed(() => props.card.shouldShowOtherSpacePreviewImage)
const previewImage = computed(() => props.otherSpace?.previewImage)
const previewImageIsVisible = computed(() => shouldShowPreviewImage.value && previewImage.value)

// url

const handleMouseEnterUrlButton = () => {
  store.commit('currentUserIsHoveringOverUrlButtonCardId', props.card.id)
}
const handleMouseLeaveUrlButton = () => {
  store.commit('currentUserIsHoveringOverUrlButtonCardId', '')
}
const openUrl = async (event, url) => {
  if (event) {
    if (event.metaKey || event.ctrlKey) {
      await nextTick()
      store.dispatch('closeAllDialogs')
      return
    } else {
      event.preventDefault()
      event.stopPropagation()
    }
  }
  store.dispatch('closeAllDialogs')
  if (store.state.cardsWereDragged) {
    return
  }
  changeSpace(url)
}
const changeSpace = async (url) => {
  const { spaceId, spaceUrl, cardId } = utils.spaceAndCardIdFromUrl(url)
  if (cardId) {
    changeSpaceAndCard(spaceId, cardId)
  } else {
    const space = { id: spaceId }
    store.dispatch('currentSpace/changeSpace', space)
  }
  store.dispatch('closeAllDialogs')
}
const changeSpaceAndCard = async (spaceId, cardId) => {
  const currentSpaceId = store.state.currentSpace.id
  // space and card
  if (currentSpaceId !== spaceId) {
    store.commit('loadSpaceShowDetailsForCardId', cardId)
    const space = { id: spaceId }
    store.dispatch('currentSpace/changeSpace', space)
  // card in current space
  } else {
    await nextTick()
    store.dispatch('currentCards/showCardDetails', cardId)
  }
}

</script>

<template lang="pug">
.other-space-preview-card(:class="textColorClasses")
  //- preview image
  .preview-image-wrap(v-if="previewImageIsVisible")
    img.preview-image(:src="previewImage" :class="{selected: props.isSelected}" ref="image")
  .badge.link-badge(:class="{ 'preview-image-is-visible': previewImageIsVisible }" :style="{ background: background }")
    //- badges
    .badge.info.inline-badge(v-if="urlIsInvite")
      span Invite
    .badge.danger.inline-badge(v-if="isRemoved")
      img.icon(src="@/assets/remove.svg")
    //- space info
    template(v-if="props.otherSpace")
      template(v-if="props.otherSpace.users")
        UserLabelInline(:user="props.otherSpace.users[0]" :shouldHideName="true")
      span.space-name
        span {{otherSpaceName}}
      img.icon.private(v-if="otherSpaceIsPrivate" src="@/assets/lock.svg")
    template(v-else)
      Loader(:visible="true" :isSmall="true" :isStatic="!isLoadingOtherItems")
      span Space
    //- Url →
    a.url-wrap(:href="props.url" @mouseup.exact.prevent="closeAllDialogs" @click.stop="openUrl($event, props.url)" @touchend.prevent="openUrl($event, props.url)" target="_blank" @mouseenter="handleMouseEnterUrlButton" @mouseleave="handleMouseLeaveUrlButton")
      .url.inline-button-wrap
        button.inline-button(:style="{ background: background }" tabindex="-1")
          img.icon.visit.arrow-icon(src="@/assets/visit.svg")
</template>

<style lang="stylus">
.other-space-preview-card
  text-decoration none
  margin 0
  > .badge
    display block
    margin 0
  .inline-badge
    display inline-block
    margin-right 6px
  .user-label-inline
    margin-right 6px
  .preview-image-is-visible
    border-top-left-radius 0
    border-top-right-radius 0
    padding var(--subsection-padding)
    .url-wrap
      top 6px

  // from UrlPreviewCard
  .preview-image-wrap
    display flex
  .preview-image
    width 100%
    border-radius var(--entity-radius)
    background var(--primary-background)
    pointer-events none
    -webkit-touch-callout none // prevents safari mobile press-and-hold from interrupting
    border-bottom-left-radius 0
    border-bottom-right-radius 0
    &.selected
      mix-blend-mode color-burn
  .space-name
    overflow-wrap break-word

  &.is-background-light
    .space-name span
      color var(--primary-on-light-background)
    .icon
      filter none
  &.is-background-dark
    .space-name span
      color var(--primary-on-dark-background)
    .icon
      filter invert()

  .url-wrap
    position absolute
    right 5px
    top 3px
    button
      background var(--secondary-active-background)
</style>
