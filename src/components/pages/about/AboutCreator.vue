<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useThemeStore } from '@/stores/useThemeStore'

const themeStore = useThemeStore()

const isThemeDark = computed(() => themeStore.getIsThemeDark)
</script>

<template lang="pug">
section.about-me
  .subsection-wrap
    section.subsection.mail-subsection(:class="{ dark: isThemeDark }")
      p Hi I'm{{' '}}
        a(href="https://pketh.org/about") Piri
        span , a designer, engineer, and tool-maker. I started Kinopio in 2018 to help people{{' '}}
        a(href="https://pketh.org/dream-of-being-understood.html") understand each other
        span , and stay aligned while working together.
      p Previously, I was the co-creator and designer of {{' '}}
        a(href="https://pketh.org/the-first-four-years-of-glitch.html") Glitch
        span .
      p If you're curious, I wrote{{' '}}
        a(href="https://pketh.org/how-kinopio-is-made.html")
          span How Kinopio is Made
        span . I hope you enjoy using Kinopio and find it invaluable,
      p
        img.icon.signature(width="70" height="36" src="https://updates.kinopio.club/pages/about/signature.png" alt="signature")
        br
        a(href="mailto:piri@kinopio.club") piri@kinopio.club
</template>

<style lang="stylus">
section.about-me
  max-width 440px
  .subsection-wrap
    border-radius var(--entity-radius)
    overflow hidden
    padding 0

  .mail-subsection
    --color1 #d93125
    --color2 #1240d5
    padding 8px 20px
    border 4px solid transparent
    border-image 4 repeating-linear-gradient(
      -45deg,
      var(--color1) 0,
      var(--color1) 1em,
      transparent 0,
      transparent 2em,
      var(--color2) 0,
      var(--color2) 3em,
      transparent 0,
      transparent 4em
    )
    &.dark
      --color1 #bd1f14
      --color2 #1f44bf
  p:last-child
    margin-bottom 10px
</style>
