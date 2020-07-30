<template lang="pug">
canvas#drop-guides.drop-guides(
  :width="width"
  :height="height"
)
</template>
<script>
// Upload guides preview the location of dropped files

// let canvas, context

export default {
  name: 'DropGuides',
  props: {
    currentCursor: Object,
    width: Number,
    height: Number,
    uploadIsDraggedOver: Boolean
  },
  mounted () {
    // canvas = document.getElementById('drop-guides')
    // context = canvas.getContext('2d')
  }
}
</script>
<style lang="stylus" scoped>
.drop-guides
  pointer-events none
</style>
