<template lang="pug">
dialog.templates(v-if="visible" :open="visible" @click.stop ref="dialog")
  section
    p Templates
    p Preview and make them your own
    .button-wrap.category-wrap
      button
        .badge.info {{filterCategory.name}}
  section.results-section
    .filter-wrap
      img.icon.search(src="@/assets/search.svg" @click="focusFilterInput")
      input(placeholder="Search" v-model="spaceFilter" ref="filterInput")

    ul.results-list
      template(v-for="(space in spacesFiltered")
        a(:href="space.id")
          li(:data-full-name="space.fullName")
            .badge.info {{space.category}}
            span {{space.name}}
</template>

<script>
import fuzzy from 'fuzzy'

import templates from '@/spaces/templates.js'

export default {
  name: 'Templates',
  props: {
    visible: Boolean
  },
  data () {
    return {
      filter: '',
      filterCategoryId: 0,
      filteredSpaces: []
    }
  },
  filters: {
  },
  computed: {
    categories () {
      return templates.categories()
    },
    spaces () {
      const spaces = templates.spaces()
      return spaces.map(space => {
        const category = this.categories.find(category => category.id === space.categoryId)
        space.category = category.name
        space.fullName = `${space.category} – ${space.name}`
        return space
      })
    },
    spacesFiltered () {
      if (this.filteredSpaces.length) {
        return this.filteredSpaces
      } else {
        return this.spaces
      }
    },
    filterCategory () {
      return this.categories.find(category => category.id === this.filterCategoryId)
    },
    spaceFilter: {
      get () {
        return this.filter
      },
      set (newValue) {
        this.filter = newValue
        const options = {
          pre: '',
          post: '',
          extract: (space) => {
            return space.fullName
          }
        }
        const filtered = fuzzy.filter(this.filter, this.spaces, options)
        const spaces = filtered.map(space => {
          return {
            name: space.original.name,
            id: space.original.id,
            categoryId: space.original.categoryId,
            category: space.original.category
          }
        })
        this.filteredSpaces = spaces
      }
    }

  },
  methods: {
    // emitted when cateogryPicker changes???
    clearFilter () {
      this.filter = ''
      this.filterCategoryId = 0
    },
    focusFilterInput () {
      const element = this.$refs.filterInput
      element.focus()
      element.setSelectionRange(0, 0)
    }
  },
  watch: {
    visible (visible) {
      this.clearFilter()
    }
  }
}
</script>

<style lang="stylus">
.templates
  max-height calc(100vh - 140px)
  overflow scroll
  .category-wrap
    > button
      .badge
        margin 0
  a
    color var(--primary)
    text-decoration none
</style>
