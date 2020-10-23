<template lang="pug">
span(@click.left="hideTagDetailsIsVisible")
  ResultsFilter(:hideFilter="hideFilter" :items="tags" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredTags")
  ul.results-list.tag-list
    template(v-for="(tag in tagsFiltered")
      li(
        :key="tag.id"
        tabindex="0"
        @click.left.stop="showTagDetailsIsVisible($event, tag)"
        @touchend.stop="showTagDetailsIsVisible($event, tag)"
        v-on:keyup.enter="showTagDetailsIsVisible($event, tag)"
      )
        .badge(:style="{backgroundColor: tag.color}" :class="{ active: currentSelectedTag.name === tag.name }")
          span {{tag.name}}
      //- TagPicker(:visible="tagDetailsIsVisible" :cursorPosition="cursorPosition" :position="tagPickerPosition" :search="tagPickerSearch" @closeDialog="hideTagPicker" @selectTag="updateTagBracketsWithTag")
    Loader(:visible="isLoading")

</template>

<script>
import ResultsFilter from '@/components/ResultsFilter.vue'
import Loader from '@/components/Loader.vue'

export default {
  name: 'TagList',
  components: {
    ResultsFilter,
    Loader
  },
  props: {
    tags: Array,
    isLoading: Boolean
  },
  data () {
    return {
      filter: '',
      filteredTags: [],
      tagDetailsIsVisible: false
    }
  },
  computed: {
    currentSelectedTag () { return this.$store.state.currentSelectedTag },
    tagsFiltered () {
      if (this.filter) {
        return this.filteredTags
      } else {
        return this.tags
      }
    }
  },
  methods: {
    showTagDetailsIsVisible (event, tag) {
      console.log('🌱', event, tag)
      this.hideTagDetailsIsVisible()
      const tagRect = event.target.getBoundingClientRect()
      this.$store.commit('tagDetailsPosition', {
        x: window.scrollX + tagRect.x + 2,
        y: window.scrollY + tagRect.y + tagRect.height - 2
      })
      this.$store.commit('currentSelectedTag', tag)
      this.$store.commit('tagDetailsIsVisible', true)
    },
    hideTagDetailsIsVisible () {
      this.$store.commit('currentSelectedTag', {})
      this.$store.commit('tagDetailsIsVisible', false)
    },
    updateFilteredTags (tags) {
      this.filteredTags = tags
    },
    updateFilter (filter) {
      this.filter = filter
    }
  }
}
</script>

<style lang="stylus">
// .tag-list
  // .badge
  //   margin-left 0

  // .badge.status
  //   display inline-flex
  //   margin 0
  //   margin-left 6px
  //   min-height auto
  //   height 14px
  //   img
  //     margin 0

  // .name
  //   margin 0
  //   white-tag wrap
  //   overflow hidden
  //   .icon
  //     margin-left 6px

  // .loader
  //   margin-left 6px
</style>
