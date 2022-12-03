<template lang="pug">
dialog.narrow.tag-picker-style-actions(v-if="visible" :open="visible" ref="dialog" @click.left.stop="closeDialogs" :style="{'max-height': dialogHeight + 'px'}")
  section
    .row
      button(@click="toggleNewTagIsVisible" :class="{ active: newTagIsVisible }")
        img.icon(src="@/assets/add.svg")
        span New Tag
    template(v-if="newTagIsVisible")
      .row
        .button-wrap
          button.change-color(@click.stop="toggleColorPickerIsVisible")
            .current-color(:style="{ background: newTagColor }")
          ColorPicker(:currentColor="newTagColor" :visible="colorPickerIsVisible" @selectedColor="updateNewTagColor")
        input(placeholder="name" ref="newTagName" v-model="newTagName" @keyup.space.prevent @keyup.escape.stop="toggleNewTagIsVisible" @keyup.stop @keyup.enter.exact="createNewTag")
      .row
        button(@click="createNewTag")
          span Create New Tag
      .row(v-if="errorNewTagNameIsBlank")
        .badge.danger Tag name cannot be blank
  section.results-section(v-if="tags.length" ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    TagList(:tags="tags" :isLoading="loading" :shouldEmitSelectTag="true" :currentTags="currentTags" @selectTag="selectTag")
</template>

<script>
import TagList from '@/components/TagList.vue'
import cache from '@/cache.js'
import utils from '@/utils.js'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'

import randomColor from 'randomcolor'

export default {
  name: 'TagPickerStyleActions',
  components: {
    TagList,
    ColorPicker
  },
  props: {
    visible: Boolean,
    cards: Array
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
        this.updateResultsSectionHeight()
      }
    })
  },
  data () {
    return {
      resultsSectionHeight: null,
      dialogHeight: null,
      tags: [],
      loading: false,
      newTagIsVisible: false,
      colorPickerIsVisible: false,
      newTagName: '',
      newTagColor: '',
      errorNewTagNameIsBlank: false
    }
  },
  computed: {
    currentTags () { return this.$store.getters['currentSpace/tags'] || [] }
  },
  methods: {
    scrollIntoView () {
      this.$nextTick(() => {
        const element = this.$refs.dialog
        this.$store.commit('triggerScrollIntoView', { element })
      })
    },
    updateTagColor (tag) {
      this.$store.dispatch('currentSpace/updateTagNameColor', tag)
      this.tags = this.tags.map(item => {
        if (item.tagName === tag.name) {
          item.color = tag.color
        }
        return item
      })
    },
    selectTag (tag) {
      this.closeDialogs()
      const tagString = `[[${tag.name}]]`
      const cardsWithTag = this.cards.filter(card => card.name.includes(tagString))
      const shouldRemove = this.cards.length === cardsWithTag.length
      this.removeFromCards(tagString)
      if (shouldRemove) { return }
      this.addToCards(tagString)
    },
    removeFromCards (tagString) {
      this.cards.forEach(card => {
        const newName = card.name.replace(tagString, '').trim()
        if (newName === card.name) { return }
        this.$store.dispatch('currentCards/updateName', { card, newName })
      })
    },
    addToCards (tagString) {
      this.cards.forEach(card => {
        const newName = card.name + ' ' + tagString
        if (newName === card.name) { return }
        this.$store.dispatch('currentCards/updateName', { card, newName })
      })
    },
    createNewTag () {
      this.errorNewTagNameIsBlank = false
      if (!this.newTagName) {
        this.errorNewTagNameIsBlank = true
        return
      }
      let tag = this.tags.find(item => item.name === this.newTagName)
      if (tag) {
        tag.color = this.newTagColor
        this.updateTagColor(tag)
      } else {
        tag = {
          name: this.newTagName,
          color: this.newTagColor
        }
        this.$store.dispatch('currentSpace/addTag', tag)
        this.tags.unshift(tag)
      }
      this.clearState()
      this.selectTag(tag)
    },
    toggleNewTagIsVisible () {
      this.newTagIsVisible = !this.newTagIsVisible
      this.newTagColor = randomColor({ luminosity: 'light' })
      this.updateDialogHeight()
      this.updateResultsSectionHeight()
      if (this.newTagIsVisible) {
        this.$nextTick(() => {
          this.focusNewTagNameInput()
        })
      }
    },
    toggleColorPickerIsVisible () {
      this.colorPickerIsVisible = !this.colorPickerIsVisible
    },
    updateNewTagColor (color) {
      this.newTagColor = color
    },
    closeDialogs () {
      this.colorPickerIsVisible = false
    },
    clearState () {
      this.newTagIsVisible = false
      this.errorNewTagNameIsBlank = false
      this.newTagName = ''
    },
    focusNewTagNameInput () {
      const element = this.$refs.newTagName
      if (!element) { return }
      element.focus()
      element.setSelectionRange(0, 99999)
    },

    // same as Tags

    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    },
    updateResultsSectionHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeight(element, true)
      })
    },

    // same as TagPicker

    updateTags () {
      const spaceTags = this.$store.getters['currentSpace/spaceTags']
      this.tags = spaceTags || []
      const cachedTags = cache.allTags()
      const mergedTags = utils.mergeArrays({ previous: spaceTags, updated: cachedTags, key: 'name' })
      this.tags = mergedTags
      this.updateRemoteTags()
    },
    async updateRemoteTags () {
      if (!this.currentUserIsSignedIn) { return }
      const remoteTagsIsFetched = this.$store.state.remoteTagsIsFetched
      let remoteTags
      if (remoteTagsIsFetched) {
        remoteTags = this.$store.state.remoteTags
      } else {
        this.loading = true
        remoteTags = await this.$store.dispatch('api/getUserTags') || []
        this.$store.commit('remoteTags', remoteTags)
        this.$store.commit('remoteTagsIsFetched', true)
        this.loading = false
      }
      const mergedTags = utils.mergeArrays({ previous: this.tags, updated: remoteTags, key: 'name' })
      this.tags = mergedTags
      this.scrollIntoView()
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
        this.updateTags()
        this.updateResultsSectionHeight()
        this.scrollIntoView()
        this.clearState()
        this.closeDialogs()
      }
    },
    newTagName (value) {
      this.errorNewTagNameIsBlank = false
    }
  }
}
</script>

<style lang="stylus">
.tag-picker-style-actions
  min-height 200px
  .results-section
    min-height 158px
  .change-color
    margin-right 6px
</style>
