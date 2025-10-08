<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

const vPauseAnimation = {
  mounted (el) {
    const pauseAnimation = () => {
      el.style.animationPlayState = 'paused'
    }
    const resumeAnimation = () => {
      el.style.animationPlayState = 'running'
    }
    el.addEventListener('pointerover', pauseAnimation)
    el.addEventListener('pointerout', resumeAnimation)
    el._pauseAnimation = {
      pauseAnimation,
      resumeAnimation
    }
  },
  unmounted (el) {
    if (el._pauseAnimation) {
      el.removeEventListener('pointerover', el._pauseAnimation.pauseAnimation)
      el.removeEventListener('pointerout', el._pauseAnimation.resumeAnimation)
      delete el._pauseAnimation
    }
  }
}
defineExpose({ vPauseAnimation })
</script>

<template lang="pug">
section.features
  .row.horizontal
    p.marquee(v-pause-animation) Featuring ● Code Blocks and Markdown ● Real-Time Collaboration ● Privacy Settings ● Comments ● Card Frames ● Backlinked [[Tags]] ● Link Between /Spaces
  .row.horizontal
    p.marquee.row-2(v-pause-animation) ● Add Images, Websites, Pdfs ● Import and Export ● Save as PDF ● Public API ● Organize With Boxes ● Freehand Drawing ● Collaborative Space Groups
  .row.horizontal
    p.marquee.row-3(v-pause-animation) ● Quick Save to Inbox With Browser Extensions ● Trackable Todos ● Personal Templates ● Snap to Grid ● Other secret features may be available… (don’t tell anyone)

  p
    img.updated.icon(src="@/assets/updated.gif")
    span New features are being added all the time in{{' '}}
    a(href="/changelog") Changelog
    span .
</template>

<style lang="stylus">
section.features
  .horizontal
    display flex
    flex-wrap nowrap
    overflow-x hidden
    max-width 100%
    p
      flex 0 0 auto
      margin 0
  .row + .row
    margin-top 10px
  .marquee
    overflow-x hidden
    animation-name marquee
    animation-direction linear
    animation-timing-function linear
    animation-iteration-count infinite
    animation-duration 50s
    &.row-2
      animation-duration 45s
    &.row-3
      animation-duration 40s
@keyframes marquee
  0%
    transform translate(100px)
  100%
    transform translate(-100%)
</style>
