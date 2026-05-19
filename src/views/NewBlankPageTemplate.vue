<script setup>

// update router.js, vite.config.js ssgOptions.includedRoutes

import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useUserStore } from '@/stores/useUserStore'

import AboutJsonLd from '@/components/pages/about/AboutJsonLd.vue'
import Header from '@/components/pages/Header.vue'
import Wordmark from '@/components/pages/Wordmark.vue'
import FooterSitemap from '@/components/pages/FooterSitemap.vue'
import Footer from '@/components/pages/Footer.vue'
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
    document.title = '[DEV] Kinopio Page Title'
  } else {
    document.title = 'Kinopio Page Title'
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
        Wordmark
        h2 Page Title

        p [page contents]

      FooterSitemap
  Footer
</template>

<style lang="stylus">
</style>
