<template lang="pug">
span(@click.left="closeDialogs")
  ResultsFilter(:items="tags" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredTags")
  ul.results-list.tag-list
    template(v-for="(tag in tagsFiltered")
      li(
        :key="tag.id"
        tabindex="0"
        @click.left.stop="toggleTagDetailsIsVisible(tag)"
        @touchend.stop="toggleTagDetailsIsVisible(tag)"
        v-on:keyup.enter="toggleTagDetailsIsVisible(tag)"
      )
        .badge(:style="{backgroundColor: tag.color}" :class="{ active: currentSelectedTag.name === tag.name }")
          span {{tag.name}}
      //- TagDetails(:visible="tagDetailsIsVisible" :tag="tag")

    Loader(:visible="isLoading")

</template>

<script>
import ResultsFilter from '@/components/ResultsFilter.vue'
import Loader from '@/components/Loader.vue'
import TagDetails from '@/components/dialogs/TagDetails.vue'

export default {
  name: 'TagList',
  components: {
    ResultsFilter,
    Loader,
    TagDetails
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
    toggleTagDetailsIsVisible (tag) {
      console.log('🌱', tag)
      this.tagDetailsIsVisible = !this.tagDetailsIsVisible
      // this.hideTagDetailsIsVisible()
      // const tagRect = event.target.getBoundingClientRect()
      // this.$store.commit('tagDetailsPosition', {
      //   x: window.scrollX + tagRect.x + 2,
      //   y: window.scrollY + tagRect.y + tagRect.height - 2
      // })
      this.$store.commit('currentSelectedTag', tag)
      // this.$store.commit('tagDetailsIsVisible', true)
    },
    closeDialogs () {
      this.tagDetailsIsVisible = false
      this.$store.commit('currentSelectedTag', {})
      // this.$store.commit('tagDetailsIsVisible', false)
    },
    updateFilteredTags (tags) {
      this.filteredTags = tags
    },
    updateFilter (filter) {
      this.filter = filter
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.closeDialogs()
      }
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
