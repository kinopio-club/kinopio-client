<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import helpPages from 'virtual:help-pages' // pages [{ slug, title, description, category }, {…}] from vite build
import utils from '@/utils.js'

import sortBy from 'lodash-es/sortBy'

const emit = defineEmits(['clearFilter'])

const props = defineProps({
  pages: Array, // help pages to list, already filtered by search. defaults to every page
  categorySlugs: Array, // limit the nav to these categories, eg ['basics', 'advanced']
  showCategoryNames: Boolean,
  currentCategoryOnly: Boolean // for the nav shown inside an article
})

// color and order for each category, keyed by the normalized `category` in page frontmatter.
// renaming a category in the markdown means renaming its key here too
const categoryDetails = {
  basics: {
    index: 0,
    color: 'khaki'
  },
  advanced: {
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
  // css category colors
  Object.keys(categoryDetails).forEach(key => utils.setCssVariable(key, categoryDetails[key].color))
})

const normalizeNewCategory = (name) => {
  const slug = utils.normalizeString(name)
  const color = categoryDetails[slug].color
  const index = categoryDetails[slug].index
  return { name, slug, color, index }
}
let categories = helpPages.reduce((list, page) => {
  const category = list.find(item => item.name === page.category)
  if (!category) {
    list.push(normalizeNewCategory(page.category))
  }
  return list
}, [])
categories = sortBy(categories, ['index'])

const route = useRoute()
const currentSlug = computed(() => route.params.page)
const currentPage = computed(() => helpPages.find(page => page.slug === currentSlug.value))
const currentCategory = computed(() => categories.find(category => category.name === currentPage.value?.category))
const visibleCategories = computed(() => {
  if (props.currentCategoryOnly) {
    return [currentCategory.value].filter(category => category)
  }
  if (props.categorySlugs) {
    return categories.filter(category => props.categorySlugs.includes(category.slug))
  }
  return categories
})

const navPages = computed(() => props.pages || helpPages)
const pagesByCategory = (category) => {
  const pages = navPages.value.filter(page => page.category === category.name)
  return sortBy(pages, ['title'])
}
const categoryByPage = (page) => {
  return categories.find(category => page.category === category.name)
}
// categories are built from pages, so an empty category means the search filtered it out
const categoryIsVisible = (category) => {
  return Boolean(pagesByCategory(category).length)
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
const clearFilter = () => {
  emit('clearFilter')
}
</script>

<template lang="pug">
nav.help-nav
  template(v-for="category in visibleCategories")
    section.category(v-if="categoryIsVisible(category)" :key="category.name")
      //- category name
      p.category-name(v-if="props.showCategoryNames")
        span.badge.category-circle(:class="category.slug")
        span {{category.name}}
      //- pages
      ul
        li(v-for="page in pagesByCategory(category)" :key="page.slug" @click.stop="clearFilter")
          router-link(:to="`/help/${page.slug}`")
            .badge.button-badge(:class="badgeClasses(page)")
              span {{ page.title }}
</template>

<style lang="stylus">
nav.help-nav
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

  .category-name
    display flex
    align-items center
    margin-right 0
    margin-bottom 10px

  .category-circle
    width 10px
    height 10px
    min-width initial
    min-height initial
    border-radius 100px
    display inline-block

  // category colors are set as css variables by Help.vue, from categoryDetails
  .badge
    color var(--primary-on-light-background)
    &.basics
      background-color var(--basics)
    &.navigating
      background-color var(--navigating)
    &.advanced
      background-color  var(--advanced)
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
