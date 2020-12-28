<template lang="pug">
dialog.tag-details(v-if="visible" :open="visible" :style="position" ref="dialog" @click.left.stop="closeDialogs")
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
      button(v-if="visibleFromTagList" @click.left.stop="removeTag")
        img.icon(src="@/assets/remove.svg")
        span Remove Tag
  section.results-section(v-if="cards.length" ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    ResultsFilter(:hideFilter="shouldHideResultsFilter" :items="cards" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredCards")
    ul.results-list
      template(v-for="group in groupedItems")

        //- space
        li.space-name(v-if="group.spaceId" :data-space-id="group.spaceId" @click="changeSpace(group.spaceId)" :class="{ active: spaceIsCurrentSpace(group.spaceId) }")
          .background(v-if="group.background" :style="{ backgroundImage: `url(${group.background})` }")
          span.badge.space-badge
            span {{group.spaceName}}

        //- cards
        template(v-for="(card in group.cards")
          li(:data-card-id="card.id" @click="showCardDetails(card)" :class="{ active: cardIsCurrentCard(card.id) }")
            p.name.name-segments
              User(v-if="card.otherUser" :user="card.otherUser" :isClickable="false")
              User(v-else-if="card.userId !== currentUser.id && userById(card.userId)" :user="userById(card.userId)" :isClickable="false")
              template(v-for="segment in card.nameSegments")
                img(v-if="segment.isImage" :src="segment.url")
                span(v-if="segment.isText") {{segment.content}}
                //- Tags
                span.badge.tag-badge(
                  v-if="segment.isTag"
                  :style="{backgroundColor: segment.color}"
                  :class="{ active: currentTag.name === segment.name }"
                )
                  span {{segment.name}}
    Loader(:visible="loading")
</template>

<script>
import ResultsFilter from '@/components/ResultsFilter.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import User from '@/components/User.vue'
import Loader from '@/components/Loader.vue'
import scrollIntoView from '@/scroll-into-view.js'
import utils from '@/utils.js'
import cache from '@/cache.js'

import uniqBy from 'lodash-es/uniqBy'

export default {
  name: 'TagDetails',
  components: {
    ColorPicker,
    User,
    Loader,
    ResultsFilter
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
    position () {
      const position = this.$store.state.tagDetailsPosition
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
    cardUser () {
      if (!this.currentCard) {
        return this.currentUser
      }
      const user = this.userById(this.currentCard.nameUpdatedByUserId)
      return user
    },
    currentCard () {
      let currentCardId = this.cardDetailsIsVisibleForCardId
      if (!currentCardId) { return }
      const currentCard = this.$store.getters['currentSpace/cardById'](currentCardId)
      const tagCard = this.$store.getters['currentSpace/cardById'](this.$store.state.currentSelectedTag.cardId)
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
        const groupIndex = groups.findIndex(group => group.spaceName === item.spaceName)
        if (groupIndex !== -1) {
          groups[groupIndex].cards.push(item)
        } else {
          let background
          const spaceId = item.spaceId || this.currentSpaceId
          const space = this.$store.getters.cachedOrOtherSpaceById(spaceId)
          if (space) {
            background = space.background
          }
          groups.push({
            spaceName: item.spaceName,
            spaceId: spaceId,
            cards: [item],
            space,
            background
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
    cardsByTagName () {
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
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    currentUser () { return this.$store.state.currentUser }
  },
  methods: {
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
    spaceIsCurrentSpace (spaceId) {
      return spaceId === this.currentSpaceId
    },
    async remoteCards (shouldGetOtherUserCards) {
      let remoteCards
      this.loading = true
      try {
        if (shouldGetOtherUserCards) {
          remoteCards = await this.$store.dispatch('api/getCardsWithTagAndUser', {
            userId: this.cardUser.id,
            tagName: this.name
          }) || []
        } else {
          remoteCards = await this.$store.dispatch('api/getCardsWithTag', this.name) || []
        }
        remoteCards = utils.clone(remoteCards)
      } catch (error) {
        console.warn('🚑 could not find cards with tag', this.name, error)
        this.loading = false
      }
      this.loading = false
      return remoteCards
    },
    addNameSegments (cards) {
      return cards.map(card => {
        card.nameSegments = this.cardNameSegments(card.name)
        return card
      })
    },
    async updateCards () {
      const cardsInCurrentSpace = this.cardsByTagName
      const cardsInCachedSpaces = cache.allCardsByTagName(this.name)
      // cache cards
      let cacheCards = cardsInCurrentSpace.concat(cardsInCachedSpaces)
      cacheCards = this.addNameSegments(cacheCards)
      this.updateCardsList(cacheCards)
      // remote cards
      let remoteCards = await this.remoteCards()
      if (!remoteCards) { return }
      remoteCards = this.addNameSegments(remoteCards)
      remoteCards = remoteCards.filter(card => card.isRemoved !== true)
      this.updateCardsList(remoteCards)
      // remote other user cards
      const currentUserIsCardUser = !this.cardUser.id || this.cardUser.id === this.currentUser.id
      if (currentUserIsCardUser) { return }
      const shouldGetOtherUserCards = true
      let otherUserCards = await this.remoteCards(shouldGetOtherUserCards)
      if (!otherUserCards) { return }
      otherUserCards = otherUserCards.map(card => {
        if (card.userId !== this.currentUser.id) {
          card.otherUser = this.userById(card.userId)
        }
        return card
      })
      otherUserCards = this.addNameSegments(otherUserCards)
      // todo: display user icon next to card/space
      this.appendToCardsList(otherUserCards)
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
      this.$store.dispatch('currentSpace/changeSpace', { space })
    },
    showCardDetails (card) {
      this.$store.dispatch('closeAllDialogs', 'TagDetails.showCardDetails')
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
      const element = this.$refs.dialog
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
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
    },
    appendToCardsList (cards) {
      const newCardIds = cards.map(card => card.id)
      this.cards = this.cards.filter(card => !newCardIds.includes(card.id))
      this.cards = this.cards.concat(cards)
      this.updateDialogHeight()
    }
  },
  watch: {
    currentTag (tag) {
      if (tag && this.visible) {
        this.updateCards()
        this.closeDialogs()
        this.$nextTick(() => {
          this.scrollIntoView()
        })
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
  .user
    vertical-align middle
    margin-right 3px
  .background
    border-radius 3px
    display inline-grid
    height 24px
    width 24px
    vertical-align middle
    margin-right 3px
    background-repeat no-repeat
    background-size cover
</style>
