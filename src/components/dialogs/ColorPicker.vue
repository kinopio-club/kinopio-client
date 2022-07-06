<template lang="pug">
dialog.narrow.color-picker(v-if="visible" :open="visible" ref="dialog" @click.left.stop)
  section(v-if="removeIsVisible")
    .row
      .badge.inline-color-badge(:style="{backgroundColor: currentColor}")
        input(v-model="color" @focus="resetPinchCounterZoomDecimal" @blur="triggerUpdatePositionInVisualViewport" @keyup.stop.backspace)
      button(@click="removeColor")
        img.icon(src="@/assets/remove.svg")
  section(v-if="!removeIsVisible")
    .badge(:style="{backgroundColor: currentColor}")
      input(v-model="color" @focus="resetPinchCounterZoomDecimal" @blur="triggerUpdatePositionInVisualViewport" @keyup.stop.backspace)
  section
    //- Colors
    .other-colors(v-if="otherColors")
      template(v-for="color in otherColors")
        button.color(:style="{backgroundColor: color}" @click.left="select(color)")
    .colors
      template(v-for="color in colors")
        button.color(:style="{backgroundColor: color}" @click.left="select(color)")

    //- Current Color Modifiers

    .row
      // shuffle
      button(@click.left="shuffleColors")
        img.refresh.icon(src="@/assets/refresh.svg")
      // luminosity
      .segmented-buttons.luminosity-picker
        button(:class="{active: luminosity === 'light'}" @click="updateLuminosity('light')")
          img.icon(src="@/assets/light.svg")
        button(:class="{active: luminosity === 'dark'}" @click="updateLuminosity('dark')")
          img.icon(src="@/assets/dark.svg")
    .row
      // hue
      .segmented-buttons
        button(@click="resetHue" :class="{active: hueIsAll}")
          span All
        button(@click="updateHue('red')" :class="{active: hueIsRed}")
          span R
        button(@click="updateHue('green')" :class="{active: hueIsGreen}")
          span G
        button(@click="updateHue('blue')" :class="{active: hueIsBlue}")
          span B
      // spectrum
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
      button.color(:style="{backgroundColor: color}" @click.left="select(color)")

</template>

<script>
import utils from '@/utils.js'

import randomColor from 'randomcolor'
import shader from 'shader'
import validateColor from 'validate-color'

export default {
  name: 'ColorPicker',
  props: {
    currentColor: String,
    visible: Boolean,
    removeIsVisible: Boolean,
    shouldLightenColors: Boolean,
    otherColors: Array
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
      luminosity: 'light'
    }
  },
  computed: {
    color: {
      get () {
        return this.currentColor
      },
      set (color) {
        if (color === 'transparent') {
          this.select(color)
        } else if (validateColor(color)) {
          this.updateColorFromInput(color)
        } else if (validateColor('#' + color)) {
          this.updateColorFromInput('#' + color)
        }
      }
    },
    hueIsAll () { return this.currentHue === null },
    hueIsRed () { return this.currentHue === 'red' },
    hueIsGreen () { return this.currentHue === 'green' },
    hueIsBlue () { return this.currentHue === 'blue' },
    favoriteColors () { return this.$store.state.currentUser.favoriteColors },
    currentColorIsUserColor () { return this.favoriteColors.includes(this.currentColor) }
  },
  methods: {
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
      this.colors = randomColor({ luminosity, count: 14, hue: this.currentHue })
      if (this.shouldLightenColors) {
        this.colors = this.colors.map(color => shader(color, 0.4))
      }
      this.colors.unshift(this.currentColor)
    },
    select (color) {
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
    }
  },
  watch: {
    visible (visible) {
      this.shuffleColors()
      this.updateButtonHues()
      this.scrollIntoView()
    }
  }
}
</script>

<style lang="stylus">
.color-picker
  .colors
    display flex
    flex-wrap wrap
    justify-content space-evenly
    margin-bottom 8px
  .other-colors
    margin-bottom 8px
    margin-left 2px
  .color
    width 30px
    height 22px
    margin-bottom 5px
    margin-right 5px
  button + button
    margin 0
  .refresh
    margin 0
    height 11px
  .segmented-buttons
    margin-top 0
  .luminosity-picker
    margin-left 6px
  .inline-color-badge
    width 83%
  input[type="color"]
    width 26px
    height 24px
    padding 10px
  .spectrum
    top 5px
    left 7px
    position absolute
    width 13px
    height 13px
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
      border-radius 3px
      display inline-block
    .color
      width 26px
</style>
