<template lang="pug">
dialog.narrow.template-category-picker(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section.results-section
    ul.results-list
      template(v-for="(category in categories")
        li(@click.left="select(category)" :key="category.id" tabindex="0" v-on:keyup.enter="select(category)" :class="{ active: isActive(category) }")
          .badge.info.template-badge(:class="categoryClassName(category)") {{category.name}}
</template>

<script>
import templates from '@/data/templates.js'

export default {
  name: 'TemplateCategoryPicker',
  props: {
    visible: Boolean,
    selectedCategoryId: Number
  },
  computed: {
    categories () {
      return templates.categories()
    }
  },
  methods: {
    categoryClassName (category) {
      return category.name.toLowerCase()
    },
    select (category) {
      this.$store.commit('triggerSelectTemplateCategory')
      this.$emit('selectCategory', category)
      this.$emit('closeDialog')
    },
    isActive (category) {
      return this.selectedCategoryId === category.id
    }
  }
}
</script>

<style lang="stylus">
.template-category-picker
  top calc(100% - 8px) !important
  bottom initial !important
  .results-section
    padding-top 4px
.add-space
  .template-category-picker
    &.narrow
      width 160px
</style>
