<template lang="pug">
dialog.narrow.color-picker(v-if="visible" :open="visible" :style="position")
  section
    .swatches
      template(v-for="swatch in swatches")
        button.swatch(:style="{backgroundColor: swatch}")
    .row
      button(@click="shuffleSwatches") 0
    input(value="#123xyz")
</template>

<script>
// import utils from '@/utils.js'
import randomColor from 'randomcolor'

export default {
  name: 'ColorPicker',
  data () {
    return {
      currentColor: undefined,
      swatches: []
    }
  },
  computed: {
    visible () { return this.$store.state.colorPickerIsVisible },
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
    shuffleSwatches () {
      this.swatches = randomColor({ luminosity: 'light', count: 15 })
    }
  },
  watch: {
    visible (visible) {
      this.shuffleSwatches()
      // if (visible) {
      //   this.currentColor = this.parentColor
      // }
    }
  }
}
</script>

<style lang="stylus">
.color-picker
  .swatches
    display flex
    flex-wrap wrap
    justify-content space-evenly
    margin-bottom 8px
  .swatch
    width 30px
    height 22px
    margin-bottom 5px
    margin-right 5px
    // margin-right -1px
    // margin-bottom -1px
    // margin-right 5px
    // margin-bottom 5px
  button + button
    margin 0

</style>
