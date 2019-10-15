<template lang="pug">
dialog.restore(v-if="visible" :open="visible" @click.stop)
  section
    .segmented-buttons
      button(@click="showCards" :class="{active: cardsVisible}")
        img.icon(src="@/assets/remove.svg")
        span Cards
      button(@click="showSpaces" :class="{active: !cardsVisible}")
        img.icon(src="@/assets/remove.svg")
        span Spaces

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

import cache from '@/cache.js'

export default {
  name: 'Restore',
  props: {
    visible: Boolean
  },
  data () {
    return {
      removeConfirmationVisibleForId: '',
      cardsVisible: true,
      removedSpaces: []
    }
  },
  computed: {
    removedCards () {
      return this.$store.state.currentSpace.removedCards
    },
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
      console.log(document, element, card, card.id)
      scrollIntoView(element, {
        behavior: 'smooth',
        scrollMode: 'if-needed'
      })
    },
    updateRemovedSpaces () {
      this.removedSpaces = cache.getAllRemovedSpaces()
    },

    // restore item
    restore (item) {
      if (this.cardsVisible) {
        this.restoreCard(item)
      } else {
        this.restoreSpace(item)
      }
    },
    restoreCard (card) {
      this.$store.commit('currentSpace/restoreCard', card.id)
      this.$nextTick(() => {
        this.scrollIntoView(card)
      })
    },
    restoreSpace (space) {
      console.log('restore space', space)
      cache.restoreSpace(space.id)
      this.updateRemovedSpaces()
      this.$store.dispatch('currentSpace/changeSpace', space)
    },

    // remove confirmation
    isRemoveConfirmationVisible (item) {
      return Boolean(this.removeConfirmationVisibleForId === item.id)
    },
    showRemoveConfirmation (item) {
      this.removeConfirmationVisibleForId = item.id
    },
    hideRemoveConfirmation () {
      this.removeConfirmationVisibleForId = ''
    },

    // remove item
    remove (item) {
      if (this.cardsVisible) {
        this.removeCard(item)
      } else {
        this.removeSpace(item)
      }
    },
    removeCard (card) {
      this.$store.commit('currentSpace/removeCardPermanently', card.id)
    },
    removeSpace (space) {
      cache.removeRemovedSpace(space.id)
      this.updateRemovedSpaces()
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        if (!this.cardsVisible) {
          this.updateRemovedSpaces()
        }
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
