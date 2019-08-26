<template lang="pug">
aside.garden-leaf
  img.leaves(src="@/assets/frames/garden/leaves.png")
  img.ivy(src="@/assets/frames/garden/ivy.png")
  img.flower(src="@/assets/frames/garden/flower.png")

</template>

<style lang="stylus" scoped>
// aside
//   pointer-events none
img
  position absolute
.garden-leaf
  .leaves
    left -20px
    width 25px
  .ivy
    right -23px
    top -5px
    width 32px
  .flower
    width 20px
    top -10px
    right 22px
</style>
