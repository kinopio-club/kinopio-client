<template lang="pug">
dialog.narrow.background(v-if="visible" :open="visible")
  section
    p Mobile Tips
  section(
    @mouseup.stop
    @touchend.stop
  )
    p
      img.icon(src="@/assets/press-and-hold.svg")
      span Press and hold to drag cards
    video(autoplay loop muted playsinline src="https://kinopio-updates.us-east-1.linodeobjects.com/mobile-press-hold-drag.mp4" height="83")

    p
      img.icon(src="@/assets/press-and-hold.svg")
      span Press and hold to paint cards
    video(autoplay loop muted playsinline src="https://kinopio-updates.us-east-1.linodeobjects.com/mobile-press-hold-paint.mp4" height="83")

</template>

<script>

export default {
  name: 'MobileTips',
  props: {
    visible: Boolean
  }
}
</script>

<style lang="stylus">
</style>
