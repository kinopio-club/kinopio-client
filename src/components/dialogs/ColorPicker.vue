<template lang="pug">
dialog.narrow.color-picker(v-if="colorPickerIsVisible" :open="colorPickerIsVisible" @click.stop)
  section
    .badge(:style="{backgroundColor: currentColor}")
      input(:value="currentColor")
  section
    .colors
      template(v-for="color in colors")
        button.color(:style="{backgroundColor: color}" @click="select(color)")
    button(@click="shuffleColors")
      img.refresh.icon(src="@/assets/refresh.svg")
</template>

<script>
import randomColor from 'randomcolor'

export default {
  name: 'ColorPicker',
  props: {
    currentColor: String,
    colorPickerIsVisible: Boolean
  },
  data () {
    return {
      colors: []
    }
  },
  computed: {
  },
  methods: {
    shuffleColors () {
      this.colors = randomColor({ luminosity: 'light', count: 14 })
      this.colors.unshift(this.currentColor)
    },
    select (color) {
      this.$emit('selectedColor', color)
    }
  },
  watch: {
    colorPickerIsVisible (visible) {
      this.shuffleColors()
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
</style>
