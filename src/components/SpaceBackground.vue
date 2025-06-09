<script setup>
import { reactive, computed, onMounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import backgroundImages from '@/data/backgroundImages.json'
import SpaceBackgroundGradients from '@/components/SpaceBackgroundGradients.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const spaceShouldHaveBorderRadius = computed(() => globalStore.spaceShouldHaveBorderRadius)
const isSecureAppContext = computed(() => consts.isSecureAppContext)
const isSpacePage = computed(() => {
  const isOther = globalStore.isAddPage
  const isSpace = !isOther
  return isSpace
})
const isThemeDark = computed(() => userStore.theme === 'dark')
const backgroundIsDefault = computed(() => !spaceStore.background)
const pageHeight = computed(() => globalStore.pageHeight)
const pageWidth = computed(() => globalStore.pageWidth)

// Styles

const backgroundStyles = computed(() => {
  let url = backgroundUrl.value
  const tintColor = spaceStore.backgroundTint
  const styles = {}
  if (tintColor) {
    styles.background = 'transparent'
  }
  if (!url) {
    return styles
  }
  const isRetina = utils.urlIsRetina(url)
  url = utils.imgproxyUrl(url)
  let backgroundImage = `url('${url}')`
  if (isRetina) {
    backgroundImage = `image-set(${backgroundImage} 2x)`
  }
  styles.backgroundImage = backgroundImage
  styles.width = `${pageWidth.value}px`
  styles.height = `${pageHeight.value}px`
  return styles
})

// Image Url

const kinopioBackgroundImageData = computed(() => {
  const data = backgroundImages.find(item => {
    const background = spaceStore.background
    return background === item.url
  })
  return data
})
const backgroundUrl = computed(() => {
  const data = kinopioBackgroundImageData.value
  let url
  // darkUrl
  if (data && isThemeDark.value) {
    url = data.darkUrl || data.url
  // url
  } else if (data) {
    url = data.url
  } else {
    url = spaceStore.background
  }
  return url
})

// Background Gradient

const gradientLayers = computed(() => {
  if (!spaceStore.backgroundIsGradient) { return }
  const layers = spaceStore.backgroundGradient
  return layers
})
</script>

<template lang="pug">
//- gradient
template(v-if="spaceStore.backgroundIsGradient")
  SpaceBackgroundGradients(:visible="true" :layers="gradientLayers" :backgroundStyles="backgroundStyles")
//- or image
template(v-else)
  #space-background-image(:style="backgroundStyles" :class="{'space-border-radius': spaceShouldHaveBorderRadius}")
</template>

<style lang="stylus">
#space-background-image
  position absolute
  pointer-events none
  z-index 0
  transform-origin top left
  background var(--primary-background)
</style>
