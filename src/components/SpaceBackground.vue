<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import backgroundImages from '@/data/backgroundImages.json'
import postMessage from '@/postMessage.js'

import { colord, extend } from 'colord'

const store = useStore()

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerUpdateBackground') {
      updateBackground()
    } else if (mutation.type === 'triggerUpdateTheme') {
      updateBackground()
    } else if (mutation.type === 'isLoadingSpace') {
      updateBackground()
    }
  })
})

const visible = computed(() => store.getters.isSpacePage)
const isSpacePage = computed(() => {
  const isOther = store.state.isAddPage
  const isSpace = !isOther
  return isSpace
})
const isThemeDark = computed(() => store.state.currentUser.theme === 'dark')
const backgroundIsDefault = computed(() => !store.state.currentSpace.background)

// Styles

const backgroundStyles = computed(() => {
  if (!isSpacePage.value) { return }
  const styles = {
    backgroundImage: `url('${store.state.spaceBackgroundUrl}')`,
    backgroundSize: store.state.spaceBackgroundSize,
    transform: store.getters.zoomTransform
  }
  return styles
})

// Image

const kinopioBackgroundImageData = computed(() => {
  const data = backgroundImages.find(image => {
    const background = store.state.currentSpace.background
    if (!background) {
      return image.isDefault
    }
    return background === image.url
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
    url = store.state.currentSpace.background
  }
  return url
})

// Tint

const backgroundTint = computed(() => {
  let color = store.state.currentSpace.backgroundTint || 'white'
  let darkness = 0
  if (shouldDarkenTint.value) {
    darkness = 0.5
  }
  color = colord(color).darken(darkness).toRgbString()
  postMessage.send({ name: 'setBackgroundTintColor', value: color })
  return color
})
const shouldDarkenTint = computed(() => isThemeDark.value && !spaceBackgroundTintIsDark.value)
const spaceBackgroundTintIsDark = computed(() => utils.colorIsDark(backgroundTint.value))

// Update State

const updateBackground = async () => {
  const background = backgroundUrl.value
  if (!utils.urlIsImage(background)) {
    updateBackgroundSize()
  }
  try {
    const image = await utils.loadImage(background)
    if (image) {
      store.commit('spaceBackgroundUrl', background)
      updateBackgroundSize()
    }
  } catch (error) {
    if (background) {
      console.warn('🚑 updateBackground', background, error)
    }
  }
}
const updateBackgroundSize = () => {
  let backgroundImage = store.state.spaceBackgroundUrl
  backgroundImage = utils.urlFromCSSBackgroundImage(backgroundImage)
  let image = new Image()
  image.src = backgroundImage
  let isRetina = backgroundImage.includes('-2x.') || backgroundImage.includes('@2x.')
  let width = image.width
  let height = image.height
  if (isRetina) {
    width = width / 2
    height = height / 2
  }
  if (width === 0 || height === 0) {
    store.commit('spaceBackgroundSize', 'initial')
    return
  }
  width = Math.round(width)
  height = Math.round(height)
  store.commit('spaceBackgroundSize', `${width}px ${height}px`)
}

</script>

<template lang="pug">
.space-background-image(:style="backgroundStyles")
.space-background-tint(v-if="visible" :style="{ background: backgroundTint }")
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
</style>
