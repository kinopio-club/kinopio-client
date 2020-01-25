<template lang="pug">
aside.frames
  .garden-leaves(v-if="isGardenLeaves")
    img.leaves(src="@/assets/frames/garden-leaves/leaves.png")
    img.ivy(src="@/assets/frames/garden-leaves/ivy.png")
    img.flower(src="@/assets/frames/garden-leaves/flower.png")

  .magical-helper(v-if="isMagicalHelper")
    img.cat(src="@/assets/frames/magical-helper/cat.png")
    img.hat(src="@/assets/frames/magical-helper/hat.png")
    img.moon(src="@/assets/frames/magical-helper/moon.png")

  .morning-brew(v-if="isMorningBrew")
    img.pot(src="@/assets/frames/morning-brew/pot.png")
    img.cup(src="@/assets/frames/morning-brew/cup.png")
    img.cloud(src="@/assets/frames/morning-brew/cloud.png")
    img.ichigotchi(src="@/assets/frames/morning-brew/ichigotchi.png")

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
    },
    isMorningBrew () {
      return Boolean(this.card.frameId === 3)
    }
  }
}

</script>

<style lang="stylus">
.frames
  img
    pointer-events none
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

  .morning-brew
    .pot
      left -30px
      top -5px
      width 40px
      transform scaleX(-1) rotate(6deg) // flipped horizontally
    .cup
      width 30px
      right 36px
      top -17px
    .cloud
      width 45px
      top -19px
      left 11px
    .ichigotchi
      width 25px
      right -8px
      top -22px
      transform rotate(5deg)
</style>
