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
import consts from '@/consts.js'
import helpPages from 'virtual:help-pages'

const globalStore = useGlobalStore()
const themeStore = useThemeStore()
const route = useRoute()

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

const currentSlug = computed(() => route.params.page || 'index')
const pageMeta = computed(() => helpPages.find(page => page.slug === currentSlug.value))
const PageContent = computed(() => asyncPageComponent(currentSlug.value))

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

onMounted(() => {
  if (!consts.isStaticPrerenderingPage) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateSystemTheme)
    themeStore.restoreTheme()
  }
})

const closeAllDialogs = () => {
  globalStore.closeAllDialogs()
}

// theme

const isThemeDark = computed(() => themeStore.getIsThemeDark)
const updateSystemTheme = () => {
  themeStore.updateSystemTheme()
}
</script>

<template lang="pug">
.page(:class="{ 'is-dark-theme': isThemeDark }")
  Header(:isDocumentPage="true")
  main.page.help-page-wrap(@click="closeAllDialogs")
    .page-wrap
      section.intro
        Wordmark
        h2.page-title Help
        nav.help-toc
          section.category(v-for="category in categories" :key="category.name")
            p.category-name {{ category.name }}
            ul
              li(v-for="page in category.pages" :key="page.slug")
                router-link(:to="`/help/${page.slug}`")
                  .badge.button-badge(:class="{ active: currentSlug === page.slug }") {{ page.title }}
        article.help-doc
          component(:is="PageContent" v-if="PageContent")
          template(v-else)
            p Page not found
            p
              router-link(to="/help") ← Back to Help
      FooterSitemap
  Footer
</template>

<style lang="stylus">
main.help-page-wrap
  .page-wrap
    max-width 900px
  nav.help-toc
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
  article.help-doc
    margin-top 1rem
    margin-bottom 3rem
    h1
      font-size 20px
    h2
      font-size 18px
    h3
      font-size 16px
</style>
