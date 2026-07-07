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

onMounted(() => {
  if (!consts.isStaticPrerenderingPage) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateSystemTheme)
    themeStore.restoreTheme()
  }
})

const state = reactive({
  filter: '',
  filteredPages: []
})

// each md file becomes its own lazy-loaded chunk
const pageModules = import.meta.glob('../help/*.md')

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

const closeAllDialogs = () => {
  globalStore.closeAllDialogs()
}

const currentSlug = computed(() => route.params.page)
const currentSlugIsRoot = computed(() => !currentSlug.value)
const pageContent = computed(() => asyncPageComponent(currentSlug.value))
const pageMeta = computed(() => helpPages.find(page => page.slug === currentSlug.value))
const searchPages = computed(() => {
  const pages = []
  return helpPages.map(page => {
    page.name = page.title
    page.aliases = page.description.split(' ')
    return page
  })
})

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

const badgeClasses = (page) => {
  const classes = []
  if (currentSlug.value === page.slug) {
    classes.push('active')
  }
  classes.push(utils.normalizeString(page.category))
  return classes
}

const categoryBadgeClass = (category) => {
  return utils.normalizeString(category.name)
}
const currentPage = computed(() => {
  const page = helpPages.find(page => page.slug === currentSlug.value)

  console.log('🎨🎨', categories, '❤️❤️❤️', page)
  return page
})
const currentCategory = computed(() => {
  const x = categories.find(category => category.name === currentPage.value.category)
  console.log('🎨🎨🎨🎨', x)
  return x
  // return utils.normalizeString(category?.name)
})
const currentCategoryClass = computed(() => utils.normalizeString(currentCategory.value.name))
// const currentCategoryName = computed(() => {
//   return currentCategory?.name
// })

// theme

const isThemeDark = computed(() => themeStore.getIsThemeDark)
const updateSystemTheme = () => {
  themeStore.updateSystemTheme()
}

// filter

const pagesFiltered = computed(() => {
  let items
  if (state.filter) {
    items = state.filteredPages
  } else {
    items = searchPages
  }
  return items
})
const clearFilter = () => {
  state.filter = ''
}
const updateFilter = (filter) => {
  state.filter = filter
  console.log('❤️❤️❤️', state.filter)
}
const updateFilteredPages = (pages) => {
  state.filteredPages = pages
  console.log('🗺️🗺️🗺️', state.filteredPages)
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
          h2.page-title Help

      section.search
        ResultsFilter(
          :items="searchPages"
          :searchByAliases="true"
          @updateFilter="updateFilter"
          @updateFilteredItems="updateFilteredPages"
          @clearFilter="clearFilter"
          placeholder="Search Help Topics"
          :shouldNotAutofocus="true"
        )

      section
        AboutHowTo(v-if="currentSlugIsRoot && !state.filter")

        nav
          section.category(v-if="currentSlugIsRoot || state.filter" v-for="category in categories" :key="category.name")
            p.category-name
              .badge.category-circle(:class="categoryBadgeClass(category)")
              span {{category.name}}
            ul
              li(v-for="page in category.pages" :key="page.slug")
                router-link(:to="`/help/${page.slug}`")
                  .badge.button-badge(:class="badgeClasses(page)")
                    span {{ page.title }}

        article
          //- post
          template(v-if="pageContent")
            p.category-name
              .badge.category-circle(:class="currentCategoryClass")
                //- (:class="pageCategoryBadgeClass(pageContent)")
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
    section.category + section.category
      margin-top 1rem
    ul
      padding 0
      margin 0
      display flex
      flex-wrap wrap
      gap 10px 4px
      // border-bottom 1px solid var(--primary-border)
      // padding-bottom 1rem
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
    margin-top 2rem
    margin-bottom 2rem
    h2
      display none

  article
    line-height 1.35
    h1,
    h2,
    h3
      font-family var(--header-font-4)
    h1
      margin-top 0
      font-size 24px
    h2
      border-top 1px solid var(--primary-border)
      padding-top 10px
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
    blockquote
      margin-left 0
      border-left 1px solid var(--primary-border)
      padding-left 8px
    // .markdown-body
    //   margin-top 10px

  .badge
    color var(--primary-on-light-background)
    &.basics
      background-color khaki
    &.getting-around
      background-color pink
    &.advanced-use
      background-color #b9a8ff
    &.collaboration
      background-color violet
    &.importing-and-exporting
      background-color lightskyblue
    &.about-kinopio
      background-color mediumaquamarine
    &.community
      background-color burlywood
    &.user-settings
      background-color #deb1ff
    &.troubleshooting
      background-color #a4dfdc
    &.policies-and-privacy
      background-color salmon
    &.press
      background-color #c4c4c4

</style>
