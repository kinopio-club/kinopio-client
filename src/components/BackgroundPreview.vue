<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import backgroundImages from '@/data/backgroundImages.json'
import utils from '@/utils.js'
const store = useStore()

const props = defineProps({
  isButton: Boolean,
  buttonIsActive: Boolean,
  space: Object
})

const backgroundTintStyles = computed(() => {
  const color = props.space.backgroundTint
  if (color) {
    return {
      background: color
    }
  } else {
    return {}
  }
})
const backgroundStyles = computed(() => {
  const defaultBackgroundThumbnail = 'https://bk.kinopio.club/background-thumbnail.svg'
  let background = props.space.background
  const backgroundImage = backgroundImages.find(image => {
    const isImage = image.url === background
    const hasThumbnailUrl = image.thumbnailUrl
    return isImage && hasThumbnailUrl
  })
  if (backgroundImage) {
    background = backgroundImage.thumbnailUrl || background
  }
  if (!utils.urlIsImage(background)) {
    background = defaultBackgroundThumbnail
  }
  return {
    backgroundImage: `url(${background})`
  }
})
</script>

<template lang="pug">
.background-preview
  //- button
  .preview-button(v-if="isButton")
    .background-tint(:style="backgroundTintStyles")
    button.background-button.fixed-height(:style="backgroundStyles" :class="{ active: buttonIsActive }")
  //- thumbnail
  .preview-wrap(v-else)
    .background-tint(:style="backgroundTintStyles")
    .background-image(:style="backgroundStyles")
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
    border-radius calc(var(--entity-radius) + 1)
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
    border-radius var(--entity-radius)
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
    .background-tint
      border-radius 4px
  button
    width 28px
    background-size cover
    background-position center
</style>
