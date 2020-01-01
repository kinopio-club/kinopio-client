<template lang="pug">
dialog.narrow.template-category-picker(v-if="visible" :open="visible" @click.stop ref="dialog")
  section.results-section
    ul.results-list
      template(v-for="(category in categories")
        li(@click="select(category)" :key="category.id" v-on:keyup.enter="select(category)" :class="{ active: isActive(category) }")
          .badge.info {{category.name}}
</template>

<script>
import templates from '@/spaces/templates.js'

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
    select (category) {
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
  .results-section
    padding-top 4px
</style>
