<template lang="pug">
dialog.restore(v-if="visible" :open="visible" @click.stop)
  section
    .segmented-buttons
      button(@click="showCards" :class="{active: cardsVisible}")
        img.icon(src="@/assets/remove.svg")
        span Cards
        Loader(:visible="loading.cards")
      button(@click="showSpaces" :class="{active: !cardsVisible}")
        img.icon(src="@/assets/remove.svg")
        span Spaces
        Loader(:visible="loading.spaces")

  section(v-if="!items.length")
    img(src="@/assets/photo-empty-meal.png")
    p(v-if="cardsVisible") Removed cards from
      span !{' '}{{currentSpaceName}}!{' '}
      span can be restored here
    p(v-if="!cardsVisible") Removed spaces can be restored here

  section.results-section(v-if="items.length")
    ul.results-list
      template(v-for="(item in items")
        li(:key="item.id" @click="restore(item)")
          .badge
            img.undo.icon(src="@/assets/undo.svg")
          .name {{item.name}}
          button(@click.stop="showRemoveConfirmation(item)" v-if="!isRemoveConfirmationVisible(item)")
            img.icon(src="@/assets/remove.svg")

          .remove-confirmation(v-if="isRemoveConfirmationVisible(item)")
            p Permanently remove?
            .segmented-buttons
              button(@click.stop="hideRemoveConfirmation")
                span Cancel
              button.danger(@click.stop="remove(item)")
                img.icon(src="@/assets/remove.svg")
                span Remove
</template>

<script>
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfill
import merge from 'lodash-es/merge'

import api from '@/api.js'
import cache from '@/cache.js'
import Loader from '@/components/Loader.vue'

export default {
  name: 'Restore',
  components: {
    Loader
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      removeConfirmationVisibleForId: '',
      cardsVisible: true,
      removedSpaces: [],
      removedCards: [],
      loading: {
        cards: false,
        spaces: false
      }
    }
  },
  computed: {
    items () {
      if (this.cardsVisible) {
        return this.removedCards
      } else {
        return this.removedSpaces
      }
    },
    currentSpaceName () {
      return this.$store.state.currentSpace.name
    }
  },
  methods: {
    showCards () {
      this.cardsVisible = true
    },
    showSpaces () {
      this.cardsVisible = false
      this.updateRemovedSpaces()
    },
    scrollIntoView (card) {
      const element = document.querySelector(`article [data-card-id="${card.id}"]`)
      scrollIntoView(element, {
        behavior: 'smooth',
        scrollMode: 'if-needed'
      })
    },
    updateRemovedSpaces () {
      this.removedSpaces = cache.getAllRemovedSpaces()
      this.loadRemoteRemovedSpaces()
    },
    updateRemovedCards () {
      this.removedCards = this.$store.state.currentSpace.removedCards
      this.loadRemoteRemovedCards()
    },
    async loadRemoteRemovedSpaces () {
      this.loading.spaces = true
      let removedSpaces = await api.getUserRemovedSpaces()
      this.loading.spaces = false
      if (!removedSpaces) { return }
      removedSpaces = removedSpaces.map(remote => {
        const localSpace = this.removedSpaces.find(local => local.id === remote.id)
        if (localSpace) {
          return merge(remote, localSpace)
        } else {
          return remote
        }
      })
      this.removedSpaces = removedSpaces
    },
    async loadRemoteRemovedCards () {
    //   this.loading.cards = true
    //   console.log('cards visible')
    //   // const remoteSpace = await api.getRemovedSpaceCards(space.id)
    },
    restore (item) {
      if (this.cardsVisible) {
        this.restoreCard(item)
      } else {
        this.restoreSpace(item)
      }
    },
    restoreCard (card) {
      this.$store.dispatch('currentSpace/restoreCard', card)
      // TODO api queue restore card (card)
      this.$nextTick(() => {
        this.scrollIntoView(card)
      })
    },
    restoreSpace (space) {
      console.log('restore space', space)
      this.$store.dispatch('currentSpace/restoreSpace', space)
      this.removedSpaces = cache.getAllRemovedSpaces()
    },
    isRemoveConfirmationVisible (item) {
      return Boolean(this.removeConfirmationVisibleForId === item.id)
    },
    showRemoveConfirmation (item) {
      this.removeConfirmationVisibleForId = item.id
    },
    hideRemoveConfirmation () {
      this.removeConfirmationVisibleForId = ''
    },
    remove (item) {
      if (this.cardsVisible) {
        this.removeCardPermanent(item)
      } else {
        this.removeSpacePermanent(item)
      }
    },
    removeCardPermanent (card) {
      this.$store.dispatch('currentSpace/removeCardPermanent', card)
    },
    removeSpacePermanent (space) {
      console.log(space)
      this.$store.dispatch('currentSpace/removeSpacePermanent', space)
      this.removedSpaces = cache.getAllRemovedSpaces()
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateRemovedCards()
        this.updateRemovedSpaces()
      }
    }
  }
}
</script>

<style lang="stylus">
.restore
  overflow auto
  .results-section
    max-height initial
    border-top 1px solid var(--primary)
    padding-top 4px
  li
    justify-content space-between
    button
      margin-left auto
  .name
    white-space nowrap
    overflow hidden
    text-overflow ellipsis
    max-width calc(100% - 56px)
  .remove-confirmation
    margin-left 6px
    min-width 130px
    .segmented-buttons
      margin-top 5px
  .badge
    min-width 19px
</style>
