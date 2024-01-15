<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import backgroundImages from '@/data/backgroundImages.json'
import SpaceBackgroundGradients from '@/components/SpaceBackgroundGradients.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'
import postMessage from '@/postMessage.js'

import { colord, extend } from 'colord'

const store = useStore()

const visible = computed(() => store.getters.isSpacePage)
const spaceShouldHaveBorderRadius = computed(() => store.getters.spaceShouldHaveBorderRadius)
const isSecureAppContext = computed(() => consts.isSecureAppContext)
const isSpacePage = computed(() => {
  const isOther = store.state.isAddPage
  const isSpace = !isOther
  return isSpace
})
const isThemeDark = computed(() => store.state.currentUser.theme === 'dark')
const currentSpace = computed(() => store.state.currentSpace)
const backgroundIsDefault = computed(() => !currentSpace.value.background)

// Styles

const backgroundStyles = computed(() => {
  if (!isSpacePage.value) { return }
  const url = backgroundUrl.value
  if (!url) { return }
  const isRetina = url.includes('-2x.') || url.includes('@2x.')
  let backgroundImage = `url('${url}')`
  if (isRetina) {
    backgroundImage = `image-set(${backgroundImage} 2x)`
  }
  const styles = {
    backgroundImage,
    transform: store.getters.zoomTransform
  }
  return styles
})

// Image Url

const kinopioBackgroundImageData = computed(() => {
  const data = backgroundImages.find(item => {
    const background = currentSpace.value.background
    return background === item.url
  })
  return data
})
const backgroundUrl = computed(() => {
  let data = kinopioBackgroundImageData.value
  let url
  // darkUrl
  if (data && isThemeDark.value) {
    url = data.darkUrl || data.url
  // url
  } else if (data) {
    url = data.url
  } else {
    url = currentSpace.value.background
  }
  return url
})

// Tint

const backgroundTint = computed(() => {
  let color = currentSpace.value.backgroundTint || 'white'
  let darkness = 0
  const colorIsDark = utils.colorIsDark(color, 0.2)
  if (shouldDarkenTint.value && colorIsDark) {
    darkness = 0.5
  }
  color = colord(color).darken(darkness).toRgbString()
  postMessage.send({ name: 'setBackgroundTintColor', value: color })
  return color
})
const isNoBackgroundTint = computed(() => {
  const color = currentSpace.value.backgroundTint
  return !color || color === 'rgb(255, 255, 255)' || color === 'white'
})
const shouldDarkenTint = computed(() => isThemeDark.value && !spaceBackgroundTintIsDark.value)
const spaceBackgroundTintIsDark = computed(() => utils.colorIsDark(backgroundTint.value))

// Background Gradient

const gradientLayers = computed(() => {
  if (!currentSpace.value.backgroundIsGradient) { return }
  const layers = currentSpace.value.backgroundGradient
  return layers
})
</script>

<template lang="pug">
template(v-if="currentSpace.backgroundIsGradient")
  SpaceBackgroundGradients(:visible="true" :layers="gradientLayers" :backgroundStyles="backgroundStyles")
template(v-else)
  .space-background-image(:style="backgroundStyles" :class="{'space-border-radius': spaceShouldHaveBorderRadius}")
.space-background-tint(v-if="visible" :style="{ background: backgroundTint }" :class="{'space-border-radius': spaceShouldHaveBorderRadius && isSecureAppContext}")
.space-background-tint.dark-tint(v-if="visible && isThemeDark && isNoBackgroundTint")
</template>

<style lang="stylus">
.space-background-image
  position absolute
  width 100%
  height 100%
  pointer-events none
  z-index 0
  transform-origin top left
  background var(--primary-background)

.space-background-tint
  position absolute
  width 110%
  height 110%
  pointer-events none
  z-index 0
  mix-blend-mode multiply
  transform-origin top left
  &.dark-tint
    background-color black
    opacity 0.6
</style>
