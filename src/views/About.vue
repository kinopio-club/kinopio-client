<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useUserStore } from '@/stores/useUserStore'

import AboutJsonLd from '@/components/page/about/AboutJsonLd.vue'
import Header from '@/components/page/Header.vue'
import AboutSocialProof from '@/components/page/about/AboutSocialProof.vue'
import AboutHowTo from '@/components/page/about/AboutHowTo.vue'
import AboutExamples from '@/components/page/about/AboutExamples.vue'
import AboutMoreFeatures from '@/components/page/about/AboutMoreFeatures.vue'
import AboutAtWork from '@/components/page/about/AboutAtWork.vue'
import AboutFAQ from '@/components/page/about/AboutFAQ.vue'
import FooterSitemap from '@/components/page/FooterSitemap.vue'
import Footer from '@/components/page/Footer.vue'
import consts from '@/consts.js'

const globalStore = useGlobalStore()
const themeStore = useThemeStore()
const userStore = useUserStore()

const appsButtonElement = ref(null)
let unsubscribes

if (!consts.isStaticPrerenderingPage) {
  window.globalStore = useGlobalStore()
  window.themeStore = useThemeStore()
  if (consts.isDevelopment()) {
    window.userStore = useUserStore()
  }
}

onMounted(() => {
  if (!consts.isStaticPrerenderingPage) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', logSystemThemeChange)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateSystemTheme)
    themeStore.restoreTheme()
  }
  if (consts.isDevelopment()) {
    document.title = '[DEV] Kinopio'
  }
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'closeAllDialogs') {
        // closeDialogs()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const closeAllDialogs = () => {
  globalStore.closeAllDialogs()
}

// theme

const isThemeDark = computed(() => themeStore.getIsThemeDark)
const logSystemThemeChange = (event) => {
  const themeIsSystem = userStore.themeIsSystem
  console.warn('🌓 logSystemThemeChange', window.matchMedia('(prefers-color-scheme: dark)'), event, { themeIsSystem })
}
const updateSystemTheme = () => {
  themeStore.updateSystemTheme()
}
</script>

<template lang="pug">
AboutJsonLd
.page(:class="{ 'is-dark-theme': isThemeDark }")
  Header
  main.page(@click="closeAllDialogs")
    .page-wrap
      section.intro
        h1.wordmark Kinopio
        p Spatial Thinking for Mindmaps, Moodboards, Whiteboards, Research, and Notes.
        video(
          autoplay
          loop
          muted
          playsinline
          poster="@/assets/page/about/hero/1.webp"
          aria-label="Kinopio overview: Click and type anywhere to add cards, drag cards, drag between connectors to connect, play embeds, paint over cards to bulk edit."
          width="715"
          height="511"
        )
          source(src="@/assets/page/about/hero/1.mp4")
        p Kinopio is a note-taking canvas for collecting and connecting your thoughts, ideas, and feelings. Community-funded and{{' '}}
          a(href="https://pketh.org/organic-software.html") built for the long-term
          span .
          //- Designed to work the way your mind works.
        p Free for 100 cards. No sign up required.

        //- cta
        .button-wrap
          router-link(to="/app")
            button.success Open Kinopio

      AboutHowTo

      AboutMoreFeatures

      AboutExamples

      AboutAtWork

      AboutFAQ

      AboutSocialProof

      section
        //- cta
        .button-wrap
          router-link(to="/app")
            button.success Open Kinopio

      section.about-me
        p Hi I'm{{' '}}
          a(href="https://pketh.org/about") Piri
          span , a designer, engineer, and tool-maker. I started Kinopio in 2018 to help people{{' '}}
          a(href="https://pketh.org/dream-of-being-understood.html") understand each other
          span , and themselves.
        p Previously, I was the co-creator and designer of {{' '}}
          a(href="https://pketh.org/the-first-four-years-of-glitch.html") Glitch
          span .
        p If you're curious, I wrote{{' '}}
          a(href="https://pketh.org/how-kinopio-is-made.html")
            span How Kinopio is Made
          span . I hope you enjoy using Kinopio and find it invaluable,
        img.icon.signature(width="70" height="36" src="https://help.kinopio.club/assets/about/signature.png" alt="signature")
        .row
          a(href="mailto:hi@kinopio.club") hi@kinopio.club
      FooterSitemap
  Footer
</template>

<style lang="stylus">
:root
  --page-entity-radius 16px

header
  z-index 1

main.page
  user-select text
  padding-top 6rem
  padding-bottom 4rem
  margin 0
  color var(--primary)
  background-color var(--primary-background)
  .page-wrap
    margin-left auto
    margin-right auto
    max-width 755px
    @media(max-width 760px)
      max-width 600px

    > section
      width 100%
      margin-bottom 2rem
      padding 0 20px
      > h1
        font-family var(--header-font-9)
        font-size 66px
        margin-block initial
        margin-bottom 1rem
      > h2
        font-size 21px
        max-width 400px
      > img
        margin-bottom 1rem
        border-radius var(--page-entity-radius)
      > p
        margin 1rem 0
        max-width 440px
        &:last-child
          margin-bottom 0
      a
        color var(--text-link)
        &:hover
          text-decoration none
      video
        max-width 100%
        height auto
      details + details
        margin-top 5px

    > section.intro
      video
        border-radius calc(var(--entity-radius) * 2)

    .signature
      width 70px
      margin 0
</style>
