<template lang="pug">
dialog.narrow.tag-picker-style-actions(v-if="visible" :open="visible" ref="dialog" @click.stop :style="{'max-height': dialogHeight + 'px'}")
  section.results-section(v-if="tags.length" ref="results")
    TagList(:tags="tags" :isLoading="loading" :canAddTag="true" :shouldEmitSelectTag="true" :currentTags="currentTags" @selectTag="selectTag" @addTag="addTag")
</template>

<script>
import TagList from '@/components/TagList.vue'
import cache from '@/cache.js'
import utils from '@/utils.js'

import randomColor from 'randomcolor'

export default {
  name: 'TagPickerStyleActions',
  components: {
    TagList
  },
  props: {
    visible: Boolean,
    cards: Array,
    tagNamesInCard: Array
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
      loading: false
    }
  },
  computed: {
    currentTags () {
      return this.tagNamesInCard || this.$store.getters['currentSpace/tags'] || []
    },
    isThemeDark () { return this.$store.state.currentUser.theme === 'dark' }
  },
  methods: {
    newTagColor () {
      if (this.isThemeDark) {
        return randomColor({ luminosity: 'dark' })
      } else {
        return randomColor({ luminosity: 'light' })
      }
    },
    scrollIntoView () {
      this.$nextTick(() => {
        const element = this.$refs.dialog
        utils.scrollIntoView(element)
      })
    },
    selectTag (tag) {
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
      this.updateCardDimensions()
    },
    addToCards (tagString) {
      this.cards.forEach(card => {
        const newName = card.name + ' ' + tagString
        if (newName === card.name) { return }
        this.$store.dispatch('currentCards/updateName', { card, newName })
      })
      this.updateCardDimensions()
    },
    updateCardDimensions () {
      const cards = utils.clone(this.cards)
      const cardIds = cards.map(card => card.id)
      this.$store.dispatch('currentCards/removeResize', { cardIds })
    },

    addTag (name) {
      let tag = this.tags.find(item => item.name === name)
      const color = this.newTagColor()
      tag = { name, color }
      this.$store.dispatch('currentSpace/addTag', tag)
      this.tags.unshift(tag)
      this.selectTag(tag)
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
      }
    }
  }
}
</script>

<style lang="stylus">
.tag-picker-style-actions
  min-height 200px
  overflow auto
  .results-section
    min-height 158px
</style>
