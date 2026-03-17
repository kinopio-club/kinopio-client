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

const academic = computed(() => 'Used by students, teachers, and researchers, at ● NYU ● The New School (Parsons) ● Yale ● MIT ● Stanford ● Berkeley ● Columbia ● School for Poetic Computation  ● UCLA ● NYC ● Princeton')
const business = computed(() => 'And by designers, engineers, and PMs, at ● Discord ● Brilliant ● Cisco ● Wikimedia ● Atlassian ● Spotify ● Moving Brands ● Orange Telecom ● Planned Parenthood ● Kakao ● Digital Futures Lab')
</script>

<template lang="pug">
section.social-proof
  .scrolling-rows(v-if="!state.isStatic" @click="toggleIsStatic")
    .row.horizontal
      p.marquee(v-pause-animation) {{ academic }}
    .row.horizontal
      p.marquee.row-2(v-pause-animation) {{ business }}

  .static-row.row(v-if="state.isStatic" @click="toggleIsStatic")
    p {{ academic }}
    p {{ business }}

  p Kinopio has also been featured in{{' '}}
    a(href="https://www.theverge.com/23845815/threads-web-fabric-car-tech-installer-newsletter") The Verge
    span ,{{' '}}
    a(href="https://appstacks.club/kinopio") App Stacks
    span , and was the{{' '}}
    a(href="https://www.producthunt.com/products/kinopio") ProductHunt #1 Product of the Day
    span .
</template>

<style lang="stylus">
section.social-proof
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
