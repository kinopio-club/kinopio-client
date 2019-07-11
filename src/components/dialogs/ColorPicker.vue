<template lang="pug">
dialog(v-if="visible" :open="visible")
  section
    p colors
</template>

<script>
// import utils from '@/utils.js'
import randomColor from 'randomcolor'

export default {
  name: 'ColorPicker',
  props: {
    parentColor: undefined,
    parentDialog: undefined
  },
  data () {
    return {
      currentColor: undefined
    }
  },
  computed: {
    visible () { return this.$store.state.colorPickerIsVisible },
    swatches () { return randomColor({ luminosity: 'light', count: 27 }) }
    // position based on parentDialog
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
      if (visible) {
        this.currentColor = this.parentColor
      }
    }
  }
}
</script>

<style lang="stylus">
</style>
