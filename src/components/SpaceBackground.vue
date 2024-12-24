<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import backgroundImages from '@/data/backgroundImages.json'
import SpaceBackgroundGradients from '@/components/SpaceBackgroundGradients.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'

const store = useStore()

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
const pageHeight = computed(() => store.state.pageHeight)
const pageWidth = computed(() => store.state.pageWidth)

// Styles

const backgroundStyles = computed(() => {
  const url = backgroundUrl.value
  const tintColor = currentSpace.value.backgroundTint
  let styles = {}
  if (tintColor) {
    styles.background = 'transparent'
  }
  if (!url) {
    return styles
  }
  const isRetina = url.includes('-2x.') || url.includes('@2x.')
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

// Background Gradient

const gradientLayers = computed(() => {
  if (!currentSpace.value.backgroundIsGradient) { return }
  const layers = currentSpace.value.backgroundGradient
  return layers
})
</script>

<template lang="pug">
//- gradient
template(v-if="currentSpace.backgroundIsGradient")
  SpaceBackgroundGradients(:visible="true" :layers="gradientLayers" :backgroundStyles="backgroundStyles")
//- or image
template(v-else)
  .space-background-image(:style="backgroundStyles" :class="{'space-border-radius': spaceShouldHaveBorderRadius}")
</template>

<style lang="stylus">
.space-background-image
  position absolute
  pointer-events none
  z-index 0
  transform-origin top left
  background var(--primary-background)
  pointer-events none
</style>
