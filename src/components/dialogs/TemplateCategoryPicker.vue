<template lang="pug">
dialog.narrow.template-category-picker(v-if="visible" :open="visible" @click.stop ref="dialog")
  section.results-section
    ul.results-list
      template(v-for="(category in categories")
        li(@click="select(category)" :key="category.id" tabindex="0" v-on:keyup.enter="select(category)")
          .name {{category.name}}
</template>

<script>
// import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil

// import cache from '@/cache.js'

import templates from '@/spaces/templates.js'

export default {
  name: 'TemplateCategoryPicker',
  props: {
    visible: Boolean,
    selectedCategoryId: Number
    // excludeCurrentSpace: Boolean
  },
  // data () {
  //   return {
  //     spaces: []
  //   }
  // },
  computed: {
    categories () {
      return templates.categories()
    }
  },
  methods: {
    select (category) {
      this.$emit('selectCategory', category)
      this.$emit('closeDialog')
    }
  }
}
</script>

<style lang="stylus">
.template-category-picker
  .results-section
    padding-top 4px
</style>
