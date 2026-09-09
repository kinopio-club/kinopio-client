<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
</script>

<template lang="pug">
section.subsection.cta
  video(autoplay loop muted playsinline)
    source(src="@/assets/pages/about/cta-background.mp4")

  .badge.secondary
    .button-wrap
      router-link(to="/app")
        button.success Open Kinopio
    span Free for 100 cards. No sign up required.

</template>

<style lang="stylus">
section.subsection.cta
  width fit-content
  // background-image url('@/assets/pages/about/cta-background.webp')
  // baackground-repeat repeat
  // background-size cover
  // background-position center
  padding 10px
  overflow hidden
  position relative
  .badge
    margin 0
  .button-wrap
    margin-right 6px
  video
    position absolute
    left 0
    top -230px
    width 100% !important
    padding 0
    border-radius 0 !important
</style>
