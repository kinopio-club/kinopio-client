<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import BackgroundPreview from '@/components/BackgroundPreview.vue'
import utils from '@/utils.js'
const store = useStore()

const dialogElement = ref(null)

const props = defineProps({
  visible: Boolean
})

const currentUser = computed(() => store.state.currentUser)
const currentSpace = computed(() => store.state.currentSpace)

// theme

const themeIsSystem = computed(() => store.state.currentUser.themeIsSystem)
const toggleThemeIsSystem = () => {
  store.dispatch('themes/toggleIsSystem')
}
const updateTheme = (themeName) => {
  store.dispatch('themes/update', themeName)
}

// user default values

const defaultSpaceBackground = computed(() => currentUser.value.defaultSpaceBackground)
const defaultSpaceBackgroundTint = computed(() => currentUser.value.defaultSpaceBackgroundTint)
const defaultSpaceBackgroundGradient = computed(() => currentUser.value.defaultSpaceBackgroundGradient)
const spaceDefaults = computed(() => {
  const backgroundIsGradient = Boolean(defaultSpaceBackgroundGradient.value)
  return {
    background: defaultSpaceBackground.value,
    backgroundTint: defaultSpaceBackgroundTint.value,
    backgroundGradient: defaultSpaceBackgroundGradient.value,
    backgroundIsGradient
  }
})
const userHasDefaultBackground = computed(() => {
  return Boolean(defaultSpaceBackground.value || defaultSpaceBackgroundTint.value || defaultSpaceBackgroundGradient.value)
})

// space background

const updateBackground = () => {
  let updates
  if (currentSpace.value.backgroundIsGradient) {
    updates = {
      defaultSpaceBackgroundGradient: currentSpace.value.backgroundGradient,
      defaultSpaceBackground: null
    }
  } else {
    updates = {
      defaultSpaceBackgroundGradient: null,
      defaultSpaceBackground: currentSpace.value.background
    }
  }
  updates.defaultSpaceBackgroundTint = currentSpace.value.backgroundTint
  store.dispatch('currentUser/update', updates)
}
const removeBackground = () => {
  store.dispatch('currentUser/update', { defaultSpaceBackground: null, defaultSpaceBackgroundTint: null, defaultSpaceBackgroundGradient: null })
}
</script>

<template lang="pug">
dialog.narrow.theme-and-colors-settings(v-if="visible" :open="visible" ref="dialogElement")
  section
    p Theme Settings
  section
    .button-wrap
      label(:class="{active: themeIsSystem}" @click.left.prevent="toggleThemeIsSystem" @keydown.stop.enter="toggleThemeIsSystem")
        input(type="checkbox" v-model="themeIsSystem")
        span Use System Theme
  //- space background
  section
    .row
      p Set current background as the default for new spaces
    .row
      .button-wrap
        .segmented-buttons
          button(:class="{active: userHasDefaultBackground}" @click.left.stop="updateBackground")
            template(v-if="userHasDefaultBackground")
              BackgroundPreview(:space="spaceDefaults")
            span Set Background
          button(@click.left.stop="removeBackground")
            img.icon.cancel(src="@/assets/add.svg")
</template>

<style lang="stylus">
dialog.theme-and-colors-settings
  .background-preview
    margin-right 6px
  .preview-wrap
    height 16px
    width 16px
    border-radius var(--small-entity-radius)
</style>
