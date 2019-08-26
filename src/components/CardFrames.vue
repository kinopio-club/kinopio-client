<template lang="pug">
//aside.garden-leaves
//  img.leaves(src="@/assets/frames/garden-leaves/leaves.png")
//  img.ivy(src="@/assets/frames/garden-leaves/ivy.png")
//  img.flower(src="@/assets/frames/garden-leaves/flower.png")

aside.magical-helper
  img.cat(src="@/assets/frames/magical-helper/cat.png")

</template>

<style lang="stylus" scoped>
// aside
//   pointer-events none
img
  position absolute
.garden-leaves
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

.magical-helper
  .cat
    width 32px
    left -26px
    top -12px
</style>
