<template lang="pug">
span.tag-list(@click.left="closeDialogs")
  template(v-if="tags")
    ResultsFilter(:items="tags" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredTags")
    ul.results-list
      template(v-for="(tag in tagsFiltered")
        li(
          :key="tag.id"
          tabindex="0"
          @click.left.stop="toggleTagDetailsIsVisible($event, tag)"
          @touchend.stop="toggleTagDetailsIsVisible($event, tag)"
          v-on:keyup.enter="toggleTagDetailsIsVisible($event, tag)"
          :class="{ active: currentSelectedTag.name === tag.name }"
        )
          .badge(:style="{backgroundColor: tag.color, 'pointerEvents': 'none'}")
            span {{tag.name}}
      Loader(:visible="isLoading")
      TagDetails(:visibleFromProp="tagDetailsIsVisible")
  p.info(v-if="!tags") Add
    span &nbsp;
    span.badge.info [[Tags]]
    span to cards

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
      tagDetailsIsVisible: false,
      prevTagName: null
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
    updatePosition (event) {
      console.log('🍆', event, event.target)
      // const tagRect = event.target.getBoundingClientRect()
      this.$store.commit('tagDetailsPosition', {
        // x: window.scrollX + tagRect.x + 2,
        // y: window.scrollY + tagRect.y + tagRect.height - 2
        x: 0,
        y: 0
      })
    },
    toggleTagDetailsIsVisible (event, tag) {
      const value = !this.tagDetailsIsVisible
      this.closeDialogs()
      this.updatePosition(event)
      if (this.prevTagName === tag.name) {
        console.log('🦚tagDetailsIsVisible', this.tagDetailsIsVisible, value)

        this.tagDetailsIsVisible = value
      } else {
        this.tagDetailsIsVisible = true
      }

      this.$store.commit('currentSelectedTag', tag)

      // if (!this.tagDetailsIsVisible) {
      //   this.closeDialogs()
      // }
      this.prevTagName = tag.name
    },
    closeDialogs () {
      this.tagDetailsIsVisible = false
      // this.$store.commit('currentSelectedTag', {})
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
.tag-list
  .info
    margin 6px
</style>
