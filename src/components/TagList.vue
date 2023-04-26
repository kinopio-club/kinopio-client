<template lang="pug">
span.tag-list(@click.left="closeDialogs")
  template(v-if="tags")
    ResultsFilter(
      :items="tags"
      :parentIsPinned="parentIsPinned"
      @updateFilter="updateFilter"
      @updateFilteredItems="updateFilteredTags"
      @focusNextItem="focusNextItem"
      @focusPreviousItem="focusPreviousItem"
      @selectItem="selectItem"
      :isLoading="isLoading"
    )
    .row(v-if="addTagIsVisible")
      button.small-button(tabindex="0" @click.stop="addTag" @touchend.stop="addTag" @keyup.enter="addTag")
        img.icon(src="@/assets/add.svg")
        span New Tag

    ul.results-list
      template(v-for="tag in tagsFiltered" :key="tag.id")
        li(
          :data-tag-id="tag.id"
          tabindex="0"
          @click.left.stop="selectTag($event, tag)"
          @touchend.stop="selectTag($event, tag)"
          v-on:keyup.enter="selectTag($event, tag)"
          :class="{ active: tagIsActive(tag), hover: tagIsFocused(tag) }"
        )
          Tag(:tag="tag")
  p.info(v-if="!tags")
    span Type
    span {{' '}}
    span.badge.secondary [[
      span when editing a card to create tags
</template>

<script>
import ResultsFilter from '@/components/ResultsFilter.vue'
import Tag from '@/components/Tag.vue'

export default {
  name: 'TagList',
  components: {
    ResultsFilter,
    Tag
  },
  props: {
    tags: Array,
    isLoading: Boolean,
    parentIsPinned: Boolean,
    shouldEmitSelectTag: Boolean,
    currentTags: Array,
    positionTagsOnLeftSide: Boolean,
    canAddTag: Boolean
  },
  data () {
    return {
      filter: '',
      filteredTags: [],
      prevTagName: null,
      tagDetailsTag: {},
      focusOnId: ''
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
    },
    firstResultName () {
      if (!this.tagsFiltered.length) { return }
      return this.tagsFiltered[0].name
    },
    addTagIsVisible () {
      if (!this.canAddTag) { return }
      if (this.filter === this.firstResultName) { return }
      return Boolean(this.filter)
    }
  },
  methods: {
    addTag () {
      this.$emit('addTag', this.filter)
      this.updateFilter('')
    },
    tagIsActive (tag) {
      const isTagDetails = this.tagDetailsTag.name === tag.name
      let isCurrentTag
      if (this.currentTags) {
        isCurrentTag = this.currentTags.includes(tag.name)
      }
      return isTagDetails || isCurrentTag
    },
    tagIsFocused (tag) {
      return this.focusOnId === tag.id
    },
    updatePosition (event, tag) {
      let rect
      if (event) {
        rect = event.target.getBoundingClientRect()
      } else {
        const element = document.querySelector(`li[data-tag-id="${tag.id}"]`)
        rect = element.getBoundingClientRect()
      }
      let position = {
        x: rect.x + (rect.width / 2) + window.scrollX,
        y: rect.y + 8 + window.scrollY,
        pageX: window.scrollX,
        pageY: window.scrollY
      }
      if (this.positionTagsOnLeftSide) {
        const tagDetailsWidth = 250
        position.x = rect.x + window.scrollX - tagDetailsWidth
      }
      this.$store.commit('tagDetailsPosition', position)
      this.$store.commit('tagDetailsPositionShouldUpdate', true)
    },
    updateTagDetailsTag (tag) {
      this.tagDetailsTag = tag
      this.$store.commit('currentSelectedTag', tag)
    },
    updateTagDetailsIsVisible (value) {
      this.$store.commit('tagDetailsIsVisible', value)
      this.$store.commit('tagDetailsIsVisibleFromTagList', value)
    },
    selectTag (event, tag) {
      if (this.shouldEmitSelectTag) {
        this.$emit('selectTag', tag)
        return
      }
      this.closeDialogs()
      this.$nextTick(() => {
        this.updatePosition(event, tag)
        this.updateTagDetailsTag(tag)
        if (this.prevTagName === tag.name) {
          const value = !this.$store.state.tagDetailsIsVisible
          this.updateTagDetailsIsVisible(value)
        } else {
          this.updateTagDetailsIsVisible(true)
        }
        this.prevTagName = tag.name
      })
    },
    closeDialogs () {
      this.$emit('closeDialogs')
    },
    updateFilteredTags (tags) {
      this.filteredTags = tags
    },
    updateFilter (filter) {
      this.filter = filter
      this.$nextTick(() => {
        const tags = this.tagsFiltered || this.tags
        if (!tags.length) { return }
        this.focusOnId = tags[0].id
      })
    },
    focusNextItem () {
      const tags = this.tagsFiltered
      let currentIndex = tags.findIndex(tags => tags.id === this.focusOnId)
      let index = currentIndex + 1
      if (tags.length === index) {
        index = 0
      }
      this.focusItem(tags[index])
    },
    focusPreviousItem () {
      const tags = this.tagsFiltered
      let currentIndex = tags.findIndex(tags => tags.id === this.focusOnId)
      let index = currentIndex - 1
      if (index < 0) {
        index = 0
      }
      this.focusItem(tags[index])
    },
    selectItem () {
      const tags = this.tagsFiltered
      const index = tags.findIndex(tags => tags.id === this.focusOnId)
      this.selectTag(null, tags[index])
    },
    focusItem (tag) {
      this.focusOnId = tag.id
    }
  },
  watch: {
    tags: {
      handler (tags) {
        const updatedTag = tags.find(tag => tag.name === this.tagDetailsTag.name)
        if (updatedTag) {
          this.updateTagDetailsTag(updatedTag)
        }
      },
      deep: true
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
  .badge
    pointer-events none
</style>
