<template lang="pug">
aside
  .garden-leaves(v-if="isGardenLeaves")
    img.leaves(src="@/assets/frames/garden-leaves/leaves.png")
    img.ivy(src="@/assets/frames/garden-leaves/ivy.png")
    img.flower(src="@/assets/frames/garden-leaves/flower.png")

  .magical-helper(v-if="isMagicalHelper")
    img.cat(src="@/assets/frames/magical-helper/cat.png")
    img.hat(src="@/assets/frames/magical-helper/hat.png")
    img.moon(src="@/assets/frames/magical-helper/moon.png")
</template>

<script>
export default {
  props: {
    card: Object
  },
  computed: {
    isGardenLeaves () {
      return Boolean(this.card.frameId === 1)
    },
    isMagicalHelper () {
      return Boolean(this.card.frameId === 2)
    }
  }
}

</script>

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
  .hat
    width 32px
    left -25px
    top -10px
  .moon
    width 23px
    right 28px
    top -15px
</style>
