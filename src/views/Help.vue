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

import sortBy from 'lodash-es/sortBy'
import { colord, extend } from 'colord'
import namesPlugin from 'colord/plugins/names'
extend([namesPlugin])

const globalStore = useGlobalStore()
const themeStore = useThemeStore()
const route = useRoute()

const categoryDetails = {
  basics: {
    index: 0,
    color: 'khaki'
  },
  'advanced-use': {
    index: 1,
    color: '#b9a8ff'
  },
  navigating: {
    index: 2,
    color: 'pink'
  },
  collaboration: {
    index: 3,
    color: 'violet'
  },
  'importing-and-exporting': {
    index: 4,
    color: 'lightskyblue'
  },
  community: {
    index: 5,
    color: 'burlywood'
  },
  'user-settings': {
    index: 6,
    color: '#deb1ff'
  },
  policies: {
    index: 7,
    color: 'salmon'
  },
  'about-kinopio': {
    index: 8,
    color: 'mediumaquamarine'
  },
  press: {
    index: 9,
    color: '#c4c4c4'
  },
  troubleshooting: {
    index: 10,
    color: '#a4dfdc'
  }
}
onMounted(() => {
  if (!consts.isStaticPrerenderingPage) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateSystemTheme)
    themeStore.restoreTheme()
  }
  // css category colors
  Object.keys(categoryDetails).forEach(key => utils.setCssVariable(key, categoryDetails[key].color))
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
  const color = categoryDetails[slug].color
  const index = categoryDetails[slug].index
  return { name, slug, color, index }
}
let categories = helpPages.reduce((list, page) => {
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
categories = sortBy(categories, ['index'])

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

const imageType = (url) => {
  const extension = url.split('.').pop().toLowerCase()
  if (extension === 'webp') { return 'image/webp' }
  if (extension === 'jpg' || extension === 'jpeg') { return 'image/jpeg' }
  if (extension === 'gif') { return 'image/gif' }
  return 'image/png'
}

useHead(() => {
  let title = 'Kinopio Help'
  let description = 'Guides and documentation for using Kinopio'
  let path = '/help'
  let image = 'https://files.kinopio.club/og-image.png'
  if (pageMeta.value) {
    title = `${pageMeta.value.title} – Kinopio Help`
    description = pageMeta.value.description
    path = `/help/${pageMeta.value.slug}`
    image = pageMeta.value.image || image
  }
  if (consts.isDevelopment()) {
    title = `[DEV] ${title}`
  }
  const url = `https://kinopio.club${path}`
  const video = pageMeta.value?.video
  const videoMeta = []
  if (video) {
    videoMeta.push(
      { property: 'og:video', content: video },
      { property: 'og:video:secure_url', content: video },
      { property: 'og:video:type', content: 'video/mp4' }
    )
  }
  // override site defaults in index.html
  return {
    title,
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      // scrapers only activate the player when og:type is a video type
      { property: 'og:type', content: video ? 'video.other' : (pageMeta.value ? 'article' : 'website') },
      { property: 'og:image', content: image },
      { property: 'og:image:type', content: imageType(image) },
      { name: 'twitter:image', content: image },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      ...videoMeta
    ],
    link: [{ rel: 'canonical', href: url }]
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
  return classes
}

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
  let pages = pagesFiltered.value.filter(page => page.category === category.name)
  pages = sortBy(pages, ['title'])
  return pages
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
const updateFilterOnSearchFocus = (event) => {
  const value = event.target.value
  if (value) {
    updateFilter(value)
  }
}

</script>

<template lang="pug">
.page(:class="{ 'is-dark-theme': isThemeDark }")
  Header(:isDocumentPage="true")
  main.page.help-page-wrap(@click="closeAllDialogs")
    .page-wrap
      section.intro
        Wordmark(h2="HELP TOPICS" :isH1="currentSlugIsRoot")

      section.search
        ResultsFilter(
          :items="searchPages"
          :searchByAliases="true"
          @updateFilter="updateFilter"
          @updateFilteredItems="updateFilteredPages"
          @clearFilter="clearFilter"
          placeholder="Search Help"
          :shouldNotAutofocus="true"
          @onFocus="updateFilterOnSearchFocus"
        )

      template(v-if="currentSlugIsRoot && !state.filter")
        section
            p Kinopio is a spatial canvas to collect and connect your thoughts, ideas, and plans – by yourself or collaboratively.
        AboutHowTo

      section
        nav#nav(v-if="currentSlugIsRoot || state.filter")
          template(v-for="category in categories")
            section.category(v-if="categoryIsVisible(category)" :key="category.name")
              //- category name
              p.category-name
                span.badge.category-circle(:class="category.slug")
                span {{category.name}}
              //- pages
              ul
                li(v-for="page in pagesFilteredByCategory(category)" :key="page.slug" @click.stop="clearFilter")
                  router-link(:to="`/help/${page.slug}`")
                    .badge.button-badge(:class="badgeClasses(page)")
                      span {{ page.title }}
        //- post
        article
          p(v-if="pageContent")
            a.category-name(href="/help/#nav")
              .badge.secondary.button-badge
                  img.icon.left-arrow(src="@/assets/down-arrow.svg")
                  span All Topics
            nav
              ul
                li(v-for="page in pagesFilteredByCategory(currentCategory)" :key="page.slug" @click.stop="clearFilter")
                  router-link(:to="`/help/${page.slug}`")
                    .badge.button-badge(:class="badgeClasses(page)")
                      span {{ page.title }}
            //- post md
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
  min-height 100dvh
  // .page-wrap
  //   max-width 900px
  h1 + a
    display block
    width fit-content
    text-decoration none

  section.intro
    margin-bottom 1rem
    h2
      margin-bottom 0

  section.search
    margin-bottom 0
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
    // h2
    //   display none

  article
    .markdown-body
      margin-top 1rem
      line-height 1.4
      h1
        margin-top 0
        font-size 22px
      h2
        font-size 18px
      h3
        font-size 16px
      p
        max-width 520px
      img:not(.icon),
      video
        border-radius var(--page-entity-radius)
        // max-width 715px
        margin-top 1rem
        margin-bottom 1rem
        &.large
          max-width 100%
        &.medium
          max-width 70%
        &.small
          max-width 300px
        &.no-border
          border-radius 0
      code
        background-color var(--secondary-background)
        vertical-align 0
        margin 0
      ul,
      ol
        max-width 500px
        padding-left 15px
      li
        line-height 1.4
        p
          margin-bottom 0.5rem
      li + li
        margin-top 0.5rem
      blockquote
        margin-left 0
        border-left 1px solid var(--primary-border)
        padding-left 8px

    a.category-name
      text-decoration none

  .badge
    color var(--primary-on-light-background)
    &.basics
      background-color var(--basics)
    &.navigating
      background-color var(--navigating)
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
