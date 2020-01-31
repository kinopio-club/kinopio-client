<template lang="pug">
.community-spaces(v-if="visible" :open="visible" @click.stop ref="dialog")
  section
    Loader(:visible="loading")

    p hi
  //- section.results-section
  //-   .filter-wrap
  //-     img.icon.search(src="@/assets/search.svg" @click="focusFilterInput")
  //-     input(placeholder="Search" v-model="spaceFilter" ref="filterInput")
  //-     button.borderless.clear-input-wrap(@click="clearFilter")
  //-       img.icon(src="@/assets/add.svg")

  //-   ul.results-list
  //-     template(v-for="(space in spacesFiltered")
  //-       a(:href="space.spaceId")
  //-         li(:data-full-name="space.fullName" tabindex="0")
  //-           //- ^TODO^ v-on:keyup.enter="select(space) method
  //-           .badge.info {{space.category}}
  //-           span {{space.name}}
</template>

<script>
import Loader from '@/components/Loader.vue'

export default {
  name: 'CommunitySpaces',
  components: {
    Loader
  },
  props: {
    visible: Boolean,
    loading: Boolean,
    spaces: Array
  }
  // data () {
  //   return {
  //     spaces: [],
  //   }
  // },

  // watch: {
  // visible (visible) {
  //   this.clearFilter()
  //   this.filter = ''
  //   this.templateCategoryPickerIsVisible = false
  // }
  // }
}
</script>

<style lang="stylus">
.community-spaces
  section
    border-top 1px solid var(--primary)
    border-top-left-radius 0 !important
    border-top-right-radius 0 !important
</style>
