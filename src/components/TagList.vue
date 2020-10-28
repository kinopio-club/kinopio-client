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
      Loader(:visible="isLoading")
  p.info(v-if="!tags") Add
    span &nbsp;
    span.badge.info [[Tags]]
    span to cards

</template>

<script>
import ResultsFilter from '@/components/ResultsFilter.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

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
      prevTagName: null,
      tagDetailsIsVisible: false,
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
      const viewport = utils.visualViewport()
      const minY = (viewport.height * viewport.scale) / 2
      const rect = event.target.getBoundingClientRect()
      let position = {
        x: rect.x + 8,
        y: rect.y - 8
      }
      if (position.y > minY) {
        position.y = minY
      }
      this.updateTagDetailsPosition(position)
    },
    updateTagDetailsPosition (position) {
      this.tagDetailsPosition = position
      this.$emit('updateTagDetailsPosition', position)
    },
    updateTagDetailsTag (tag) {
      this.tagDetailsTag = tag
      this.$emit('updateTagDetailsTag', tag)
    },
    updateTagDetailsIsVisible (value) {
      this.tagDetailsIsVisible = value
      this.$emit('updateTagDetailsIsVisible', value)
    },
    toggleTagDetailsIsVisible (event, tag) {
      const value = !this.tagDetailsIsVisible
      this.closeDialogs()
      this.$nextTick(() => {
        this.updatePosition(event)
        this.updateTagDetailsTag(tag)
        if (this.prevTagName === tag.name) {
          this.updateTagDetailsIsVisible(value)
        } else {
          this.updateTagDetailsIsVisible(true)
        }
        this.prevTagName = tag.name
      })
    },
    closeDialogs () {
      this.updateTagDetailsIsVisible(false)
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
    tags (tags) {
      const updatedTag = tags.find(tag => tag.name === this.tagDetailsTag.name)
      if (updatedTag) {
        this.updateTagDetailsTag(updatedTag)
      }
    },
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
