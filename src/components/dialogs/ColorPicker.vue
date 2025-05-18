<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useUserStore } from '@/stores/useUserStore'

import Slider from '@/components/Slider.vue'
import utils from '@/utils.js'

import randomColor from 'randomcolor'
import shader from 'shader'
import throttle from 'lodash-es/throttle'

import { colord, extend } from 'colord'
import labPlugin from 'colord/plugins/lab'
extend([labPlugin])

const store = useStore()
const userStore = useUserStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['removeColor', 'selectedColor'])

const props = defineProps({
  currentColor: String,
  visible: Boolean,
  removeIsVisible: Boolean,
  shouldLightenColors: Boolean,
  recentColors: {
    type: Array,
    default: () => []
  },
  luminosityIsDark: Boolean,
  luminosityIsLight: Boolean,
  shouldHideOpacity: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateLuminosityFromTheme()
    shuffleColors()
    updateButtonHues()
    scrollIntoView()
    updateOpacityFromCurrentColor()
    // updateDialogHeight()
  }
})

const state = reactive({
  colors: [],
  currentHue: null,
  buttonHues: {
    red: [],
    green: [],
    blue: []
  },
  luminosity: 'light',
  opacity: 100
})

// styles

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const scrollIntoView = async () => {
  await nextTick()
  const element = dialogElement.value
  store.commit('scrollElementIntoView', { element })
}
const resetPinchCounterZoomDecimal = () => {
  store.commit('pinchCounterZoomDecimal', 1)
}
const triggerUpdateHeaderAndFooterPosition = () => {
  store.commit('triggerUpdateHeaderAndFooterPosition')
}

// recent colors

const uniqueRecentColors = computed(() => {
  const newColors = []
  const minDelta = 0.08
  const colors = props.recentColors.map(color => colord(color).toHex())
  colors.forEach((newColor, index) => {
    const isSimilar = newColors.some(color => {
      const delta = colord(color).delta(newColor) // 0 (colors are equal) to 1 (entirely different)
      return delta < minDelta
    })
    if (!isSimilar) {
      newColors.push(newColor)
    }
  })
  return newColors
})

// colors

const normalizeColor = (newColor) => {
  if (utils.colorIsValid(newColor)) {
    return newColor
  } else if (utils.colorIsValid(`#${newColor}`)) {
    return '#' + newColor
  }
}
const colorIsCurrent = (newColor) => {
  return newColor === props.currentColor
}
const removeColor = () => {
  emit('removeColor')
}
const color = computed({
  get () {
    return props.currentColor
  },
  set (newColor) {
    newColor = normalizeColor(newColor)
    throttledUpdateColor(newColor)
  }
})
const select = (newColor, isFavorite) => {
  const alpha = colord(newColor).alpha()
  const opacity = alpha * 100
  state.opacity = Math.round(opacity)
  color.value = newColor
}
const shuffleColors = () => {
  const luminosity = state.luminosity
  const isDark = luminosity === 'dark'
  state.colors = randomColor({ luminosity, count: 14, hue: state.currentHue })
  if (props.shouldLightenColors && !isDark) {
    state.colors = state.colors.map(color => shader(color, 0.4))
  }
  state.colors.unshift(props.currentColor)
}
const throttledUpdateColor = throttle((color) => {
  updateColor(color)
}, 400)

const updateColor = (newColor) => {
  emit('selectedColor', newColor)
}

// luminosity

const updateLuminosity = (value) => {
  if (state.luminosity === value) { return }
  state.luminosity = value
  shuffleColors()
}
const updateLuminosityFromTheme = () => {
  if (props.luminosityIsDark) {
    updateLuminosity('dark')
    return
  }
  if (props.luminosityIsLight) {
    updateLuminosity('light')
    return
  }
  const isThemeDark = userStore.theme === 'dark'
  if (isThemeDark) {
    updateLuminosity('dark')
  } else {
    updateLuminosity('light')
  }
}

// rgb hue

const hueIsAll = computed(() => state.currentHue === null)
const hueIsRed = computed(() => state.currentHue === 'red')
const hueIsGreen = computed(() => state.currentHue === 'green')
const hueIsBlue = computed(() => state.currentHue === 'blue')
const isDark = computed(() => {
  const isThemeDark = userStore.theme === 'dark'
  if (isTransparent.value && isThemeDark) {
    return utils.cssVariable('primary')
  }
  return utils.colorIsDark(props.currentColor)
})
const resetHue = () => {
  const shouldShuffle = state.currentHue !== null
  state.currentHue = null
  if (shouldShuffle) {
    shuffleColors()
  }
}
const updateHue = (hue) => {
  const shouldShuffle = state.currentHue !== hue
  state.currentHue = hue
  if (shouldShuffle) {
    shuffleColors()
  }
}
const updateButtonHues = () => {
  const hues = ['red', 'green', 'blue']
  const luminosity = state.luminosity
  hues.forEach(hue => {
    state.buttonHues[hue] = randomColor({ luminosity, count: 2, hue })
  })
}

// favorites

const favoriteColors = computed(() => userStore.favoriteColors || [])
const currentColorIsFavorite = computed(() => favoriteColors.value.includes(props.currentColor))
const toggleFavoriteColor = () => {
  const color = { color: props.currentColor }
  const value = !currentColorIsFavorite.value
  store.dispatch('currentUser/updateFavoriteColor', { color, value })
}

// opacity

const isTransparent = computed(() => {
  const isLabelled = props.currentColor === 'transparent'
  const isOpacity = state.opacity === 0
  return isLabelled || isOpacity
})
const updateOpacity = (value) => {
  state.opacity = Math.round(value)
  const color = colord(props.currentColor).alpha(state.opacity / 100).toRgbString()
  select(color)
}
const resetOpacity = () => {
  updateOpacity(100)
}
const updateOpacityFromCurrentColor = () => {
  const alpha = colord(props.currentColor).alpha()
  const opacity = alpha * 100
  updateOpacity(opacity)
}
const toggleOpacity = () => {
  if (state.opacity === 0) {
    updateOpacity(100)
  } else {
    updateOpacity(0)
  }
}
</script>

<template lang="pug">
dialog.narrow.color-picker(v-if="props.visible" :open="props.visible" ref="dialogElement" @click.left.stop :style="{'max-height': state.dialogHeight + 'px'}")
  section
    .row
      .badge.full-width-color-badge(:style="{backgroundColor: props.currentColor}")
        //- Input
        input(v-model="color" @focus="resetPinchCounterZoomDecimal" @blur="triggerUpdateHeaderAndFooterPosition" @keyup.stop.backspace :class="{ 'is-dark': isDark }" @mouseup.stop)
          //- Remove
        button.small-button.remove-button(v-if="props.removeIsVisible" title="remove" @click="removeColor")
          img.icon.cancel(src="@/assets/add.svg")
  section
    //- Colors
    .recent-colors(v-if="uniqueRecentColors")
      template(v-for="color in uniqueRecentColors")
        button.color(:style="{backgroundColor: color}" :class="{active: colorIsCurrent(color)}" @click.left="select(color)" :title="color")
    .colors
      template(v-for="color in state.colors")
        button.color(:style="{backgroundColor: color}" :class="{active: colorIsCurrent(color)}" @click.left="select(color)" :title="color")
    //- Opacity
    .row(v-if="!props.shouldHideOpacity")
      img.icon.transparent(src="@/assets/transparent.svg" @click="toggleOpacity")
      Slider(
        @updatePlayhead="updateOpacity"
        @resetPlayhead="resetOpacity"
        :minValue="0"
        :value="state.opacity"
        :maxValue="100"
      )
    .row
      //- shuffle
      button(title="shuffle colors" @click.left="shuffleColors")
        img.refresh.icon(src="@/assets/refresh.svg")
      //- luminosity
      .segmented-buttons.luminosity-picker
        button(title="light colors" :class="{active: state.luminosity === 'light'}" @click="updateLuminosity('light')")
          img.icon(src="@/assets/light.svg")
        button(title="dark colors" :class="{active: state.luminosity === 'dark'}" @click="updateLuminosity('dark')")
          img.icon(src="@/assets/dark.svg")
    .row
      //- hue
      .segmented-buttons
        button(@click="resetHue" :class="{active: hueIsAll}")
          span All
        button(@click="updateHue('red')" :class="{active: hueIsRed}")
          span R
        button(@click="updateHue('green')" :class="{active: hueIsGreen}")
          span G
        button(@click="updateHue('blue')" :class="{active: hueIsBlue}")
          span B
      //- spectrum
      .button-wrap
        input(type="color" v-model="color")
        img.spectrum.icon(src="@/assets/spectrum.png")
  //- Favorite Colors
  section.favorite-colors
    button.toggle-favorite-color(@click="toggleFavoriteColor")
      img.icon(v-if="!currentColorIsFavorite" src="@/assets/heart-empty.svg")
      img.icon(v-if="currentColorIsFavorite" src="@/assets/heart.svg")
      span.current-color(:style="{ background: currentColor }")
    template(v-for="color in favoriteColors")
      button.color(:style="{backgroundColor: color}" :class="{active: colorIsCurrent(color)}" @click.left="select(color, 'isFavorite')" :title="color")
</template>

<style lang="stylus">
.color-picker
  // overflow auto
  width 200px !important
  min-height 200px
  overflow auto
  .colors
    display flex
    flex-wrap wrap
    justify-content space-evenly
    margin-bottom 6px
  .recent-colors
    margin-bottom 8px
    margin-left 2px
  .color
    width 30px
    height 22px
    margin-bottom 5px
    margin-right 5px
    position relative
  button.color + button.color
    margin 0
    margin-bottom 5px
    margin-right 5px
  .refresh
    margin 0
    height 11px
    vertical-align 0
  .segmented-buttons
    margin-top 0
  .luminosity-picker
    margin-left 6px
  .full-width-color-badge
    width 100%
    margin 0
  input[type="color"]
    width 32px
    height 30px
    border-color var(--primary-border)
    &::-moz-color-swatch
      display none
  .spectrum
    top 8px
    left 9px
    position absolute
    width 14px
    height 14px
    pointer-events none
  section.favorite-colors
    display flex
    flex-wrap wrap
    align-items center
    margin-bottom -5px
    button.toggle-favorite-color
      display flex
      align-items center
      margin-right 5px
      margin-bottom 5px
    .current-color
      height 14px
      width 14px
      border-radius var(--small-entity-radius)
      display inline-block
    .color
      width 26px
  input
    border-color var(--primary-on-light-background)
    color var(--primary-on-light-background)
    &.is-dark
      border-color var(--primary-on-dark-background)
      color var(--primary-on-dark-background)
  .remove-button
    position absolute
    right 4px
  .icon.transparent
    margin-right 6px
    margin-top -1px
    cursor pointer
    pointer-events all
  .slider
    transform translateY(-10px)
    padding-bottom 0
</style>
