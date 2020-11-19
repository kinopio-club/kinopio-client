<template lang="pug">
.templates(v-if="visible" :open="visible" @click.left.stop @click.left="closeDialogs")
  //- p Make these your own
  section.categories
    .button-wrap.category-wrap
      button(@click.left.stop="toggleTemplateCategoryPickerIsVisible" :class="{active: templateCategoryPickerIsVisible}")
        .badge.info.template-badge(:class="categoryClassName(filterCategory)") {{filterCategory.name}}
      TemplateCategoryPicker(:visible="templateCategoryPickerIsVisible" :selectedCategoryId="filteredCategoryId" @closeDialog="closeDialogs" @selectCategory="updateFilteredCategory")
    .button-wrap(v-if="!hideSuggestTemplates")
      button(@click.left.stop="toggleContactIsVisible" :class="{active: contactIsVisible}")
        span Suggest Templates
      Contact(:visible="contactIsVisible")
  section.results-section(ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    SpaceList(:spaces="spacesFiltered" :showCategory="true" @selectSpace="changeSpace")
</template>

<script>
import templates from '@/data/templates.js'
import TemplateCategoryPicker from '@/components/dialogs/TemplateCategoryPicker.vue'
import SpaceList from '@/components/SpaceList.vue'
import Contact from '@/components/dialogs/Contact.vue'
import utils from '@/utils.js'

export default {
  name: 'Templates',
  components: {
    TemplateCategoryPicker,
    SpaceList,
    Contact
  },
  props: {
    visible: Boolean,
    hideSuggestTemplates: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateResultsSectionHeight()
      }
    })
  },
  data () {
    return {
      filteredCategoryId: 0,
      filteredSpaces: [],
      templateCategoryPickerIsVisible: false,
      contactIsVisible: false,
      resultsSectionHeight: null
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
    }
  },
  methods: {
    categoryClassName (filterCategory) {
      return filterCategory.name.toLowerCase()
    },
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
    },
    closeDialogs () {
      this.templateCategoryPickerIsVisible = false
      this.contactIsVisible = false
    },
    updateFilteredCategory (category) {
      this.filteredCategoryId = category.id
    },
    toggleTemplateCategoryPickerIsVisible () {
      const isVisible = this.templateCategoryPickerIsVisible
      this.closeDialogs()
      this.templateCategoryPickerIsVisible = !isVisible
    },
    toggleContactIsVisible () {
      const isVisible = this.contactIsVisible
      this.closeDialogs()
      this.contactIsVisible = !isVisible
    },
    updateResultsSectionHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeightFromHeader(element, true)
      })
    }
  },
  watch: {
    visible (visible) {
      this.templateCategoryPickerIsVisible = false
      this.contactIsVisible = false
      if (visible) {
        this.updateResultsSectionHeight()
      }
    },
    loading (loading) {
      this.updateResultsSectionHeight()
    }
  }
}
</script>

<style lang="stylus">
.templates
  .categories
    border-top 1px solid var(--primary)
    border-top-left-radius 0
    border-top-right-radius 0
  .category-wrap
    > button
      .badge
        margin 0
  .contact
    top calc(100% - 8px)
    bottom initial
  // template category colors
  .template-badge
    &.learning
      background-color #f0e68c
    &.life
      background-color #b9a8ff
    &.planning
      background-color #ffc0cb
    &.product
      background-color #ee83ee
</style>
