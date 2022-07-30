<template lang="pug">
dialog.narrow.box-details(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog" :style="styles" :data-box-id="box.id")
  //- .opening-frame(v-if="isOpening" :style="openingFrameStyle")
  section
    p box details: color, name, fill
    p bk = color
</template>

<script>
import utils from '@/utils.js'
// colorpicker

export default {
  name: 'BoxDetails',
  components: {
  },
  created () {
  //   this.$store.subscribe((mutation, state) => {
  //     if (mutation.type === 'closeAllDialogs') {
  //       this.closeAllDialogs()
  //     }
  //   })
  },
  mounted () {
  },
  beforeUnmount () {
  },
  data () {
    return {
    }
  },
  computed: {
    box () {
      const boxId = this.$store.state.boxDetailsIsVisibleForBoxId
      return this.$store.getters['currentBoxes/byId'](boxId) || {}
    },
    visible () { return utils.objectHasKeys(this.box) },
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal },
    styles () {
      let zoom = this.spaceCounterZoomDecimal
      const viewport = utils.visualViewport()
      const pinchCounterScale = utils.roundFloat(1 / viewport.scale)
      if (zoom === 1) {
        zoom = pinchCounterScale
      }
      const left = `${this.box.x + 8}px`
      const top = `${this.box.y + 8}px`
      return { transform: `scale(${zoom})`, left, top }
    }
  },
  methods: {
    closeDialogs () {}
  }
}
</script>

<style lang="stylus">
// dialog.dialog-name
</style>
