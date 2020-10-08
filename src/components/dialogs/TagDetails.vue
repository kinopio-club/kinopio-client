<template lang="pug">
dialog.tag-details(v-if="visible" :open="visible" :style="dialogPosition" ref="dialog" @click.left="closeDialogs")
  section.edit-card(v-if="!cardDetailsIsVisible")
    button(@click="showCardDetails(null)") Edit Card
  section(:style="{backgroundColor: color}")
    .row
      .button-wrap
        button.change-color(:disabled="!canEditSpace" @click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="{backgroundColor: color}")
        ColorPicker(:currentColor="color" :visible="colorPickerIsVisible" @selectedColor="updateTagNameColor")
      .tag-name {{name}}
    p(v-if="!cardsWithTag.length") Tag more cards with [[{{currentTag.name}}]] to see them here
  section.results-section(v-if="cardsWithTag.length")
    ResultsFilter(:hideFilter="shouldHideResultsFilter" :items="cardsWithTag" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredCardsWithTag")
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
    Loader(:visible="loading")
</template>

<script>
import ResultsFilter from '@/components/ResultsFilter.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import Loader from '@/components/Loader.vue'
import scrollIntoView from '@/scroll-into-view.js'
import utils from '@/utils.js'
import cache from '@/cache.js'

import uniqBy from 'lodash-es/uniqBy'

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
      filteredCardsWithTag: [],
      loading: false,
      cardsWithTag: []
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
    filteredItems () {
      if (this.filter) {
        return this.filteredCardsWithTag
      } else {
        return this.cardsWithTag
      }
    },
    cardsWithTagNameInCurrentSpace () {
      const cardId = this.$store.state.currentSelectedTag.cardId
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
      if (this.cardsWithTag.length < 5) {
        return true
      } else {
        return false
      }
    },
    currentCard () {
      return this.$store.getters['currentSpace/cardById'](this.$store.state.currentSelectedTag.cardId)
    },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
  },
  methods: {
    setCardsWithTag (cards) {
      cards = uniqBy(cards, 'id')
      cards = this.excludeCurrentCard(cards)
      cards = cards.map(card => {
        card = utils.clone(card)
        card.nameSegments = this.cardNameSegments(card.name)
        return card
      })
      this.cardsWithTag = cards
    },
    async updateRemoteCardsWithTag () {
      if (!this.currentUserIsSignedIn) { return }
      let remoteCardsWithTag
      const remoteTagNameGroup = this.$store.getters['remoteTagNameGroupByName'](this.name)
      if (remoteTagNameGroup) {
        remoteCardsWithTag = remoteTagNameGroup.cards
      } else {
        this.loading = true
        remoteCardsWithTag = await this.$store.dispatch('api/getCardsWithTag', this.name) || []
        this.loading = false
        const remoteTagGroup = {
          name: this.name,
          cards: remoteCardsWithTag
        }
        this.$store.commit('addToRemoteTagNameGroups', remoteTagGroup)
      }
      let cards = this.cardsWithTag.concat(this.remoteCardsWithTag)
      this.setCardsWithTag(cards)
    },
    updateCardsWithTag () {
      const cardsInCurrentSpace = this.cardsWithTagNameInCurrentSpace
      const cardsInCachedSpaces = cache.allCardsByTagName(this.name)
      let cards = cardsInCurrentSpace.concat(cardsInCachedSpaces)
      this.setCardsWithTag(cards)
      this.updateRemoteCardsWithTag()
    },
    excludeCurrentCard (cards) {
      cards = cards.filter(Boolean)
      return cards.filter(card => card.id !== this.currentCard.id)
    },
    updateFilter (filter) {
      this.filter = filter
    },
    updateFilteredCardsWithTag (cards) {
      this.filteredCardsWithTag = cards
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
      card = card || this.currentCard
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
    updateCardsWithTagColor (name, newColor) {
      const cards = this.cardsWithTag.map(card => {
        card.nameSegments = card.nameSegments.map(segment => {
          if (segment.isTag && segment.name === name) {
            segment.color = newColor
          }
          return segment
        })
        return card
      })
      this.cardsWithTag = cards
    },
    updateTagNameColor (newColor) {
      let tag = utils.clone(this.currentTag)
      tag.color = newColor
      this.$store.dispatch('currentSpace/updateTagNameColor', tag)
      this.updateCardsWithTagColor(tag.name, newColor)
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
      if (this.visible) {
        this.updateCardsWithTag()
      }
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
    img
      display inline
      max-height 30px
      border-radius 3px
      margin-right 5px
      vertical-align middle
  .space-badge
    background-color var(--secondary-background)
  .tag-badge
    &.active
      box-shadow var(--button-active-inset-shadow)
</style>
