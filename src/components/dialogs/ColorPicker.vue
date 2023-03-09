<template lang="pug">
dialog.narrow.color-picker(v-if="visible" :open="visible" ref="dialog" @click.left.stop)
  section
    .row
      .badge.full-width-color-badge(:style="{backgroundColor: currentColor}")
        //- Input
        input(v-model="color" @focus="resetPinchCounterZoomDecimal" @blur="triggerUpdatePositionInVisualViewport" @keyup.stop.backspace :class="{ 'is-dark': isDark }")
          //- Remove
        button.small-button.remove-button(v-if="removeIsVisible" title="remove" @click="removeColor")
          img.icon(src="@/assets/remove.svg")
  section
    //- Colors
    .recent-colors(v-if="recentColors")
      template(v-for="color in recentColors")
        button.color(:style="{backgroundColor: color}" :class="{active: colorIsCurrent(color)}" @click.left="select(color)")
    .colors
      template(v-for="color in colors")
        button.color(:style="{backgroundColor: color}" :class="{active: colorIsCurrent(color)}" @click.left="select(color)")

    //- Current Color Modifiers

    //- Opacity
    .row
      img.icon.transparent(src="@/assets/transparent.svg")
      Slider(
        @updatePlayhead="updateOpacity"
        @resetPlayhead="resetOpacity"
        :minValue="0"
        :value="opacity"
        :maxValue="100"
      )

    .row
      //- shuffle
      button(title="shuffle colors" @click.left="shuffleColors")
        img.refresh.icon(src="@/assets/refresh.svg")
      //- luminosity
      .segmented-buttons.luminosity-picker
        button(title="light colors" :class="{active: luminosity === 'light'}" @click="updateLuminosity('light')")
          img.icon(src="@/assets/light.svg")
        button(title="dark colors" :class="{active: luminosity === 'dark'}" @click="updateLuminosity('dark')")
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
      img.icon(v-if="!currentColorIsUserColor" src="@/assets/heart-empty.svg")
      img.icon(v-if="currentColorIsUserColor" src="@/assets/heart.svg")
      span.current-color(:style="{ background: currentColor }")
    template(v-for="color in favoriteColors")
      button.color(:style="{backgroundColor: color}" :class="{active: colorIsCurrent(color)}" @click.left="select(color, 'isFavorite')")

</template>

<script>
import Slider from '@/components/Slider.vue'
import utils from '@/utils.js'

import randomColor from 'randomcolor'
import shader from 'shader'
import { colord } from 'colord'

export default {
  name: 'ColorPicker',
  components: {
    Slider
  },
  props: {
    currentColor: String,
    visible: Boolean,
    removeIsVisible: Boolean,
    shouldLightenColors: Boolean,
    recentColors: Array
  },
  data () {
    return {
      colors: [],
      currentHue: null,
      buttonHues: {
        red: [],
        green: [],
        blue: []
      },
      luminosity: 'light',
      opacity: 100
    }
  },
  computed: {
    color: {
      get () {
        return this.currentColor
      },
      set (color) {
        if (utils.colorIsValid(color)) {
          this.updateColorFromInput(color)
        } else if (utils.colorIsValid(`#${color}`)) {
          this.updateColorFromInput('#' + color)
        }
      }
    },
    hueIsAll () { return this.currentHue === null },
    hueIsRed () { return this.currentHue === 'red' },
    hueIsGreen () { return this.currentHue === 'green' },
    hueIsBlue () { return this.currentHue === 'blue' },
    favoriteColors () { return this.$store.state.currentUser.favoriteColors || [] },
    currentColorIsUserColor () { return this.favoriteColors.includes(this.currentColor) },
    isTransparent () {
      const isLabelled = this.currentColor === 'transparent'
      const isOpacity = this.opacity === 0
      return isLabelled || isOpacity
    },
    isDark () {
      const isThemeDark = this.$store.state.currentUser.theme === 'dark'
      if (this.isTransparent && isThemeDark) {
        return utils.cssVariable('primary')
      }
      return utils.colorIsDark(this.currentColor)
    }
  },
  methods: {
    colorIsCurrent (color) {
      return color === this.currentColor
    },
    toggleFavoriteColor () {
      const color = { color: this.currentColor }
      if (this.currentColorIsUserColor) {
        this.$store.dispatch('currentUser/removeFavorite', { type: 'color', item: color })
      } else {
        this.$store.dispatch('currentUser/addFavorite', { type: 'color', item: color })
      }
    },
    updateLuminosity (value) {
      if (this.luminosity === value) { return }
      this.luminosity = value
      this.shuffleColors()
    },
    removeColor () {
      this.$emit('removeColor')
    },
    shuffleColors () {
      const luminosity = this.luminosity
      const isDark = luminosity === 'dark'
      this.colors = randomColor({ luminosity, count: 14, hue: this.currentHue })
      if (this.shouldLightenColors && !isDark) {
        this.colors = this.colors.map(color => shader(color, 0.4))
      }
      this.colors.unshift(this.currentColor)
    },
    select (color, isFavorite) {
      if (!isFavorite) {
        color = colord(color).alpha(this.opacity / 100).toRgbString()
      }
      this.$emit('selectedColor', color)
    },
    updateColorFromInput (color) {
      this.select(color)
      this.colors.pop()
      this.colors.unshift(color)
    },
    resetHue () {
      const shouldShuffle = this.currentHue !== null
      this.currentHue = null
      if (shouldShuffle) {
        this.shuffleColors()
      }
    },
    updateHue (hue) {
      const shouldShuffle = this.currentHue !== hue
      this.currentHue = hue
      if (shouldShuffle) {
        this.shuffleColors()
      }
    },
    updateButtonHues () {
      const hues = ['red', 'green', 'blue']
      const luminosity = this.luminosity
      hues.forEach(hue => {
        this.buttonHues[hue] = randomColor({ luminosity, count: 2, hue })
      })
    },
    resetPinchCounterZoomDecimal () {
      this.$store.commit('pinchCounterZoomDecimal', 1)
    },
    triggerUpdatePositionInVisualViewport () {
      this.$store.commit('triggerUpdatePositionInVisualViewport')
    },
    scrollIntoView () {
      this.$nextTick(() => {
        const element = this.$refs.dialog
        utils.scrollIntoView(element)
      })
    },
    updateLuminosityFromTheme () {
      const isThemeDark = this.$store.state.currentUser.theme === 'dark'
      if (isThemeDark) {
        this.updateLuminosity('dark')
      } else {
        this.updateLuminosity('light')
      }
    },
    updateOpacity (value) {
      this.opacity = Math.round(value)
      this.select(this.color)
    },
    resetOpacity () {
      this.updateOpacity(100)
    },
    updateOpacityFromCurrentColor () {
      const alpha = colord(this.currentColor).alpha()
      const opacity = alpha * 100
      this.updateOpacity(opacity)
    }
  },
  watch: {
    visible (visible) {
      this.updateLuminosityFromTheme()
      this.shuffleColors()
      this.updateButtonHues()
      this.scrollIntoView()
      this.updateOpacityFromCurrentColor()
    }
  }
}
</script>

<style lang="stylus">
.color-picker
  width 200px !important
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
  button + button
    margin 0
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
  .slider
    transform translateY(-10px)
    padding-bottom 0
</style>
