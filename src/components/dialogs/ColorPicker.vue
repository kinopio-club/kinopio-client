<template lang="pug">
dialog.narrow(v-if="visible" :open="visible" :style="position")
  section
    p colors
</template>

<script>
// import utils from '@/utils.js'
import randomColor from 'randomcolor'

export default {
  name: 'ColorPicker',
  data () {
    return {
      currentColor: undefined
    }
  },
  computed: {
    visible () { return this.$store.state.colorPickerIsVisible },
    swatches () { return randomColor({ luminosity: 'light', count: 27 }) },
    position () {
      const position = this.$store.state.colorPickerPosition
      return {
        left: `${position.x}px`,
        top: `${position.y}px`
      }
    }

    // name: {
    //   get () {
    //     return this.card.name
    //   },
    //   set (newValue) {
    //     const options = {
    //       type: 'name',
    //       value: newValue,
    //       cardId: this.id
    //     }
    //     this.$store.commit('currentSpace/updateCardDetails', options)
    //   }
    // }
  },
  methods: {
    // resizeTextArea (event) {
    //   utils.resizeTextArea(event)
    // }
  },
  watch: {
    visible (visible) {
      console.log('🎨 color picker is visible', visible)
      // if (visible) {
      //   this.currentColor = this.parentColor
      // }
    }
  }
}
</script>

<style lang="stylus">
</style>
