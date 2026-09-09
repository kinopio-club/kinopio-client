<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import sortBy from 'lodash-es/sortBy'

const emit = defineEmits(['clearFilter'])

const props = defineProps({
  categories: Array, // [{ name, slug, color, index }, {…}]
  pages: Array, // help pages to list, already filtered by search
  showCategoryNames: Boolean // false for the nav shown inside an article
})

const route = useRoute()
const currentSlug = computed(() => route.params.page)

const pagesByCategory = (category) => {
  const pages = props.pages.filter(page => page.category === category.name)
  return sortBy(pages, ['title'])
}
const categoryByPage = (page) => {
  return props.categories.find(category => page.category === category.name)
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
nav
  template(v-for="category in props.categories")
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
