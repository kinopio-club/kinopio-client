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
      img.icon.search(src="@/assets/search.svg")
      input(placeholder="Search")

    ul.results-list
      template(v-for="(space in spaces")
        a(:href="space.id")
          li
            .badge.info {{space.category}}
            span {{space.name}}
</template>

<script>
import templates from '@/spaces/templates.js'

export default {
  name: 'Templates',
  props: {
    visible: Boolean
  },
  data () {
    return {
      filter: '',
      filterCategoryId: 0
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
        return space
      })
    },
    filterCategory () {
      return this.categories.find(category => category.id === this.filterCategoryId)
    }
  },
  methods: {
    // emitted when cateogryPicker changes???
    clearFilter () {
      this.filter = ''
      this.filterCategoryId = 0
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
