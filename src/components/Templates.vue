<template lang="pug">
.templates(v-if="visible" :open="visible" @click.stop ref="dialog" @click="closeDialogs")
  //- p Preview and make them your own
  section.categories
    .button-wrap.category-wrap
      button(@click.stop="toggleTemplateCategoryPickerIsVisible" :class="{active: templateCategoryPickerIsVisible}")
        .badge.info {{filterCategory.name}}
      TemplateCategoryPicker(:visible="templateCategoryPickerIsVisible" :selectedCategoryId="filteredCategoryId" @closeDialog="closeDialogs" @selectCategory="updateFilteredCategory")
  section.results-section
    .filter-wrap
      img.icon.search(src="@/assets/search.svg" @click="focusFilterInput")
      input(placeholder="Search" v-model="spaceFilter" ref="filterInput")
      button.borderless.clear-input-wrap(@click="clearFilter")
        img.icon(src="@/assets/add.svg")

    ul.results-list
      template(v-for="(space in spacesFiltered")
        a(:href="space.spaceId")
          li(:data-full-name="space.fullName" tabindex="0")
            //- ^TODO^ v-on:keyup.enter="select(space) method
            .badge.info {{space.category}}
            span {{space.name}}
</template>

<script>
import fuzzy from 'fuzzy'

import templates from '@/spaces/templates.js'
import TemplateCategoryPicker from '@/components/dialogs/TemplateCategoryPicker.vue'

export default {
  name: 'Templates',
  components: {
    TemplateCategoryPicker
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      filter: '',
      filteredCategoryId: 0,
      filteredSpaces: [],
      templateCategoryPickerIsVisible: false
    }
  },
  computed: {
    categories () {
      return templates.categories()
    },
    spaces () {
      let spaces = templates.spaces()
      // add category meta to space
      spaces = spaces.map(space => {
        const category = this.categories.find(category => category.id === space.categoryId)
        space.category = category.name
        space.fullName = `${space.category} – ${space.name}`
        return space
      })
      // filter by categories
      if (this.filteredCategoryId === 0) {
        return spaces
      } else {
        return spaces.filter(space => space.categoryId === this.filteredCategoryId)
      }
    },
    spacesFiltered () {
      if (this.filter) {
        return this.filteredSpaces
      } else {
        return this.spaces
      }
    },
    filterCategory () {
      return this.categories.find(category => category.id === this.filteredCategoryId)
    },
    spaceFilter: {
      get () {
        return this.filter
      },
      set (newValue) {
        this.updateFilter(newValue)
      }
    }

  },
  methods: {
    clearFilter () {
      this.filter = ''
      this.filteredCategoryId = 0
    },
    focusFilterInput () {
      const element = this.$refs.filterInput
      element.focus()
      element.setSelectionRange(0, 0)
    },
    toggleTemplateCategoryPickerIsVisible () {
      this.templateCategoryPickerIsVisible = !this.templateCategoryPickerIsVisible
    },
    closeDialogs () {
      this.templateCategoryPickerIsVisible = false
    },
    updateFilter (newValue) {
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
          spaceId: space.original.spaceId,
          categoryId: space.original.categoryId,
          category: space.original.category
        }
      })
      this.filteredSpaces = spaces
    },
    updateFilteredCategory (category) {
      this.filteredCategoryId = category.id
      this.updateFilter(this.filter)
    }

  },
  watch: {
    visible (visible) {
      this.clearFilter()
      this.filter = ''
      this.templateCategoryPickerIsVisible = false
    }
  }
}
</script>

<style lang="stylus">
.templates
  .categories
    border-top 1px solid var(--primary)
  .category-wrap
    > button
      .badge
        margin 0
  a
    color var(--primary)
    text-decoration none
</style>
