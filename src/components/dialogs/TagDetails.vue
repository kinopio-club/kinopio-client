<template lang="pug">
dialog.tag-details(v-if="visible" :open="visible" :style="styles" ref="dialog" @click.left.stop="closeDialogs" :class="{narrow: !visibleFromTagList}")
  section.edit-card(v-if="showEditCard")
    button(@click="showCardDetails(null)")
      span Edit Card
    button.change-color.select-all(@click="selectCardsWithTag")
      .current-color(:style="{backgroundColor: color}")
      span Select
  section(:style="{backgroundColor: color}" :class="{'is-dark': isDark}")
    .row.tag-title-row
      .row
        .button-wrap
          button.change-color(:disabled="!canEditSpace" @click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
            .current-color(:style="{backgroundColor: color}")
          ColorPicker(:currentColor="color" :visible="colorPickerIsVisible" @selectedColor="updateTagNameColor")
        .tag-name {{name}}
      //- Filter
      label.toggle-filter(@@click.left.prevent="toggleFilteredInSpace" @keydown.stop.enter="toggleFilteredInSpace" :class="{active: isFilteredInSpace}")
        input(type="checkbox" v-model="isFilteredInSpace")
        img.icon(src="@/assets/filter.svg")

    //- no cards found
    template(v-if="!cards.length && !loading")
      p.no-cards Tag more cards with [[{{currentTag.name}}]] to see them here
      button(v-if="visibleFromTagList" @click.left.stop="removeTag")
        img.icon(src="@/assets/remove.svg")
        span Remove Tag

  //- loading without cached cards
  section(v-if="!cards.length && loading")
    Loader(:visible="loading")

  //- cards found, or loading with cached cards
  section.results-section(v-if="cards.length" ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    ResultsFilter(:hideFilter="shouldHideResultsFilter" :items="cards" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredCards")
    ul.results-list
      template(v-for="group in groupedItems")

        //- space
        li.space-name(v-if="group.spaceId" :data-space-id="group.spaceId" @click="changeSpace(group.spaceId)" :class="{ active: spaceIsCurrentSpace(group.spaceId) }")
          BackgroundPreview(v-if="group.space" :space="group.space")
          span.badge.space-badge
            span {{group.spaceName}}

        //- cards
        template(v-for="(card in group.cards")
          li(:data-card-id="card.id" @click="showCardDetails(card)" :class="{ active: cardIsCurrentCard(card.id) }")
            p.name.name-segments
              span.badge.status.inline-badge
                img.icon.time(src="@/assets/time.svg")
                span {{ relativeDate(card) }}
              User(v-if="card.otherUser" :user="card.otherUser" :isClickable="false")
              User(v-else-if="card.userId !== currentUser.id && userById(card.userId)" :user="userById(card.userId)" :isClickable="false")
              template(v-for="segment in card.nameSegments")
                img.card-image(v-if="segment.isImage" :src="segment.url")
                span(v-if="segment.isText") {{segment.content}}
                //- Tags
                template(v-if="segment.isTag")
                  Tag(:tag="segment" :isActive="currentTag.name === segment.name")

    Loader(:visible="loading")
</template>

<script>
import ResultsFilter from '@/components/ResultsFilter.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import User from '@/components/User.vue'
import BackgroundPreview from '@/components/BackgroundPreview.vue'
import Tag from '@/components/Tag.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'

import uniqBy from 'lodash-es/uniqBy'
import sortBy from 'lodash-es/sortBy'
import dayjs from 'dayjs'

export default {
  name: 'TagDetails',
  components: {
    ColorPicker,
    User,
    BackgroundPreview,
    Tag,
    Loader,
    ResultsFilter
  },
  mounted () {
    window.addEventListener('scroll', this.updatePosition)
  },
  beforeUnmount () {
    window.removeEventListener('scroll', this.updatePosition)
  },
  data () {
    return {
      colorPickerIsVisible: false,
      filter: '',
      filteredCards: [],
      loading: false,
      cards: [],
      dialogHeight: null,
      resultsSectionHeight: null,
      newPosition: {}
    }
  },
  computed: {
    visible () { return this.$store.state.tagDetailsIsVisible },
    visibleFromTagList () { return this.$store.state.tagDetailsIsVisibleFromTagList },
    currentTag () {
      // name, color, cardId
      const tag = this.$store.state.currentSelectedTag
      if (tag.spaceId) {
        return tag
      } else {
        return this.$store.getters['currentSpace/tagByName'](tag.name)
      }
    },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    currentSpaceId () { return this.$store.state.currentSpace.id },
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal },
    pinchCounterZoomDecimal () { return this.$store.state.pinchCounterZoomDecimal },
    position () {
      if (utils.objectHasKeys(this.newPosition)) {
        return this.newPosition
      } else {
        return this.$store.state.tagDetailsPosition
      }
    },
    styles () {
      const isChildDialog = this.cardDetailsIsVisibleForCardId || this.visibleFromTagList
      let zoom = this.$store.getters.spaceZoomDecimal
      if (isChildDialog) {
        zoom = 1
      }
      const x = zoom * this.position.x
      const y = zoom * this.position.y
      let scale
      if (utils.isSignificantlyPinchZoomed()) {
        scale = this.pinchCounterZoomDecimal
      }
      return {
        left: `${x}px`,
        top: `${y}px`,
        transform: `scale(${scale})`
      }
    },
    color () {
      if (!this.currentTag) { return }
      return this.currentTag.color
    },
    cardDetailsIsVisibleForCardId () { return this.$store.state.cardDetailsIsVisibleForCardId },
    currentCard () {
      let currentCardId = this.cardDetailsIsVisibleForCardId
      const currentCard = this.$store.getters['currentCards/byId'](currentCardId)
      const tagCard = this.$store.getters['currentCards/byId'](this.$store.state.currentSelectedTag.cardId)
      return currentCard || tagCard
    },
    showEditCard () { return !this.cardDetailsIsVisibleForCardId && !this.visibleFromTagList },
    name () {
      if (!this.currentTag) { return }
      return this.currentTag.name
    },
    groupedItems () {
      let groups = []
      this.filteredItems.forEach(item => {
        const groupIndex = groups.findIndex(group => group.spaceId === item.spaceId)
        if (groupIndex !== -1) {
          groups[groupIndex].cards.push(item)
        } else {
          let background, spaceName
          const spaceId = item.spaceId || this.currentSpaceId
          const space = this.$store.getters.cachedOrOtherSpaceById(spaceId)
          if (space) {
            background = space.background
            spaceName = space.name
          }
          groups.push({
            spaceName: spaceName || item.spaceName,
            spaceId: spaceId,
            cards: [item],
            space,
            background
          })
        }
      })
      groups = this.sortCurrentSpaceIsFirst(groups)
      groups = this.sortCurrentCardIsFirst(groups)
      return groups
    },
    filteredItems () {
      if (this.filter) {
        return this.filteredCards
      } else {
        return this.cards
      }
    },
    shouldHideResultsFilter () {
      if (this.cards.length < 5) {
        return true
      } else {
        return false
      }
    },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    currentUser () { return this.$store.state.currentUser },
    isFilteredInSpace: {
      get () {
        const tags = this.$store.state.filteredTagNames
        return tags.includes(this.currentTag.name)
      },
      set () {
        this.toggleFilteredInSpace()
      }
    },
    isDark () {
      return utils.colorIsDark(this.color)
    }
  },
  methods: {
    selectCardsWithTag () {
      let cards = this.$store.getters['currentCards/withTagName'](this.currentTag.name)
      cards = cards.filter(card => Boolean(card))
      if (!cards.length) { return }
      const cardIds = cards.map(card => card.id)
      this.$store.dispatch('closeAllDialogs', 'TagDetails.selectCardsWithTag')
      this.$store.commit('multipleCardsSelectedIds', cardIds)
    },
    updatePosition () {
      if (!this.$store.state.tagDetailsPositionShouldUpdate) { return }
      const origin = this.$store.state.tagDetailsPosition
      const delta = {
        x: window.scrollX - origin.pageX,
        y: window.scrollY - origin.pageY
      }
      this.newPosition = {
        x: origin.x + delta.x,
        y: origin.y + delta.y
      }
    },
    toggleFilteredInSpace () {
      const filtered = this.$store.state.filteredTagNames
      const tagName = this.currentTag.name
      if (filtered.includes(tagName)) {
        this.$store.commit('removeFromFilteredTagNames', tagName)
      } else {
        this.$store.commit('addToFilteredTagNames', tagName)
      }
    },
    userById (userId) {
      return this.$store.getters['currentSpace/userById'](userId)
    },
    cardIsCurrentCard (cardId) {
      if (this.visibleFromTagList) { return }
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
    sortCurrentCardIsFirst (groups) {
      if (!this.currentCard) { return groups }
      const currentCard = groups[0].cards.find(card => card.id === this.currentCard.id)
      if (!currentCard) { return groups }
      let cards = groups[0].cards.filter(card => card.id !== currentCard.id)
      cards.unshift(currentCard)
      groups[0].cards = cards
      return groups
    },
    spaceIsCurrentSpace (spaceId) {
      return spaceId === this.currentSpaceId
    },
    async remoteCards () {
      let remoteCards = []
      this.loading = true
      try {
        let cards
        cards = await this.$store.dispatch('api/getCardsWithTag', this.name) || []
        cards = utils.clone(cards)
        cards = sortBy(cards, card => dayjs(card.updatedAt).valueOf())
        cards = cards.reverse()
        remoteCards = remoteCards.concat(cards)
      } catch (error) {
        console.warn('🚑 could not find cards with tag', this.name, error)
        this.loading = false
      }
      this.loading = false
      return remoteCards
    },
    async updateCards () {
      this.cards = []
      const cardsInCurrentSpace = utils.clone(this.$store.getters['currentCards/withTagName'](this.name))
      const cardsInCachedSpaces = cache.allCardsByTagName(this.name)
      // cache cards
      let cacheCards = cardsInCurrentSpace.concat(cardsInCachedSpaces)
      cacheCards = this.addCardNameSegments(cacheCards)
      this.updateCardsList(cacheCards)
      // remote cards
      let remoteCards = await this.remoteCards()
      if (remoteCards.length) {
        remoteCards = this.addCardNameSegments(remoteCards)
        remoteCards = remoteCards.filter(card => card.isRemoved !== true)
        this.updateCardsList(remoteCards)
      }
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
        return this.currentUser.color
      }
    },
    addCardNameSegments (cards) {
      return cards.map(card => {
        card.nameSegments = this.cardNameSegments(card.name)
        return card
      })
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
      this.$store.dispatch('closeAllDialogs', 'TagDetails.changeSpace')
      if (this.spaceIsCurrentSpace(spaceId)) { return }
      const space = { id: spaceId }
      this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
    },
    showCardDetails (card) {
      card = card || this.currentCard
      this.$store.dispatch('closeAllDialogs', 'TagDetails.showCardDetails')
      if (this.currentSpaceId !== card.spaceId) {
        this.$store.commit('loadSpaceShowDetailsForCardId', card.id)
        let space
        if (card.spaceId) {
          space = { id: card.spaceId }
        } else {
          space = cache.space(card.spaceId)
        }
        this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
      } else {
        const cardId = card.id || this.currentTag.cardId
        this.$store.commit('preventCardDetailsOpeningAnimation', false)
        this.$store.dispatch('currentCards/showCardDetails', cardId)
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
      const element = this.$refs.dialog
      utils.scrollIntoView(element)
    },
    updateResultsSectionHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeight(element) - 2
      })
    },
    updateDialogHeight () {
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
        this.updateResultsSectionHeight()
      })
    },
    removeTag () {
      this.$store.dispatch('currentSpace/removeTags', this.currentTag)
    },
    updateCardsList (cards) {
      cards = cards.filter(card => {
        const cardTags = utils.tagsFromStringWithoutBrackets(card.name) || []
        return cardTags.includes(this.name)
      })
      cards = this.cards.concat(cards)
      cards = uniqBy(cards, 'id')
      this.cards = cards
      this.$nextTick(() => { // double nextTick to avoid timing conflicts with TagList updatePosition()
        this.$nextTick(() => {
          this.updateDialogHeight()
        })
      })
    },
    appendToCardsList (cards) {
      const newCardIds = cards.map(card => card.id)
      this.cards = this.cards.filter(card => !newCardIds.includes(card.id))
      this.cards = this.cards.concat(cards)
      this.updateDialogHeight()
    },
    updatePinchCounterZoomDecimal () {
      this.$store.commit('pinchCounterZoomDecimal', utils.pinchCounterZoomDecimal())
    },
    relativeDate (card) {
      let date = card.nameUpdatedAt || card.updatedAt
      if (!date) {
        card = this.$store.getters['currentCards/byId'](card.id)
        if (!card) { return }
        date = card.nameUpdatedAt || card.updatedAt
      }
      return utils.shortRelativeTime(date)
    }
  },
  watch: {
    currentTag (tag) {
      if (tag && this.visible) {
        this.newPosition = {}
        this.updateCards()
        this.updatePinchCounterZoomDecimal()
        this.closeDialogs()
        this.$nextTick(() => {
          this.scrollIntoView()
        })
      }
    },
    visible (visible) {
      if (!visible) {
        this.$store.commit('tagDetailsPositionShouldUpdate', false)
      }
    }
  }
}
</script>

<style lang="stylus">
.tag-details
  cursor auto
  transform-origin top left
  section.edit-card
    background-color var(--secondary-background)
  button.select-all
    width initial
    .current-color
      display inline-block
      vertical-align -3px
      margin-right 4px
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
  .user
    vertical-align middle
    margin-right 3px
  .background-preview
    margin-right 3px
  .card-image
    width 48px
    vertical-align middle
    border-radius 3px
  .tag-title-row
    justify-content space-between
    align-items flex-start
    .tag-name
      margin-left 6px
    > .row
      margin 0
  .toggle-filter
    min-width 45px
  .is-dark
    .tag-name,
    .no-cards
      filter invert(1)
</style>
