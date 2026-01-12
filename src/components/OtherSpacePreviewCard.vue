<script setup>
import { reactive, computed, onMounted, watch, ref, nextTick } from 'vue'

import { useSpaceStore } from '@/stores/useSpaceStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useGlobalStore } from '@/stores/useGlobalStore'

import Loader from '@/components/Loader.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const spaceStore = useSpaceStore()
const themeStore = useThemeStore()

onMounted(() => {
  window.addEventListener('touchend', disableIsActive)
  window.addEventListener('mouseup', disableIsActive)
})
watch(() => globalStore.preventDraggedCardFromShowingDetails, (value, prevValue) => {
  disableIsActive()
})

const props = defineProps({
  otherSpace: Object,
  url: String,
  card: Object,
  isSelected: Boolean,
  selectedColor: String,
  isImageCard: Boolean
})

const state = reactive({
  isActive: null
})

// space info

const otherSpaceIsPrivate = computed(() => {
  if (!props.otherSpace.privacy) { return }
  return props.otherSpace.privacy === 'private'
})
const isLoadingOtherItems = computed(() => globalStore.isLoadingOtherItems)
const otherSpaceName = computed(() => {
  const name = props.otherSpace.name
  return name
})
const isRemoved = computed(() => {
  const space = props.otherSpace
  if (!space) { return }
  return space.isRemoved
})
const urlIsSpaceInvite = computed(() => utils.urlIsSpaceInvite(props.url))

// colors

const isThemeDark = computed(() => themeStore.getIsThemeDark)
const background = computed(() => {
  const color = props.selectedColor || props.card.backgroundColor
  const defaultColor = utils.cssVariable('secondary-background')
  const colorIsDefaultColor = utils.colorsAreEqual(color, defaultColor)
  if (colorIsDefaultColor || !color) { return }
  return utils.alternateColor(color, isThemeDark.value)
})

const colorClasses = computed(() => {
  const defaultColor = utils.cssVariable('secondary-background')
  let color
  color = background.value || defaultColor
  if (isThemeDark.value) {
    color = background.value || defaultColor
  }
  const classes = utils.colorClasses({ backgroundColor: color })
  if (props.isImageCard) {
    classes.push('is-image-card')
  }
  return classes
})

// preivew image

const shouldShowPreviewImage = computed(() => props.card.shouldShowOtherSpacePreviewImage)
const previewImage = computed(() => {
  let url = props.otherSpace?.previewImage
  if (url) {
    url = url + `?date=${utils.unixTime()}` // cache bust
  }
  return url
})
const previewImageIsVisible = computed(() => shouldShowPreviewImage.value && previewImage.value)

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
const url = computed(() => utils.urlFromSpaceAndItem({ spaceId: props.otherSpace?.url || props.otherSpace?.id }))
const openUrl = async (event) => {
  const prevIsActive = state.isActive
  state.isActive = false
  if (globalStore.currentUserIsDraggingConnectionIdLabel) { return }
  if (globalStore.preventDraggedCardFromShowingDetails) { return }
  if (event) {
    if (event.metaKey || event.ctrlKey) {
      window.open(url.value) // opens url in new tab
      globalStore.preventDraggedCardFromShowingDetails = true
      return
    } else {
      event.preventDefault()
      event.stopPropagation()
    }
  }
  spaceStore.changeSpace(props.otherSpace)
  globalStore.closeAllDialogs()
}
</script>

<template lang="pug">
.other-space-preview-card(:class="colorClasses")
  //- preview image
  .preview-image-wrap(v-if="previewImageIsVisible")
    img.preview-image(:src="previewImage" :class="{selected: props.isSelected}" ref="image")
  a.badge.link-badge.button-badge.badge-card-button(
    :title="url"
    :class="{ 'preview-image-is-visible': previewImageIsVisible, active: state.isActive, 'is-being-dragged': globalStore.preventDraggedCardFromShowingDetails }"
    :style="{ background: background }"
    target="_blank"
    :href="url"
    @mouseenter="handleMouseEnterUrlButton"
    @mouseleave="handleMouseLeaveUrlButton"
    @mousedown.left="enableIsActive"
    @touchstart="enableIsActive"
    @click.stop.prevent
    @mouseup.left="openUrl($event)"
    @touchend.prevent="openUrl($event)"
  )
    //- badges
    .badge.info.inline-badge(v-if="urlIsSpaceInvite")
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
</template>

<style lang="stylus">
.other-space-preview-card
  text-decoration none
  margin 0
  &:hover
    .badge.info,
    .badge.danger
      span
        text-decoration none
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

  // from UrlPreviewCard
  &.is-image-card
    .preview-image
      border-radius 0
    .badge-card-button
      border-top-left-radius 0
      border-top-right-radius 0
      padding var(--subsection-padding)

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

  .badge.button-badge
    &.preview-image-is-visible,
    &.iframe-info
      border-top-left-radius 0
      border-top-right-radius 0
</style>
