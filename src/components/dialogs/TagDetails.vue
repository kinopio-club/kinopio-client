<template lang="pug">
dialog.tag-details(v-if="isVisible" :open="isVisible" :style="dialogPosition" ref="dialog" @click.left.stop="closeDialogs")
  section.edit-card(v-if="showEditCard")
    button(@click="showCardDetails(null)") Edit Card
  section(:style="{backgroundColor: color}")
    .row
      .button-wrap
        button.change-color(:disabled="!canEditSpace" @click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="{backgroundColor: color}")
        ColorPicker(:currentColor="color" :visible="colorPickerIsVisible" @selectedColor="updateTagNameColor")
      .tag-name {{name}}
    template(v-if="!cards.length && !loading")
      p Tag more cards with [[{{currentTag.name}}]] to see them here
      button(v-if="hasProps" @click.left.stop="removeTag")
        img.icon(src="@/assets/remove.svg")
        span Remove Tag
  section.results-section(v-if="cards.length" ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    ResultsFilter(:hideFilter="shouldHideResultsFilter" :items="cards" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredCards")
    ul.results-list
      template(v-for="group in groupedItems")
        li.space-name(:data-space-id="group.spaceId" @click="changeSpace(group.spaceId)" :class="{ active: spaceIsCurrentSpace(group.spaceId) }")
          span.badge.space-badge {{group.spaceName}}
        template(v-for="(card in group.cards")
          li(:data-card-id="card.id" @click="showCardDetails(card)"  :class="{ active: cardIsCurrentCard(card.id) }")
            p.name.name-segments
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
  props: {
    visible: Boolean,
    position: Object,
    tag: Object,
    hasProps: Boolean // + pass in true from TL
  },

  data () {
    return {
      colorPickerIsVisible: false,
      filter: '',
      filteredCards: [],
      loading: false,
      cards: [],
      dialogHeight: null,
      resultsSectionHeight: null
    }
  },
  computed: {
    isVisible () {
      return this.visible || this.$store.state.tagDetailsIsVisible
    },
    currentTag () { // name, color, cardId
      const tag = this.tag || this.$store.state.currentSelectedTag
      if (tag.spaceId) {
        return tag
      } else {
        return this.$store.getters['currentSpace/tagByName'](tag.name)
      }
    },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    currentSpaceId () { return this.$store.state.currentSpace.id },
    dialogPosition () {
      const position = this.position || this.$store.state.tagDetailsPosition
      return {
        left: `${position.x}px`,
        top: `${position.y}px`
      }
    },
    color () {
      if (!this.currentTag) { return }
      return this.currentTag.color
    },
    cardDetailsIsVisibleForCardId () { return this.$store.state.cardDetailsIsVisibleForCardId },
    showEditCard () { return !this.cardDetailsIsVisibleForCardId && !this.hasProps },
    name () {
      if (!this.currentTag) { return }
      return this.currentTag.name
    },
    groupedItems () {
      let groups = []
      this.filteredItems.forEach(item => {
        const groupIndex = groups.findIndex(group => group.spaceName === item.spaceName)
        if (groupIndex !== -1) {
          groups[groupIndex].cards.push(item)
        } else {
          groups.push({
            spaceName: item.spaceName,
            spaceId: item.spaceId || this.currentSpaceId,
            cards: [item]
          })
        }
      })
      groups = this.sortCurrentSpaceIsFirst(groups)
      return groups
    },
    filteredItems () {
      if (this.filter) {
        return this.filteredCards
      } else {
        return this.cards
      }
    },
    cardsNameInCurrentSpace () {
      let tags
      const cardId = this.$store.state.currentSelectedTag.cardId
      tags = this.$store.getters['currentSpace/tagsByName']({
        name: this.name,
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
      if (this.cards.length < 5) {
        return true
      } else {
        return false
      }
    },
    currentCard () {
      let currentCardId = this.cardDetailsIsVisibleForCardId
      const currentCard = this.$store.getters['currentSpace/cardById'](currentCardId)
      const tagCard = this.$store.getters['currentSpace/cardById'](this.$store.state.currentSelectedTag.cardId)
      return currentCard || tagCard
    },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
  },
  methods: {
    cardIsCurrentCard (cardId) {
      if (!this.currentCard) { return }
      return cardId === this.currentCard.id
    },
    sortCurrentSpaceIsFirst (groups) {
      const currentSpaceGroup = groups.find(group => group.spaceId === this.currentSpaceId)
      if (!currentSpaceGroup) { return groups }
      groups = groups.filter(group => group.spaceId !== this.currentSpaceId)
      groups.unshift(currentSpaceGroup)
      return groups
    },
    spaceIsCurrentSpace (spaceId) {
      return spaceId === this.currentSpaceId
    },
    async remoteCards () {
      if (!this.currentUserIsSignedIn) { return }
      let remoteCards
      this.loading = true
      try {
        remoteCards = await this.$store.dispatch('api/getCardsWithTag', this.name) || []
        remoteCards = utils.clone(remoteCards)
      } catch (error) {
        console.warn('🚑 could not find cards with tag', this.name, error)
        this.loading = false
      }
      this.loading = false
      return remoteCards
    },
    async updateCards () {
      const cardsInCurrentSpace = this.cardsNameInCurrentSpace
      const cardsInCachedSpaces = cache.allCardsByTagName(this.name)
      // cache cards
      let cacheCards = cardsInCurrentSpace.concat(cardsInCachedSpaces)
      cacheCards = cacheCards.map(card => {
        card.nameSegments = this.cardNameSegments(card.name)
        return card
      })
      this.updateCardsList(cacheCards)
      // remote cards
      let remoteCards = await this.remoteCards()
      remoteCards = remoteCards.map(card => {
        card.nameSegments = this.cardNameSegments(card.name)
        return card
      })
      remoteCards = remoteCards.filter(card => card.isRemoved !== true)
      this.updateCardsList(remoteCards)
    },
    updateFilter (filter) {
      this.filter = filter
    },
    updateFilteredCards (cards) {
      this.filteredCards = cards
    },
    segmentTagColor (segment) {
      if (this.name === segment.name) {
        return this.color
      }
      const spaceTag = this.$store.getters['currentSpace/tagByName'](segment.name)
      const cachedTag = cache.tagByName(segment.name)
      if (spaceTag) {
        return spaceTag.color
      } else if (cachedTag) {
        return cachedTag.color
      } else {
        return this.$store.state.currentUser.color
      }
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
        if (!segment.isTag) { return segment }
        segment.color = this.segmentTagColor(segment)
        return segment
      })
    },
    changeSpace (spaceId) {
      if (this.spaceIsCurrentSpace(spaceId)) { return }
      const space = { id: spaceId }
      this.$store.dispatch('currentSpace/changeSpace', { space })
    },
    showCardDetails (card) {
      card = card || this.currentCard
      if (this.currentSpaceId !== card.spaceId) {
        this.$store.commit('loadSpaceShowDetailsForCardId', card.id)
        let space
        if (card.spaceId) {
          space = { id: card.spaceId }
        } else {
          space = cache.space(card.spaceId)
        }
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
      const cards = this.cards.map(card => {
        card.nameSegments = card.nameSegments.map(segment => {
          if (segment.isTag && segment.name === name) {
            segment.color = newColor
          }
          return segment
        })
        return card
      })
      this.updateCardsList(cards)
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
      if (this.hasProps) { return }
      const element = this.$refs.dialog
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
    },
    updateResultsSectionHeight () {
      if (!this.isVisible) { return }
      if (!this.hasProps) { return }
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeight(element) - 2
      })
    },
    updateDialogHeight () {
      if (!this.hasProps) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
        this.updateResultsSectionHeight()
      })
    },
    removeTag () {
      this.$store.dispatch('currentSpace/removeTags', this.currentTag)
      this.$emit('removeTag', this.currentTag)
    },

    updateCardsList (cards) {
      cards = cards.filter(card => {
        const cardTags = utils.tagsFromStringWithoutBrackets(card.name)
        return cardTags.includes(this.name)
      })
      cards = uniqBy(cards, 'id')
      this.cards = cards
      this.$nextTick(() => { // double nextTick to avoid timing conflicts with TagList updatePosition()
        this.$nextTick(() => {
          this.updateDialogHeight()
        })
      })
    }

  },
  watch: {
    isVisible (visible) {
      if (visible) {
        this.updateCards()
        this.closeDialogs()
      }
      this.$nextTick(() => {
        if (visible) {
          this.scrollIntoView()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
.tag-details
  cursor auto
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
