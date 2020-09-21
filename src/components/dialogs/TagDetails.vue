<template lang="pug">
dialog.tag-details(v-if="visible" :open="visible" :style="dialogPosition" ref="dialog" @click.left="closeDialogs")
  section.edit-card(v-if="!cardDetailsIsVisible")
    button(@click="showCardDetails(null)") Edit Card
  section(:style="{backgroundColor: color}")
    .row
      .button-wrap
        button.change-color(:disabled="!canEditSpace" @click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="{backgroundColor: color}")
        ColorPicker(:currentColor="color" :visible="colorPickerIsVisible" @selectedColor="updateTagColor")
      .tag-name {{name}}
  section.results-section
    ResultsFilter(:hideFilter="shouldHideResultsFilter" :items="tagCards" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredTagCards")
    ul.results-list
      template(v-for="(card in filteredItems")
        li(:data-card-id="card.id" @click="showCardDetails(card)")
          p.name.name-segments
            span.badge.space-badge(v-if="card.spaceName") {{card.spaceName}}
            template(v-for="segment in card.nameSegments")
              img(v-if="segment.isImage" :src="segment.url")
              span(v-if="segment.isText") {{segment.content}}
              //- Tags
              span.badge.tag-badge(
                v-if="segment.isTag"
                :style="{backgroundColor: segment.color}"
                :class="{ active: currentTag.name === segment.name }"
              ) {{segment.name}}
    Loader(:visible="true")
</template>

<script>
import ResultsFilter from '@/components/ResultsFilter.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import Loader from '@/components/Loader.vue'
import scrollIntoView from '@/scroll-into-view.js'
import utils from '@/utils.js'
import cache from '@/cache.js'

export default {
  name: 'TagDetails',
  components: {
    ColorPicker,
    Loader,
    ResultsFilter
  },
  data () {
    return {
      colorPickerIsVisible: false,
      filter: '',
      filteredCardTags: []
    }
  },
  computed: {
    visible () { return this.$store.state.tagDetailsIsVisible },
    currentTag () { // name, color, cardId
      const tag = this.$store.state.currentSelectedTag
      return this.$store.getters['currentSpace/tagByName'](tag.name)
    },
    position () { return this.$store.state.tagDetailsPosition },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    currentSpaceId () { return this.$store.state.currentSpace.id },
    dialogPosition () {
      return {
        left: `${this.position.x}px`,
        top: `${this.position.y}px`
      }
    },
    color () { return this.currentTag.color },
    cardDetailsIsVisible () { return this.$store.state.cardDetailsIsVisibleForCardId },
    name () { return this.currentTag.name },
    tagCards () {
      const cardsInCurrentSpace = this.tagCardsInCurrentSpace
      const cardsInCachedSpaces = cache.cardsByTagNameExcludingSpaceById(this.currentTag.name, this.currentSpaceId)
      // TODO fetch remote, and merge
      console.log('🥂', cardsInCurrentSpace, cardsInCachedSpaces)
      let cards = cardsInCurrentSpace.concat(cardsInCachedSpaces)
      cards = cards.map(card => {
        card = utils.clone(card)
        card.nameSegments = this.cardNameSegments(card.name)
        return card
      })
      return cards
    },
    filteredItems () {
      if (this.filter) {
        return this.filteredCardTags
      } else {
        return this.tagCards
      }
    },
    tagCardsInCurrentSpace () {
      const cardId = this.currentTag.cardId
      const tags = this.$store.getters['currentSpace/tagsByNameExcludingCardById']({
        name: this.currentTag.name,
        cardId
      })
      let cards = tags.map(tag => {
        let card = this.$store.getters['currentSpace/cardById'](tag.cardId)
        return card
      })
      cards = cards.filter(card => card)
      return cards
    },
    shouldHideResultsFilter () {
      if (this.tagCards.length < 5) {
        return true
      } else {
        return false
      }
    }
  },
  methods: {
    updateFilter (filter) {
      this.filter = filter
    },
    updateFilteredTagCards (cards) {
      this.filteredCardTags = cards
    },
    cardNameSegments (name) {
      let url = utils.urlFromString(name)
      let imageUrl
      if (utils.urlIsImage(url)) {
        imageUrl = url
        name = name.replace(url, '')
      }
      let segments = utils.cardNameSegments(name)
      if (imageUrl) {
        segments.unshift({
          isImage: true,
          url: imageUrl
        })
      }
      return segments.map(segment => {
        if (segment.isTag) {
          const spaceTag = this.$store.getters['currentSpace/tagByName'](segment.name)
          if (spaceTag) {
            segment.color = spaceTag.color
          } else {
            const cachedTag = cache.tagByName(segment.name)
            segment.color = cachedTag.color
          }
        }
        return segment
      })
    },
    showCardDetails (card) {
      card = card || this.$store.getters['currentSpace/cardById'](this.currentTag.cardId)
      if (this.currentSpaceId !== card.spaceId) {
        this.$store.commit('loadSpaceShowDetailsForCardId', card.id)
        const space = cache.space(card.spaceId) || { id: card.spaceId }
        this.$store.dispatch('currentSpace/changeSpace', { space })
      } else {
        const cardId = card.id || this.currentTag.cardId
        this.$store.dispatch('currentSpace/showCardDetails', cardId)
      }
    },
    toggleColorPicker () {
      this.colorPickerIsVisible = !this.colorPickerIsVisible
    },
    closeDialogs () {
      this.colorPickerIsVisible = false
    },
    updateTagColor (newColor) {
      let tag = utils.clone(this.currentTag)
      tag.color = newColor
      this.$store.dispatch('currentSpace/updateTagColor', tag)
    },
    focusName () {
      this.$nextTick(() => {
        const element = this.$refs.name
        if (!element) { return }
        element.focus()
      })
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
    },
    scrollIntoViewAndFocus () {
      const element = this.$refs.name
      const length = this.name.length
      this.scrollIntoView()
      if (utils.isMobile()) { return }
      this.$nextTick(() => {
        this.focusName()
        if (length && element) {
          element.setSelectionRange(length, length)
        }
      })
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (this.visible) {
          this.scrollIntoViewAndFocus()
        } else {
          this.closeDialogs()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
.tag-details
  section.edit-card
    background-color var(--secondary-background)
  .tag-name
    margin-left 6px
  .results-section
    border-top 1px solid var(--primary)
    padding-top 3px
  .loader
    margin-left 6px
  .name-segments
    .badge
      &:last-child
        margin 0
    img
      display inline
      max-height 30px
      border-radius 3px
      margin-right 5px
      vertical-align middle
  .space-badge
    // margin 0
    background-color var(--secondary-background)
  .tag-badge
    &.active
      box-shadow var(--button-active-inset-shadow)

  // .results-header
  //   padding-bottom 4px
//   .edit-message
//     button
//       margin-top 10px

</style>
