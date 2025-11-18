<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

const state = reactive({
  isStatic: false
})

const toggleIsStatic = () => {
  state.isStatic = !state.isStatic
}

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
  .scrolling-rows(v-if="!state.isStatic" @click="toggleIsStatic")
    .row.horizontal
      p.marquee(v-pause-animation) Featuring ● Real-Time Collaboration ● Privacy Settings ● Code Blocks and Markdown ● Comments ● Card Frames ● Backlinked [[Tags]] ● Link Between /Spaces ● Works Offline
    .row.horizontal
      p.marquee.row-2(v-pause-animation) ● Dark Mode ● Add Images, Websites, Pdfs ● Import and Export ● Save as PDF ● Public API ● Organize With Boxes ● Freehand Drawing ● Collaborative Space Groups
    .row.horizontal
      p.marquee.row-3(v-pause-animation) ● Quick Save to Inbox With Browser Extensions ● Trackable Todos ● Personal Templates ● Snap to Grid ● Other secret features may be available… (don’t tell anyone)
  .static-row.row(v-if="state.isStatic" @click="toggleIsStatic")
    p Featuring ● Real-Time Collaboration ● Privacy Settings ● Code Blocks and Markdown ● Comments ● Card Frames ● Backlinked [[Tags]] ● Link Between /Spaces ● Works Offline ● Dark Mode ● Add Images, Websites, Pdfs ● Import and Export ● Save as PDF ● Public API ● Organize With Boxes ● Freehand Drawing ● Collaborative Space Groups ● Quick Save to Inbox With Browser Extensions ● Trackable Todos ● Personal Templates ● Snap to Grid ● Other secret features may be available… (don’t tell anyone)
  p
    img.updated.icon(src="@/assets/updated.gif" alt="updated" width="44" height="12")
    span New features are being added all the time in{{' '}}
    a(href="/changelog") Changelog
    span .
</template>

<style lang="stylus">
section.features
  .scrolling-rows
    cursor pointer
  .horizontal
    overflow-x hidden
    max-width 100%
    p
      margin 0
      text-wrap nowrap
      overflow visible
  .row
    cursor pointer
  .row + .row
    margin-top 10px
  .marquee
    overflow-x hidden
    animation-name marquee
    animation-direction linear
    animation-timing-function linear
    animation-iteration-count infinite
    animation-duration 45s
    &.row-2
      animation-duration 40s
    &.row-3
      animation-duration 35s
    @media(max-width 500px)
      animation-duration 30s
      &.row-2
        animation-duration 25s
      &.row-3
        animation-duration 20s
  .static-row
    p
      line-height 1.5
@keyframes marquee
  0%
    transform translate(0px)
  100%
    transform translate(-100%)
</style>
