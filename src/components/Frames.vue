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

  .morning-brew(v-if="isTeaTime")
    img.cloud(src="@/assets/frames/tea-time/cloud.png")
    img.pot(src="@/assets/frames/tea-time/pot.png")
    img.ichigotchi(src="@/assets/frames/tea-time/ichigotchi.png")

  .dead-to-me(v-if="isDeadToMe")
    img.spooky-witch(src="@/assets/frames/dead-to-me/spooky-witch.png")
    img.tombstone(src="@/assets/frames/dead-to-me/tombstone.png")
    img.spooky-eyes(src="@/assets/frames/dead-to-me/spooky-eyes.png")
    img.ghost(src="@/assets/frames/dead-to-me/ghost.png")

  .lil-guys(v-if="isLilGuys")
    img.pot-sitting(src="@/assets/frames/lil-guys/pot-sitting.png")
    img.pot-standing-side(src="@/assets/frames/lil-guys/pot-standing-side.png")
    img.flowers-02(src="@/assets/frames/lil-guys/flowers-02.png")
    img.pot-hanging(src="@/assets/frames/lil-guys/pot-hanging.png")
    img.flowers-01(src="@/assets/frames/lil-guys/flowers-01.png")

</template>

<script>
export default {
  props: {
    card: Object
  },
  computed: {
    id () { return this.card.frameId },
    isGardenLeaves () {
      return Boolean(this.id === 1)
    },
    isMagicalHelper () {
      return Boolean(this.id === 2)
    },
    isTeaTime () {
      return Boolean(this.id === 3)
    },
    isDeadToMe () {
      return Boolean(this.id === 4)
    },
    isLilGuys () {
      return Boolean(this.id === 5)
    }
  }
}

</script>

<style lang="stylus">
.frames
  img
    pointer-events none
    position absolute

  .dead-to-me
    .tombstone
      width 48px
      left -33px
      bottom -15px
    .spooky-eyes
      width 26px
      bottom -14px
      right 20px
      transform rotate(10deg)
    .ghost
      width 50px
      right -30px
      top -15px
    .spooky-witch
      width 65px
      left -40px
      bottom 10px
      z-index -1

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
      height 21px
      top -17px
      right 22px
      z-index -1

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
      left -25px
      top -5px
      width 31px
    .cloud
      width 45px
      top -19px
      left 7px
    .ichigotchi
      width 22px
      right -12px
      bottom -8px
      transform rotate(12deg)

  .lil-guys
    .pot-sitting
      width 30px
      right 30px
      top -20px
    .pot-standing-side
      width 30px
      left -18px
      bottom -13px
    .flowers-02
      width 30px
      left 2px
      top -22px
    .pot-hanging
      width 30px
      right -26px
      top calc(50% - 20px)
      z-index -1
    .flowers-01
      width 29px
      right -18px
      bottom -1px
      transform rotate(10deg)
</style>
