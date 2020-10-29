<template lang="pug">
dialog.tag-details(v-if="visible" :open="visible" :style="dialogPosition" ref="dialog" @click.left.stop="closeDialogs")
  section.edit-card(v-if="showEditCard")
    button(@click="showCardDetails(null)") Edit Card
  section(:style="{backgroundColor: color}")
    .row
      .button-wrap
        button.change-color(:disabled="!canEditSpace" @click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="{backgroundColor: color}")
        ColorPicker(:currentColor="color" :visible="colorPickerIsVisible" @selectedColor="updateTagNameColor")
      .tag-name {{name}}
    p(v-if="!cards.length") Tag more cards with [[{{currentTag.name}}]] to see them here
  section.results-section(v-if="cards.length")
    ResultsFilter(:hideFilter="shouldHideResultsFilter" :items="cards" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredCards")
    ul.results-list
      template(v-for="group in groupedItems")
        li.space-name(:data-space-id="group.spaceId" @click="changeSpace(group.spaceId)" :class="{ active: spaceIsCurrentSpace(group.spaceId) }")
          span.badge.space-badge {{group.spaceName}}
        template(v-for="(card in group.cards")
          li(:data-card-id="card.id" @click="showCardDetails(card)")
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
      filteredCards: [],
      loading: false,
      cards: []
    }
  },
  computed: {
    visible () {
      return this.$store.state.tagDetailsIsVisible
    },
    currentTag () { // name, color, cardId
      const tag = this.$store.state.currentSelectedTag

      if (tag.spaceId) {
        return tag
      } else {
        return this.$store.getters['currentSpace/tagByName'](tag.name)
      }
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
    showEditCard () {
      return !this.$store.state.cardDetailsIsVisibleForCardId
    },
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
            spaceId: item.spaceId,
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
      tags = this.$store.getters['currentSpace/tagsByNameExcludingCardById']({
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
      return this.$store.getters['currentSpace/cardById'](this.$store.state.currentSelectedTag.cardId)
    },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
  },
  methods: {
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
      this.cards = this.excludeCurrentCard(cacheCards)
      // remote cards
      let remoteCards = await this.remoteCards()
      remoteCards = remoteCards.map(card => {
        card.nameSegments = this.cardNameSegments(card.name)
        return card
      })
      remoteCards = remoteCards.filter(card => card.isRemoved !== true)
      this.cards = this.excludeCurrentCard(remoteCards)
    },
    excludeCurrentCard (cards) {
      cards = cards.filter(card => card.id !== this.currentCard.id)
      return cards
    },
    updateFilter (filter) {
      this.filter = filter
    },
    updateFilteredCards (cards) {
      this.filteredCards = cards
    },
    segmentTagColor (segment) {
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
        const cardId = card.id || this.tag.cardId
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
      this.cards = this.excludeCurrentCard(cards)
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
      if (this.visibleFromProp) { return }
      const element = this.$refs.dialog
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
    }
  },
  watch: {
    visible (visible) {
      if (this.visible) {
        this.updateCards()
        this.closeDialogs()
      }
      this.$nextTick(() => {
        if (this.visible) {
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
