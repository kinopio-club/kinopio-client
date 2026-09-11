<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useUserStore } from '@/stores/useUserStore'

import AboutJsonLd from '@/components/pages/about/AboutJsonLd.vue'
import Wordmark from '@/components/pages/Wordmark.vue'
import Header from '@/components/pages/Header.vue'
import AboutCTA from '@/components/pages/about/AboutCTA.vue'
import AboutSocialProof from '@/components/pages/about/AboutSocialProof.vue'
import AboutHowTo from '@/components/pages/about/AboutHowTo.vue'
import AboutExamples from '@/components/pages/about/AboutExamples.vue'
import AboutCollaborate from '@/components/pages/about/AboutCollaborate.vue'
import AboutTestimonials from '@/components/pages/about/AboutTestimonials.vue'
import AboutFAQ from '@/components/pages/about/AboutFAQ.vue'
import AboutCreator from '@/components/pages/about/AboutCreator.vue'
import HelpNav from '@/components/pages/help/HelpNav.vue'
import FooterSitemap from '@/components/pages/FooterSitemap.vue'
import Footer from '@/components/pages/Footer.vue'
import Notifications from '@/components/Notifications.vue'
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
  } else {
    document.title = 'Kinopio – Spatial Thinking'
  }
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
  Header(:isDocumentPage="true")
  main.page(@click="closeAllDialogs")
    .page-wrap
      section.intro
        Wordmark(:isH1="true" h2="SPATIAL THINKING")
        p Create mindmaps, moodboards, and whiteboards to think through your hardest problems.
        video(
          autoplay
          loop
          muted
          playsinline
          poster="https://updates.kinopio.club/pages/about/hero/1.webp"
          aria-label="Kinopio overview: Click and type anywhere to add cards, drag cards, drag between connectors to connect, play embeds, paint over cards to bulk edit."
          width="715"
          height="511"
        )
          source(src="https://updates.kinopio.club/pages/about/hero/1.webm")
        p Kinopio is a note-taking canvas for collecting and connecting your thoughts, ideas, and plans by yourself or collaboratively. Community-funded and{{' '}}
          a(href="https://pketh.org/organic-software.html") built for the long-term
          span .

        p Free for 100 cards. No sign up required.
        .button-wrap
          router-link(to="/app")
            button.success Open Kinopio

      //- ??about makers labels
      //- est 2018, hand made, etc
      //- or simple badges

      AboutHowTo

      AboutSocialProof

      AboutExamples

      AboutCollaborate

      section.more-features
        h2 Features for Creativity and Productivity
        HelpNav(:categorySlugs="['basics', 'advanced', 'importing-and-exporting']" :showCategoryNames="false")
        //- p
        //-   .button-wrap
        //-     a(href="/help")
        //-       button Help Topics
        //-   .button-wrap
        //-     a(href="/changelog")
        //-       button Changelog

      AboutFAQ

      //- AboutCTA
      section
        .button-wrap
          router-link(to="/app")
            button.success Open Kinopio

      AboutCreator

      AboutTestimonials

      FooterSitemap
  Footer
.notifications-wrap
  .left
    Notifications
</template>

<style lang="stylus">
// page.styl

section.more-features
  nav.help-nav
    margin-bottom 1.5rem
</style>
