<template lang="pug">
dialog.templates(v-if="visible" :open="visible" @click.stop ref="dialog" @click="closeDialogs")
  section
    p Templates
    p Preview and make them your own
    .button-wrap.category-wrap
      button(@click.stop="toggleTemplateCategoryPickerIsVisible" :class="{active: templateCategoryPickerIsVisible}")
        .badge.info {{filterCategory.name}}
      TemplateCategoryPicker(:visible="templateCategoryPickerIsVisible" :selectedCategoryId="filterCategoryId" @closeDialog="closeDialogs" @selectCategory="updateFilteredCategory")
  section.results-section
    .filter-wrap
      img.icon.search(src="@/assets/search.svg" @click="focusFilterInput")
      input(placeholder="Search" v-model="spaceFilter" ref="filterInput")

    ul.results-list
      template(v-for="(space in spacesFiltered")
        a(:href="space.id")
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
      filterCategoryId: 0,
      filteredSpaces: [],
      templateCategoryPickerIsVisible: false
    }
  },
  filters: {
  },
  computed: {
    categories () {
      return templates.categories()
    },
    spaces () {
      let spaces = templates.spaces()
      spaces = spaces.map(space => {
        const category = this.categories.find(category => category.id === space.categoryId)
        space.category = category.name
        space.fullName = `${space.category} – ${space.name}`
        return space
      })
      // filter spacesInSelectedCategory here
      return spaces
    },
    // spacesInSelectedCategory - stacks BEFORE spacesFiltered
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
    },
    toggleTemplateCategoryPickerIsVisible () {
      this.templateCategoryPickerIsVisible = !this.templateCategoryPickerIsVisible
    },
    closeDialogs () {
      this.templateCategoryPickerIsVisible = false
    },
    updateFilteredCategory (category) {
      this.filterCategoryId = category.id
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
  // overflow scroll
  .category-wrap
    > button
      .badge
        margin 0
  a
    color var(--primary)
    text-decoration none
</style>
