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
import ExploreDialog from '@/components/dialogs/Explore.vue'
import consts from '@/consts.js'

const globalStore = useGlobalStore()
const themeStore = useThemeStore()
const apiStore = useApiStore()
const userStore = useUserStore()

window.globalStore = useGlobalStore()
if (consts.isDevelopment()) {
  window.userStore = useUserStore()
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
// the dialog renders from these globalStore lists, same as DiscoveryButtons.vue

const updateCommunitySpaces = async () => {
  try {
    state.isLoadingSpaces = true
    const [explore, following, everyone] = await Promise.all([
      apiStore.getExploreSpaces(),
      apiStore.getFollowingUsersSpaces(),
      apiStore.getEveryoneSpaces()
    ])
    globalStore.exploreSpaces = explore
    globalStore.followingSpaces = following
    globalStore.everyoneSpaces = everyone
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

const description = 'Browse public spaces shared by the Kinopio community. Mindmaps, moodboards, planners, notes, and more.'

useHead(() => {
  let title = 'Explore Spaces – Kinopio'
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
        Wordmark(h2="EXPLORE" :isH1="true")
        p Public spaces shared by the Kinopio community.

      section.explore-section
        ExploreDialog(
          :visible="true"
          :loading="state.isLoadingSpaces"
          :unreadExploreSpacesCount="0"
          :unreadFollowingSpacesCount="0"
          :unreadEveryoneSpacesCount="0"
          :errorIsLoading="state.errorIsLoading"
        )

      FooterSitemap
  Footer
</template>

<style lang="stylus">
main.page
  .explore-section
    dialog.explore
      // the dialog is normally positioned inside a toolbar popup. on this page it
      // is the page content, so let it sit in the flow at full width
      position static
      max-width 100%
</style>
