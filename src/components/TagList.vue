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
      TagDetailsFromTagList(:visible="tagDetailsIsVisible" :position="tagDetailsPosition" :tag="tagDetailsTag" @removeTag="removeTag" @updatePositionY="updatePositionY")
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

const threshold = 40

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
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerSpaceDetailsCloseTagDetails') {
        this.closeDialogs()
      }
    })
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
    updatePositionY () {
      const viewportHeight = this.$store.state.viewportHeight
      let dialog = document.querySelector('dialog.tag-details')
      if (!dialog) { return }
      dialog = dialog.getBoundingClientRect()
      const distanceFromBottom = viewportHeight - dialog.y - dialog.height
      if (distanceFromBottom < threshold) {
        const y = viewportHeight - dialog.height - threshold // todo: too high on mobile?
        this.tagDetailsPosition = {
          x: this.tagDetailsPosition.x,
          y
        }
      }
    },
    updatePosition (event) {
      const rect = event.target.getBoundingClientRect()
      this.tagDetailsPosition = {
        x: rect.x + 8,
        y: rect.y - 8
      }
      this.$nextTick(() => {
        this.updatePositionY()
      })
    },
    toggleTagDetailsIsVisible (event, tag) {
      const value = !this.tagDetailsIsVisible
      this.closeDialogs()
      this.$nextTick(() => {
        this.updatePosition(event)
        this.tagDetailsTag = tag
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
      this.$store.commit('triggerSpaceDetailsCloseDialogs')
    },
    updateFilteredTags (tags) {
      this.filteredTags = tags
    },
    updateFilter (filter) {
      this.filter = filter
    },
    removeTag (tag) {
      this.closeDialogs()
      this.$emit('removeTag', tag)
    }
  },
  watch: {
    tags (tags) {
      const updatedTag = tags.find(tag => tag.name === this.tagDetailsTag.name)
      if (updatedTag) {
        this.tagDetailsTag = updatedTag
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
