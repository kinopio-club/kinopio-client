<script setup>
import { reactive, computed, onMounted, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import backgroundImages from '@/data/backgroundImages.json'
import SpaceBackgroundGradients from '@/components/SpaceBackgroundGradients.vue'
import utils from '@/utils.js'
const store = useStore()

const props = defineProps({
  isButton: Boolean,
  buttonIsActive: Boolean,
  space: Object,
  box: Object
})

const backgroundTint = computed(() => props.space?.backgroundTint || props.box?.backgroundTint)
const backgroundColor = computed(() => props.space?.backgroundColor || props.box?.backgroundColor)
const background = computed(() => props.space?.background || props.box?.background)
const backgroundIsGradient = computed(() => props.space?.backgroundIsGradient)
const backgroundGradient = computed(() => props.space?.backgroundGradient)

const backgroundTintStyles = computed(() => {
  const color = backgroundTint.value
  if (color) {
    return {
      background: color
    }
  } else {
    return {}
  }
})
const backgroundStyles = computed(() => {
  if (backgroundIsGradient.value) { return }
  let backgroundImageUrl = background.value
  const backgroundImage = backgroundImages.find(image => {
    if (!backgroundImageUrl) {
      return image.isBlank
    }
    const isImage = image.url === backgroundImageUrl
    const hasThumbnailUrl = image.thumbnailUrl
    return isImage && hasThumbnailUrl
  })
  if (backgroundImage) {
    backgroundImageUrl = backgroundImage.thumbnailUrl || backgroundImageUrl
  }
  return {
    backgroundImage: `url(${backgroundImageUrl})`
  }
})
</script>

<template lang="pug">
.background-preview
  //- button
  .preview-button(v-if="isButton")
    .background-tint(:style="backgroundTintStyles")
    button.background-button.fixed-height(:style="backgroundStyles" :class="{ active: buttonIsActive }")
      SpaceBackgroundGradients(:visible="backgroundIsGradient" :layers="backgroundGradient")
  //- thumbnail
  .preview-wrap(v-else)
    .background-tint(:style="backgroundTintStyles")
    .background-image(:style="backgroundStyles")
    SpaceBackgroundGradients(:visible="backgroundIsGradient" :layers="backgroundGradient")
</template>

<style lang="stylus">
.background-preview
  display inline-block
  .background-tint
    mix-blend-mode multiply
  .preview-wrap
    height 22px
    width 22px
    position relative
    border-radius var(--entity-radius)
    overflow hidden
    display inline-block
    vertical-align -3px
    z-index 1
  .background-tint
    height 100%
    width 100%
    position absolute
    top 0
    left 0
    mix-blend-mode multiply
    border-radius calc(var(--entity-radius) + 1px)
    z-index 1
  .background-image
    height 100%
    width 100%
    background-size cover
    position absolute
    top 0
    left 0
    mix-blend-mode multiply
  .preview-button
    position relative
    cursor pointer
    border-radius calc(var(--entity-radius) + 1px)
    overflow hidden
    background-color white
    &:hover,
    &:active,
    &.active
      background-color var(--primary-background)
      background-size cover
      background-position center
    &:hover
      box-shadow var(--button-hover-shadow)
      background var(--secondary-hover-background)
    &:active
      box-shadow var(--button-active-inset-shadow)
      background var(--secondary-active-background)
  button
    width 28px
    background-size cover
    background-position center
    .space-background-gradients
      top 0
      left 0
</style>
