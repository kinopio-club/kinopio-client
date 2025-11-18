<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

const props = defineProps({
  card: Object
})

const id = computed(() => props.card?.frameId)
const isGardenLeaves = computed(() => Boolean(id.value === 1))
const isMagicalHelper = computed(() => Boolean(id.value === 2))
const isTeaTime = computed(() => Boolean(id.value === 3))
const isDeadToMe = computed(() => Boolean(id.value === 4))
const isLilGuys = computed(() => Boolean(id.value === 5))
const isPenPals = computed(() => Boolean(id.value === 6))
const isBookWorm = computed(() => Boolean(id.value === 7))
</script>

<template lang="pug">
aside.frames
  .garden-leaves(v-if="isGardenLeaves")
    img.leaves(src="@/assets/frames/garden-leaves/leaves.webp")
    img.ivy(src="@/assets/frames/garden-leaves/ivy.webp")
    img.flower(src="@/assets/frames/garden-leaves/flower.webp")

  .magical-helper(v-if="isMagicalHelper")
    img.cat(src="@/assets/frames/magical-helper/cat.webp")
    img.hat(src="@/assets/frames/magical-helper/hat.webp")
    img.moon(src="@/assets/frames/magical-helper/moon.webp")

  .morning-brew(v-if="isTeaTime")
    img.cloud(src="@/assets/frames/tea-time/cloud.webp")
    img.pot(src="@/assets/frames/tea-time/pot.webp")
    img.ichigotchi(src="@/assets/frames/tea-time/ichigotchi.webp")

  .dead-to-me(v-if="isDeadToMe")
    img.spooky-witch(src="@/assets/frames/dead-to-me/spooky-witch.webp")
    img.tombstone(src="@/assets/frames/dead-to-me/tombstone.webp")
    img.spooky-eyes(src="@/assets/frames/dead-to-me/spooky-eyes.webp")
    img.ghost(src="@/assets/frames/dead-to-me/ghost.webp")

  .lil-guys(v-if="isLilGuys")
    img.pot-sitting(src="@/assets/frames/lil-guys/pot-sitting.webp")
    img.pot-standing-side(src="@/assets/frames/lil-guys/pot-standing-side.webp")
    img.flowers-02(src="@/assets/frames/lil-guys/flowers-02.webp")
    img.pot-hanging(src="@/assets/frames/lil-guys/pot-hanging.webp")
    img.flowers-01(src="@/assets/frames/lil-guys/flowers-01.webp")

  .pen-pals(v-if="isPenPals")
    img.dog-1.s-width(src="@/assets/frames/pen-pals/dog-1.webp")
    img.dog-2.m-width(src="@/assets/frames/pen-pals/dog-2.webp")
    img.dog-3.l-width(src="@/assets/frames/pen-pals/dog-3.webp")

  .book-worm(v-if="isBookWorm")
    img.worm-top(src="@/assets/frames/book-worm/worm-top.webp")
    img.worm-left.m-height(src="@/assets/frames/book-worm/worm-left.webp")
    img.worm-right.m-height(src="@/assets/frames/book-worm/worm-right.webp")
</template>

<style lang="stylus">
.card.s-width
  .m-width,
  .l-width
    display none
.card.m-width
  .l-width
    display none

.card.s-height
  .m-height,
  .l-height
    display none
.card.m-height
  .l-height
    display none

.frames
  img
    pointer-events none
    position absolute

  .book-worm
    .worm-top
      width 25px
      left 12%
      top -20px
    .worm-left
      width 20px
      left -15px
      bottom 10px
    .worm-right
      width 30px
      right -24px
      bottom 20%

  .pen-pals
    .dog-1
      width 34px
      left 5px
      top -21px
    .dog-2
      width 34px
      left calc(50% - 10px)
      top -21px
    .dog-3
      width 50px
      right -20px
      top -36px

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
      z-index 2
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
