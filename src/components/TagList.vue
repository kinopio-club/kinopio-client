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
          :class="{ active: tagDetailsTag.name === tag.name }"
        )
          .badge(:style="{backgroundColor: tag.color, 'pointerEvents': 'none'}")
            span {{tag.name}}
      TagDetailsFromTagList(:visible="tagDetailsIsVisible" :position="tagDetailsPosition" :tag="tagDetailsTag")
      Loader(:visible="isLoading")
  p.info(v-if="!tags") Add
    span &nbsp;
    span.badge.info [[Tags]]
    span to cards

</template>

<script>
import ResultsFilter from '@/components/ResultsFilter.vue'
import Loader from '@/components/Loader.vue'
import TagDetailsFromTagList from '@/components/dialogs/TagDetailsFromTagList.vue'

export default {
  name: 'TagList',
  components: {
    ResultsFilter,
    Loader,
    TagDetailsFromTagList
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
      prevTagName: null,
      tagDetailsPosition: {},
      tagDetailsTag: {}
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
      const rect = event.target.getBoundingClientRect()
      console.log('🟣', event.target, rect)
      this.tagDetailsPosition = {
        x: rect.x + 8,
        y: rect.y - 8
      }
    },
    toggleTagDetailsIsVisible (event, tag) {
      const value = !this.tagDetailsIsVisible
      this.closeDialogs()
      this.$nextTick(() => {
        this.updatePosition(event)
        this.tagDetailsTag = tag
        console.log('🍄tag', this.tagDetailsTag.name)
        if (this.prevTagName === tag.name) {
          this.tagDetailsIsVisible = value
        } else {
          this.tagDetailsIsVisible = true
        }
        this.prevTagName = tag.name
      })
    },
    closeDialogs () {
      this.tagDetailsIsVisible = false
      this.$emit('closeDialogs')
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
