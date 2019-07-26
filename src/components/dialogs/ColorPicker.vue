<template lang="pug">
dialog.narrow.color-picker(v-if="visible" :open="visible" @click.stop)
  section
    .badge(:style="{backgroundColor: currentColor}")
      input(v-model="hexColor")
  section
    .colors
      template(v-for="color in colors")
        button.color(:style="{backgroundColor: color}" @click="select(color)")
    button(@click="shuffleColors")
      img.refresh.icon(src="@/assets/refresh.svg")
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
      colors: []
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
    }
  },
  methods: {
    shuffleColors () {
      this.colors = randomColor({ luminosity: 'light', count: 14 })
      this.colors.unshift(this.currentColor)
    },
    select (color) {
      this.$emit('selectedColor', color)
    },
    updateColorFromInput (color) {
      this.select(color)
      this.colors.pop()
      this.colors.unshift(color)
    }
  },
  watch: {
    visible (visible) {
      this.shuffleColors()
    }
  }
}
</script>

<style lang="stylus">
.color-picker
  top calc(100% - 8px)
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
</style>
