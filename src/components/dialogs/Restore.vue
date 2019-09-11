<template lang="pug">
dialog.restore(v-if="visible" :open="visible" @click.stop)
  section
    p Restore Removed
    .segmented-buttons
      button(@click="showCardsVisible" :class="{active: cardsVisible}") Cards
      button(@click="hideCardsVisible" :class="{active: !cardsVisible}") Spaces

  section.results-section

    // cards // ??? refactor into RestoreListItem Component
    ul.results-list(v-if="cardsVisible")
      template(v-for="(card in removedCards")
        li(:key="card.id" @click="restoreCard(card)")
          .badge
            img.undo.icon(src="@/assets/undo.svg")
          .name {{card.name}}
          button(@click.stop="showRemoveCardConfirmationVisible(card)" v-if="!isRemoveCardConfirmationVisible(card)")
            img.icon(src="@/assets/remove.svg")

          .remove-confirmation(v-if="isRemoveCardConfirmationVisible(card)")
            p Permanently remove?
            .segmented-buttons(v-if="isRemoveCardConfirmationVisible(card)")
              button(@click.stop="hideRemoveCardConfirmationVisible")
                span Cancel
              button.danger(@click.stop="removeCard(card)")
                img.icon(src="@/assets/remove.svg")
                span Remove

    // spaces
    ul.results-list(v-if="!cardsVisible")
      template(v-for="(space in removedSpaces")
        li(:key="space.id" @click="restoreSpace(space)")
          .badge
            img.undo.icon(src="@/assets/undo.svg")
          .name {{space.name}}
          button(@click.stop="showRemoveSpaceConfirmationVisible(space)" v-if="!isRemoveSpaceConfirmationVisible(space)")
            img.icon(src="@/assets/remove.svg")

          .remove-confirmation(v-if="isRemoveSpaceConfirmationVisible(space)")
            p Permanently remove?
            .segmented-buttons(v-if="isRemoveSpaceConfirmationVisible(space)")
              button(@click.stop="hideRemoveSpaceConfirmationVisible")
                span Cancel
              button.danger(@click.stop="removeSpace(space)")
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
      removeCardConfirmationVisibleForCardId: '',
      removeSpaceConfirmationVisibleForSpaceId: '',

      cardsVisible: true,
      removedSpaces: []
    }
  },
  computed: {
    removedCards () {
      return this.$store.state.currentSpace.removedCards
    }
  },
  methods: {
    showCardsVisible () {
      this.cardsVisible = true
    },
    hideCardsVisible () {
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
    restoreCard (card) {
      this.$store.dispatch('currentSpace/restoreCard', card.id)
      this.$nextTick(() => {
        this.scrollIntoView(card)
      })
    },
    showRemoveCardConfirmationVisible (card) {
      this.removeCardConfirmationVisibleForCardId = card.id
    },
    hideRemoveCardConfirmationVisible () {
      this.removeCardConfirmationVisibleForCardId = ''
    },
    isRemoveCardConfirmationVisible (card) {
      return Boolean(this.removeCardConfirmationVisibleForCardId === card.id)
    },
    removeCard (card) {
      this.$store.commit('currentSpace/removeCardFromRemovedCards', card.id)
    },

    updateRemovedSpaces () {
      this.removedSpaces = cache.getAllRemovedSpaces()
      console.log('🌹', this.removedSpaces)
    },
    restoreSpace (space) {
    },
    showRemoveSpaceConfirmationVisible (space) {},
    isRemoveSpaceConfirmationVisible (space) {},
    hideRemoveSpaceConfirmationVisible () {},
    removeSpace (space) {}
  }
  // watch: {
  //   visible (visible) {
  //     if (visible) {
  //       // this.removedCards = this.$store.state.currentSpace.removedCards
  //     }
  //   }
  // }
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
