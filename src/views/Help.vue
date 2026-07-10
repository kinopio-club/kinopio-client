<script setup>
import { reactive, computed, onMounted, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useThemeStore } from '@/stores/useThemeStore'

import Header from '@/components/pages/Header.vue'
import Wordmark from '@/components/pages/Wordmark.vue'
import FooterSitemap from '@/components/pages/FooterSitemap.vue'
import Footer from '@/components/pages/Footer.vue'
import helpPages from 'virtual:help-pages' // pages [{ slug, title, description, category }, {…}] from vite build
import AboutHowTo from '@/components/pages/about/AboutHowTo.vue'
import ResultsFilter from '@/components/ResultsFilter.vue'
import consts from '@/consts.js'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const themeStore = useThemeStore()
const route = useRoute()

const categoryColors = {
  basics: 'khaki',
  'getting-around': 'pink',
  'advanced-use': '#b9a8ff',
  collaboration: 'violet',
  'importing-and-exporting': 'lightskyblue',
  'about-kinopio': 'mediumaquamarine',
  community: 'burlywood',
  'user-settings': '#deb1ff',
  troubleshooting: '#a4dfdc',
  policies: 'salmon',
  press: '#c4c4c4'
}

onMounted(() => {
  if (!consts.isStaticPrerenderingPage) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateSystemTheme)
    themeStore.restoreTheme()
  }
  // css category colors
  Object.keys(categoryColors).forEach(key => utils.setCssVariable(key, categoryColors[key]))
})

const state = reactive({
  filter: '',
  filteredPages: []
})

// each md file becomes its own lazy-loaded chunk
const pageModules = import.meta.glob('../help/*.md')
const asyncPageComponents = {}
const asyncPageComponent = (slug) => {
  const loader = pageModules[`../help/${slug}.md`]
  if (!loader) { return null }
  if (!asyncPageComponents[slug]) {
    asyncPageComponents[slug] = defineAsyncComponent(loader)
  }
  return asyncPageComponents[slug]
}

const normalizeNewCategory = (name) => {
  const slug = utils.normalizeString(name)
  const color = categoryColors[slug]
  return { name, slug, color }
}
const categories = helpPages
  .reduce((list, page) => {
    const category = list.find(item => item.name === page.category)
    if (category) {
      category.pages.push(page)
    } else {
      const newCategory = normalizeNewCategory(page.category)
      newCategory.pages = [page]
      list.push(newCategory)
    }
    return list
  }, [])
  .sort((a, b) => a.name.localeCompare(b.name))

categories.forEach(category => category.pages.sort((a, b) => a.title.localeCompare(b.title)))

const closeAllDialogs = () => {
  globalStore.closeAllDialogs('page')
}

const currentSlug = computed(() => route.params.page)
const currentSlugIsRoot = computed(() => !currentSlug.value)
const pageContent = computed(() => asyncPageComponent(currentSlug.value))
const pageMeta = computed(() => helpPages.find(page => page.slug === currentSlug.value))
const currentPage = computed(() => helpPages.find(page => page.slug === currentSlug.value))
const currentCategory = computed(() => categories.find(category => category.name === currentPage.value?.category))
const categoryByPage = (page) => {
  return categories.find(category => page.category === category.name)
}

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

// styles

const isThemeDark = computed(() => themeStore.getIsThemeDark)
const updateSystemTheme = () => {
  themeStore.updateSystemTheme()
}
const badgeClasses = (page) => {
  const classes = []
  if (currentSlug.value === page.slug) {
    classes.push('active')
  }
  const category = categoryByPage(page)
  classes.push(category.slug)
  console.log('🍒🍒🍒', classes, category.slug)
  return classes
}
const articleStyles = computed(() => {
  const categoryColor = utils.cssVariable(currentCategory.value?.slug)

  console.log('🫑🫑🫑🫑🫑🫑🫑🫑🫑🫑', categoryColor, categories)

  // colord

  if (isThemeDark.value) {
    console.log(1)
  } else {
    console.log(1)
  }
  // - todo , lighten to 10 !isThemeDark, darken to 10 isThemeDark
  return ''
})

// filter

const searchPages = computed(() => {
  const blahWords = ['and', 'of', 'the', 'in', 'a', 'if', 'on', 'is', 'was', 'with', 'your', 'can']
  const pages = []
  return helpPages.map(page => {
    page.name = page.title
    const meta = `${page.title} ${page.description}`
    let keywords = meta.toLowerCase().split(' ')
    keywords = keywords.filter(keyword => !blahWords.includes(keyword))
    page.aliases = keywords
    return page
  })
})
const pagesFiltered = computed(() => {
  let items
  if (state.filter) {
    items = state.filteredPages
  } else {
    items = searchPages.value
  }
  return items
})
const pagesFilteredByCategory = (category) => {
  return pagesFiltered.value.filter(page => page.category === category.name)
}
const clearFilter = () => {
  state.filter = ''
}
const updateFilter = (filter) => {
  state.filter = filter
}
const updateFilteredPages = (pages) => {
  state.filteredPages = pages
}
const categoryIsVisible = (category) => {
  if (state.filter) {
    return Boolean(pagesFilteredByCategory(category).length)
  } else {
    return currentSlugIsRoot.value
  }
}
</script>

<template lang="pug">
.page(:class="{ 'is-dark-theme': isThemeDark }")
  Header(:isDocumentPage="true")
  main.page.help-page-wrap(@click="closeAllDialogs")
    .page-wrap
      section.intro
        Wordmark
        router-link(to="/help")
          h2.page-title Help Topics

      section.search
        ResultsFilter(
          :items="searchPages"
          :searchByAliases="true"
          @updateFilter="updateFilter"
          @updateFilteredItems="updateFilteredPages"
          @clearFilter="clearFilter"
          placeholder="Search Help"
          :shouldNotAutofocus="true"
        )

      section
        AboutHowTo(v-if="currentSlugIsRoot && !state.filter")

        nav(v-if="currentSlugIsRoot || state.filter")
          template(v-for="category in categories")
            section.category(v-if="categoryIsVisible(category)" :key="category.name")
              //- category name
              p.category-name
                span.badge.category-circle(:class="category.slug")
                span {{category.name}}
              //- pages
              ul
                li(v-for="page in pagesFilteredByCategory(category)" :key="page.slug")
                  router-link(:to="`/help/${page.slug}`")
                    .badge.button-badge(:class="badgeClasses(page)")
                      span {{ page.title }}

        article(:style="articleStyles")
          //- post
          template(v-if="pageContent")
            p.category-name
              router-link(to="/help")
                span ←
              span.badge.category-circle(:class="currentCategory.slug")
              span {{currentCategory?.name}}
            component(:is="pageContent")
          //- 404
          template(v-if="!pageContent && !currentSlugIsRoot")
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
    color var(--primary)
    &:hover
      text-decoration underline

  section.intro
    margin-bottom 1rem
    h2
      margin-bottom 0

  section.search
    max-width 350px

  .category-name
    display flex
    align-items center
    margin-right 0
    margin-bottom 10px

  nav
    margin-bottom 2rem
    section.category + section.category
      margin-top 1rem
    ul
      padding 0
      margin 0
      display flex
      flex-wrap wrap
      gap 10px 4px
    li
      list-style none
      margin 0
    a
      text-decoration none

  .category-circle
    width 10px
    height 10px
    min-width initial
    min-height initial
    border-radius 100px
    display inline-block

  section.how-to
    // max-width 715px
    margin-top 2rem
    margin-bottom 2rem
    h2
      display none

  article
    .markdown-body
      line-height 1.35
      h1
        margin-top 0
        font-size 24px
      h2
        font-size 18px
      h3
        font-size 16px
      p
        max-width 500px
      img,
      video
        border-radius var(--page-entity-radius)
        max-width 500px
        margin-top 10px
        &.large
          max-width 100%
        &.small
          max-width 300px
      ul
        max-width 500px
        padding-left 15px
      li
        line-height 1.35
      li + li
        margin-top 0.5rem
      blockquote
        margin-left 0
        border-left 1px solid var(--primary-border)
        padding-left 8px
        color var(--primary-transparent)

  .badge
    color var(--primary-on-light-background)
    &.basics
      background-color var(--basics)
    &.getting-around
      background-color var(--getting-around)
    &.advanced-use
      background-color  var(--advanced-use)
    &.collaboration
      background-color  var(--collaboration)
    &.importing-and-exporting
      background-color  var(--importing-and-exporting)
    &.about-kinopio
      background-color  var(--about-kinopio)
    &.community
      background-color  var(--community)
    &.user-settings
      background-color  var(--user-settings)
    &.troubleshooting
      background-color  var(--troubleshooting)
    &.policies
      background-color  var(--policies)
    &.press
      background-color  var(--press)

</style>
