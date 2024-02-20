<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import BackgroundPreview from '@/components/BackgroundPreview.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import utils from '@/utils.js'
const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  initDefaultColor()
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerUpdateTheme') {
      initDefaultColor()
    }
  })
})

const props = defineProps({
  visible: Boolean
})

const state = reactive({
  colorPickerIsVisible: false,
  defaultColor: '#e3e3e3'
})

const currentUser = computed(() => store.state.currentUser)
const currentSpace = computed(() => store.state.currentSpace)
const initDefaultColor = () => {
  state.defaultColor = utils.cssVariable('secondary-background')
}
const closeChildDialogs = () => {
  state.colorPickerIsVisible = false
}

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
const defaultCardColor = computed(() => {
  const userDefault = currentUser.value.defaultCardBackgroundColor
  return userDefault || state.defaultColor
})
const userHasDefaultCardColor = computed(() => {
  const systemDefaultColor = utils.cssVariable('secondary-background')
  const userDefaultColor = currentUser.value.defaultCardBackgroundColor
  const defaultColorIsNotSystem = userDefaultColor !== systemDefaultColor
  return userDefaultColor && defaultColorIsNotSystem
})

// card color

const updateDefaultCardColor = (color) => {
  store.dispatch('currentUser/update', { defaultCardBackgroundColor: color })
}
const removeDefaultCardColor = () => {
  updateDefaultCardColor(null)
  closeChildDialogs()
}
const toggleColorPicker = () => {
  const value = !state.colorPickerIsVisible
  closeChildDialogs()
  state.colorPickerIsVisible = value
}

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
  closeChildDialogs()
}
const removeBackground = () => {
  store.dispatch('currentUser/update', { defaultSpaceBackground: null, defaultSpaceBackgroundTint: null, defaultSpaceBackgroundGradient: null })
  closeChildDialogs()
}
</script>

<template lang="pug">
dialog.narrow.theme-and-colors-settings(v-if="visible" :open="visible" @click.left.stop="closeChildDialogs" ref="dialogElement")
  section
    p Theme
    .button-wrap
      label(:class="{active: themeIsSystem}" @click.left.prevent="toggleThemeIsSystem" @keydown.stop.enter="toggleThemeIsSystem")
        input(type="checkbox" v-model="themeIsSystem")
        span Use System Theme
  //- card color
  section
    .row
      p Color to use as the default for new cards
    .row
      .button-wrap
        .segmented-buttons
          button(@click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible || userHasDefaultCardColor}")
            .current-color(:style="{ 'background-color': defaultCardColor }")
            span New Card Color
          button(@click.left.stop="removeDefaultCardColor")
            img.icon.cancel(src="@/assets/add.svg")
        ColorPicker(:currentColor="defaultCardColor" :visible="state.colorPickerIsVisible" @selectedColor="updateDefaultCardColor")
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
  .current-color
    height 14px
    width 14px
    margin-bottom 1px
    border-radius var(--small-entity-radius)
    display inline-block
    vertical-align -3px
    margin-right 5px
  .preview-wrap
    height 16px
    width 16px
    border-radius var(--small-entity-radius)
</style>
