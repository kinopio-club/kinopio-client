<template lang="pug">
dialog.tag-details(v-if="visible" :open="visible" :style="dialogPosition" ref="dialog" @click.left.stop="closeDialogs")
  section(:style="{backgroundColor: color}")
    .row
      .button-wrap
        button.change-color(:disabled="!canEditSpace" @click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="{backgroundColor: color}")
        ColorPicker(:currentColor="color" :visible="colorPickerIsVisible" @selectedColor="updateTagNameColor")
      .tag-name {{name}}
    p(v-if="!cards.length") Tag more cards with [[{{tag.name}}]] to see them here
  section.results-section(v-if="cards.length")
    ResultsFilter(:hideFilter="shouldHideResultsFilter" :items="cards" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredCards")
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
                :class="{ active: tag.name === segment.name }"
              ) {{segment.name}}
    Loader(:visible="loading")
</template>

<script>
// TagDetailsFromList is based on TagDetails, but prop based

import ResultsFilter from '@/components/ResultsFilter.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import Loader from '@/components/Loader.vue'
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
    tag: Object
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
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    currentSpaceId () { return this.$store.state.currentSpace.id },
    dialogPosition () {
      return {
        left: `${this.position.x}px`,
        top: `${this.position.y}px`
      }
    },
    color () { return this.tag.color },
    name () {
      return this.tag.name
    },
    filteredItems () {
      if (this.filter) {
        return this.filteredCards
      } else {
        console.log('filteredItems', this.cards)
        return this.cards
      }
    },
    cardsNameInCurrentSpace () {
      let tags
      tags = this.$store.getters['currentSpace/tagsByName'](this.name)
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
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
  },
  methods: {
    async remoteCards () {
      if (!this.currentUserIsSignedIn) { return }
      let remoteCards
      const remoteTagNameGroup = this.$store.getters['remoteTagNameGroupByName'](this.name)
      if (remoteTagNameGroup) {
        remoteCards = remoteTagNameGroup.cards
      } else {
        this.loading = true
        try {
          console.log('get remote cards w tag', this.name)
          remoteCards = await this.$store.dispatch('api/getCardsWithTag', this.name) || []
          remoteCards = utils.clone(remoteCards)
          console.log(remoteCards)
        } catch (error) {
          console.warn('🚑 could not find cards with tag', this.name, error)
          // TODO this happens if the tag was created but the card/space was removed. here's where i give the option to remove tag
          this.loading = false
        }
        this.loading = false
        const remoteTagGroup = {
          name: this.name,
          cards: remoteCards
        }
        this.$store.commit('addToRemoteTagNameGroups', remoteTagGroup)
      }
      return remoteCards
    },

    async updateCards () {
      const cardsInCurrentSpace = this.cardsNameInCurrentSpace
      const cardsInCachedSpaces = cache.allCardsByTagName(this.name)
      const cacheCards = cardsInCurrentSpace.concat(cardsInCachedSpaces)
      const remoteCards = await this.remoteCards()
      let cards = cacheCards.concat(remoteCards)
      cards = uniqBy(cards, 'id')
      cards = cards.map(card => {
        card.nameSegments = this.cardNameSegments(card.name)
        return card
      })
      this.cards = cards
    },

    updateFilter (filter) {
      this.filter = filter
    },
    updateFilteredCards (cards) {
      this.filteredCards = cards
    },
    segmentTagColor (segment) {
      if (this.tag.name === segment.name) {
        return this.tag.color
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
    showCardDetails (card) {
      if (this.currentSpaceId !== card.spaceId) {
        this.$store.commit('loadSpaceShowDetailsForCardId', card.id)
        const space = cache.space(card.spaceId) || { id: card.spaceId }
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
      this.cards = cards
    },
    updateTagNameColor (newColor) {
      let tag = utils.clone(this.tag)
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
    }
  },
  watch: {
    cards (value) {
      console.log('WATCH cards', value, this.tag.name)
      // todo update position on nexttick, so that dialog bottom isn't below viewport bottom
    },
    visible (visible) {
      if (this.visible) {
        this.closeDialogs()
        this.updateCards()
      }
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
