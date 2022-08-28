<template lang="pug">
aside
  canvas#drag-guide-line.drag-guide-line
  //- .y(v-if="yIsVisible" :style="yStyles")
</template>

<script>
// let canvas, context, remoteCanvas, remoteContext, paintingGuidesTimer, remotePaintingGuidesTimer

// const lineWidth = 100
// const maxAmplitude = 25
// let controlPointEvenY = maxAmplitude / 2
// let controlPointOddY = maxAmplitude / 2
// const centerLineY = maxAmplitude / 2
// let isReverse = false

export default {
  name: 'DragGuideLines',
  props: {
    currentCursor: Object
  },
  computed: {
    // currentUser () { return this.$store.state.currentUser },
    // yIsVisible () { return true },
    // yStyles () {
    //   return {
    //     borderColor: this.currentUser.color
    //   }
    // }
  },
  methods: {
  }
}
</script>

<style lang="stylus">
.drag-guide-line
  position absolute
  .y
    top 50px
    bottom 50px
    border-left 1px solid var(--primary)
    left 50px
    width 1px
</style>
