<template lang="pug">
dialog.narrow.color-picker(v-if="visible" :open="visible" @click.left.stop)
  section
    .badge(:style="{backgroundColor: currentColor}")
      input(v-model="hexColor" @focus="resetPinchCounterZoomDecimal")
  section
    .colors
      template(v-for="color in colors")
        button.color(:style="{backgroundColor: color}" @click.left="select(color)")
    .row
      button(@click.left="shuffleColors")
        img.refresh.icon(src="@/assets/refresh.svg")
      .segmented-buttons
        button(@click="resetHue" :class="{active: hueIsAll}")
          span All
        button(@click="updateHue('red')" :class="{active: hueIsRed}")
          span R
        button(@click="updateHue('green')" :class="{active: hueIsGreen}")
          span G
        button(@click="updateHue('blue')" :class="{active: hueIsBlue}")
          span B
</template>

<script>
import randomColor from 'randomcolor'
import validHexColor from 'valid-hex-color'

export default {
  name: 'ColorPicker',
  props: {
    currentColor: String,
    visible: Boolean
  },
  data () {
    return {
      colors: [],
      currentHue: null,
      buttonHues: {
        red: [],
        green: [],
        blue: []
      }
    }
  },
  computed: {
    hexColor: {
      get () {
        return this.currentColor
      },
      set (color) {
        if (validHexColor.check(color)) {
          this.updateColorFromInput(color)
        } else if (validHexColor.check('#' + color)) {
          this.updateColorFromInput('#' + color)
        }
      }
    },
    hueIsAll () { return this.currentHue === null },
    hueIsRed () { return this.currentHue === 'red' },
    hueIsGreen () { return this.currentHue === 'green' },
    hueIsBlue () { return this.currentHue === 'blue' }
  },
  methods: {
    shuffleColors () {
      this.colors = randomColor({ luminosity: 'light', count: 14, hue: this.currentHue })
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
      hues.forEach(hue => {
        this.buttonHues[hue] = randomColor({ luminosity: 'light', count: 2, hue })
      })
    },
    resetPinchCounterZoomDecimal () {
      this.$store.commit('pinchCounterZoomDecimal', 1)
    }
  },
  watch: {
    visible (visible) {
      this.shuffleColors()
      this.updateButtonHues()
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
    margin 0
    margin-left 6px
</style>
