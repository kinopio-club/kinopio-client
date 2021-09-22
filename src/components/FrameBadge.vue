<template lang="pug">
.badge
  template(v-if="frameHasBadge(frame)")
    template(v-if="frame.id === 1")
      img(src="@/assets/frames/garden-leaves/flower.png")
    template(v-else-if="frame.id === 2")
      img(src="@/assets/frames/magical-helper/hat.png")
    template(v-else-if="frame.id === 3")
      img(src="@/assets/frames/tea-time/pot.png")
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
