<template lang="pug">
.badge
  template(v-if="frameHasBadge(frame)")
    template(v-if="frame.id === 1")
      img(src="@/assets/frames/garden-leaves/flower.png")
    template(v-else-if="frame.id === 2")
      img(src="@/assets/frames/magical-helper/hat.png")
    template(v-else-if="frame.id === 3")
      img(src="@/assets/frames/tea-time/pot.png")
    template(v-else-if="frame.id === 4")
      img(src="@/assets/frames/dead-to-me/spooky-eyes.png")
    template(v-else-if="frame.id === 5")
      img(src="@/assets/frames/lil-guys/pot-standing-side.png")
    template(v-else-if="frame.id === 6")
      img(src="@/assets/frames/pen-pals/icon.png")
</template>

<script>
export default {
  name: 'FrameBadge',
  props: {
    frame: Object
  },
  methods: {
    frameHasBadge (frame) {
      return frame.id !== 0
    }
  }
}
</script>

<style lang="stylus">
</style>
