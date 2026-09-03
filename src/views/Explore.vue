<script setup>

// update router.js, vite.config.js ssgOptions.includedRoutes

import { reactive, computed, onMounted } from 'vue'
import { useHead } from '@unhead/vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useApiStore } from '@/stores/useApiStore'
import { useUserStore } from '@/stores/useUserStore'

import Header from '@/components/pages/Header.vue'
import Wordmark from '@/components/pages/Wordmark.vue'
import FooterSitemap from '@/components/pages/FooterSitemap.vue'
import Footer from '@/components/pages/Footer.vue'
import Explore from '@/components/dialogs/Explore.vue'
import consts from '@/consts.js'

const globalStore = useGlobalStore()
const themeStore = useThemeStore()
const apiStore = useApiStore()

// window is undefined while vite-ssg prerenders. an unguarded access here throws
// during the render, and vite-ssg then writes the spa shell for this route without
// failing the build — so the page silently stops being prerendered
if (!consts.isStaticPrerenderingPage) {
  window.globalStore = useGlobalStore()
  if (consts.isDevelopment()) {
    window.userStore = useUserStore()
  }
}

const state = reactive({
  isLoadingSpaces: false,
  errorIsLoading: false
})

onMounted(() => {
  if (consts.isStaticPrerenderingPage) { return }
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateSystemTheme)
  themeStore.restoreTheme()
  updateCommunitySpaces()
})

// community spaces

const updateCommunitySpaces = async () => {
  try {
    state.isLoadingSpaces = true
    const [explore, following, everyone] = await Promise.all([
      apiStore.getExploreSpaces(),
      apiStore.getFollowingUsersSpaces(),
      apiStore.getEveryoneSpaces()
    ])
    globalStore.exploreSpaces = explore || []
    globalStore.followingSpaces = following || []
    globalStore.everyoneSpaces = everyone || []
  } catch (error) {
    console.error('🚑 updateCommunitySpaces', error)
    state.errorIsLoading = true
  }
  state.isLoadingSpaces = false
}

const closeAllDialogs = () => {
  globalStore.closeAllDialogs()
}

// meta
// deliberately not AboutJsonLd, which hardcodes the canonical to the home page

const description = 'Explore cool spaces shared by the Kinopio community. Mindmaps, moodboards, planners, notes, and more.'

useHead(() => {
  let title = 'Explore Community Spaces – Kinopio'
  if (consts.isDevelopment()) {
    title = `[DEV] ${title}`
  }
  const url = 'https://kinopio.club/explore'
  return {
    title,
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description }
    ],
    link: [{ rel: 'canonical', href: url }],
    script: [{
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Explore Kinopio Spaces',
        description,
        url,
        inLanguage: 'en',
        publisher: {
          '@type': 'Organization',
          '@id': 'https://kinopio.club/#organization',
          name: 'Kinopio',
          url: 'https://kinopio.club'
        }
      })
    }]
  }
})

// theme

const isThemeDark = computed(() => themeStore.getIsThemeDark)
const updateSystemTheme = () => {
  themeStore.updateSystemTheme()
}
</script>

<template lang="pug">
.page(:class="{ 'is-dark-theme': isThemeDark }")
  Header(:isDocumentPage="true")
  main.page(@click="closeAllDialogs")
    .page-wrap
      section.intro
        Wordmark(h2="EXPLORE COMMUNITY" :isH1="true")
        p Explore cool spaces shared by the Kinopio community. You can add your own spaces to Explore, or ask others to share theirs.{{' '}}
          a(href="/help/using-explore")
            button.small-button.tips-button ?
      section.explore-section
        Explore(
          :visible="true"
          :loading="state.isLoadingSpaces"
          :unreadExploreSpacesCount="0"
          :unreadFollowingSpacesCount="0"
          :unreadEveryoneSpacesCount="0"
          :errorIsLoading="state.errorIsLoading"
          :parentIsPage="true"
        )

      FooterSitemap
  Footer
</template>

<style lang="stylus">
main.page
  .explore-section
    dialog.explore
      position static
      max-width 100%
</style>
