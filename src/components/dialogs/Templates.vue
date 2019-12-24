<template lang="pug">
dialog.templates(v-if="visible" :open="visible" @click.stop ref="dialog")
  section
    p Templates
    //- need to make clear somehow that clicking on the space just previews it?? move to be more in context?
    p Preview and make them your own
    button
      .badge.info All
      span Categories
  section.results-section

    .filter-wrap
      img.icon.search(src="@/assets/search.svg")
      input(placeholder="Search")

    ul.results-list
      //- populate from json with item={category, name, id}
      li(data-full-name="Learning - Hello")
        .badge.info Learning
        span Note Taking
      li(data-full-name="Life - ToDo Today")
        .badge.info Life
        span ToDo Today
</template>

<script>
export default {
  name: 'Templates',
  props: {
    visible: Boolean
  },
  //   this.$emit('updateSpaces')
  // this.$emit('closeDialog')
  data () {
    return {
      filter: ''
    }
  },
  computed: {
  },
  methods: {
    // emitted when cateogryPicker changes???
    clearFilter () {
      this.filter = ''
    }
  },
  watch: {
    visible (visible) {
      this.clearFilter()
      // this.filter = ''
    }
  }
}
</script>

<style lang="stylus">
.templates
  max-height calc(100vh - 140px)
  overflow scroll
  // .title-section
  //   border-bottom 1px solid var(--primary)
  //   margin-bottom 5px
</style>
