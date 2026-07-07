<script setup>
import { computed, onMounted, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useThemeStore } from '@/stores/useThemeStore'

import Header from '@/components/pages/Header.vue'
import Wordmark from '@/components/pages/Wordmark.vue'
import FooterSitemap from '@/components/pages/FooterSitemap.vue'
import Footer from '@/components/pages/Footer.vue'
import helpPages from 'virtual:help-pages'
import AboutHowTo from '@/components/pages/about/AboutHowTo.vue'
import consts from '@/consts.js'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const themeStore = useThemeStore()
const route = useRoute()

onMounted(() => {
  if (!consts.isStaticPrerenderingPage) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateSystemTheme)
    themeStore.restoreTheme()
  }
})

// each md file becomes its own lazy-loaded chunk
const pageModules = import.meta.glob('../help/*.md')
// post metadata ({ slug, title, description, category }) parsed from md
// frontmatter at build time by the help-pages plugin in vite.config.js,
// so listing posts doesn't pull their content chunks into this one
const categories = helpPages
  .reduce((list, page) => {
    const category = list.find(item => item.name === page.category)
    if (category) {
      category.pages.push(page)
    } else {
      list.push({ name: page.category, pages: [page] })
    }
    return list
  }, [])
  .sort((a, b) => a.name.localeCompare(b.name))
categories.forEach(category => category.pages.sort((a, b) => a.title.localeCompare(b.title)))

const asyncPageComponents = {}
const asyncPageComponent = (slug) => {
  const loader = pageModules[`../help/${slug}.md`]
  if (!loader) { return null }
  if (!asyncPageComponents[slug]) {
    asyncPageComponents[slug] = defineAsyncComponent(loader)
  }
  return asyncPageComponents[slug]
}

const currentSlug = computed(() => route.params.page)
const currentSlugIsRoot = computed(() => !currentSlug.value)
const PageContent = computed(() => asyncPageComponent(currentSlug.value))
const pageMeta = computed(() => helpPages.find(page => page.slug === currentSlug.value))

useHead(() => {
  let title = 'Kinopio Help'
  let description = 'Guides and documentation for using Kinopio'
  let path = '/help'
  if (pageMeta.value) {
    title = `${pageMeta.value.title} – Kinopio Help`
    description = pageMeta.value.description
    path = `/help/${pageMeta.value.slug}`
  }
  if (consts.isDevelopment()) {
    title = `[DEV] ${title}`
  }
  return {
    title,
    meta: [{ name: 'description', content: description }],
    link: [{ rel: 'canonical', href: `https://kinopio.club${path}` }]
  }
})

const closeAllDialogs = () => {
  globalStore.closeAllDialogs()
}

const badgeClasses = (page) => {
  const classes = []
  if (currentSlug.value === page.slug) {
    classes.push('active')
  }
  classes.push(utils.normalizeString(page.category))
  return classes
}

// theme

const isThemeDark = computed(() => themeStore.getIsThemeDark)
const updateSystemTheme = () => {
  themeStore.updateSystemTheme()
}

// TODO
// @/assets/pages/help/404-poster.webp
// - https://updates.kinopio.club/pages/..

</script>

<template lang="pug">
.page(:class="{ 'is-dark-theme': isThemeDark }")
  Header(:isDocumentPage="true")
  main.page.help-page-wrap(@click="closeAllDialogs")
    .page-wrap
      section.intro
        Wordmark
        router-link(to="/help")
          h2.page-title Help

        nav
          section.category(v-for="category in categories" :key="category.name")
            p.category-name {{ category.name }}
            ul
              li(v-for="page in category.pages" :key="page.slug")
                router-link(:to="`/help/${page.slug}`")
                  .badge.button-badge(:class="badgeClasses(page)")
                    span {{ page.title }}

        article
          //- home
          AboutHowTo(v-if="currentSlugIsRoot")
          //- post
          component(v-else-if="PageContent" :is="PageContent")
          //- 404
          template(v-else)
            h1 404 – Page not found
            video(
              autoplay
              loop
              muted
              playsinline
              aria-label="404 image"
              poster="@/assets/pages/help/404-poster.webp"
            )
              source(src="@/assets/pages/help/404.webm")
      FooterSitemap
  Footer
</template>

<style lang="stylus">
main.help-page-wrap
  // .page-wrap
  //   max-width 900px

  h1 + a
    display block
    width fit-content
    text-decoration none
  h2.page-title
    width fit-content
    color var(--primary-on-light-background)
    &:hover
      text-decoration underline

  nav
    .category-name
      margin-bottom 4px
      font-weight bold
    section.category + section.category
      margin-top 10px
    ul
      padding 0
      margin 0
    li
      list-style none
      display inline-block
      margin-right 4px
    a
      text-decoration none

    .badge
      color var(--primary-on-light-background)
      &.basics
        background-color yellow
      &.reference
        background-color pink

  section.how-to
    margin-top 2rem
    h2
      display none
  article
    margin-top 3rem
    margin-bottom 3rem
    h1
      font-size 20px
    h2
      font-size 18px
    h3
      font-size 16px
</style>
