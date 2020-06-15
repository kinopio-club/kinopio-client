<template lang="pug">
dialog.removed(v-if="visible" :open="visible" @click.stop)
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
    template(v-if="cardsVisible")
      p Removed cards from
        span !{' '}{{currentSpaceName}}!{' '}
        span can be restored here
      p(v-if="!currentUserCanEditSpace")
        span.badge.info
          img.icon(:src="privacyIcon" :class="privacyName")
          span You need to be a collaborator
    template(v-if="!cardsVisible")
      p Removed spaces can be restored here

  section.results-section(v-if="items.length")
    .button-wrap
      button(v-if="!removeAllConfirmationIsVisible" @click.stop="showRemoveAllConfirmation")
        img.icon(src="@/assets/remove.svg")
        span Remove All
      .remove-confirmation(v-if="removeAllConfirmationIsVisible")
        p Permanently remove all removed {{removeAllTypeLabel}}?
        .segmented-buttons
          button(@click.stop="hideRemoveAllConfirmation")
            span Cancel
          button.danger(@click.stop="removeAllPermanent")
            img.icon(src="@/assets/remove.svg")
            span Remove All

    ul.results-list
      template(v-for="(item in items")
        li(:key="item.id" @click="restore(item)" tabindex="0" v-on:keyup.enter="restore(item)")
          .badge
            img.undo.icon(src="@/assets/undo.svg")
          .name {{item.name}}
          button(v-if="!isRemoveConfirmationVisible(item)" @click.stop="showRemoveConfirmation(item)")
            img.icon(src="@/assets/remove.svg")

          .remove-confirmation(v-if="isRemoveConfirmationVisible(item)")
            p Permanently remove?
            .segmented-buttons
              button(@click.stop="hideRemoveConfirmation")
                span Cancel
              button.danger(@click.stop="removePermanent(item)")
                img.icon(src="@/assets/remove.svg")
                span Remove
</template>

<script>
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfill
import merge from 'lodash-es/merge'

import cache from '@/cache.js'
import Loader from '@/components/Loader.vue'
import privacy from '@/spaces/privacy.js'
import utils from '@/utils.js'

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
      removeAllConfirmationIsVisible: false,
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
    },
    removeAllTypeLabel () {
      if (this.cardsVisible) {
        return 'cards'
      } else {
        return 'spaces'
      }
    },
    currentUserCanEditSpace () {
      return this.$store.getters['currentUser/canEditSpace']()
    },
    privacyIcon () {
      const space = this.$store.state.currentSpace
      const privacyState = privacy.states().find(state => {
        return state.name === space.privacy
      })
      if (!privacyState) { return }
      return require(`@/assets/${privacyState.icon}.svg`)
    },
    privacyName () {
      const space = this.$store.state.currentSpace
      const privacyState = privacy.states().find(state => {
        return state.name === space.privacy
      })
      if (!privacyState) { return }
      return privacyState.name
    }
  },
  methods: {
    showRemoveAllConfirmation () {
      this.removeAllConfirmationIsVisible = true
    },
    hideRemoveAllConfirmation () {
      this.removeAllConfirmationIsVisible = false
    },
    removeAllPermanent () {
      if (this.cardsVisible) {
        this.removeAllCardsPermanent()
      } else {
        this.removeAllSpacesPermanent()
      }
      this.hideRemoveAllConfirmation()
    },
    scrollIntoView (card) {
      const element = document.querySelector(`article [data-card-id="${card.id}"]`)
      scrollIntoView(element, {
        behavior: 'smooth',
        scrollMode: 'if-needed'
      })
    },
    restore (item) {
      if (this.cardsVisible) {
        this.restoreCard(item)
      } else {
        this.restoreSpace(item)
      }
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
    removePermanent (item) {
      if (this.cardsVisible) {
        this.removeCardPermanent(item)
      } else {
        this.removeSpacePermanent(item)
      }
    },

    // Cards

    showCards () {
      this.cardsVisible = true
      this.updateRemovedCards()
    },
    updateLocalRemovedCards () {
      this.removedCards = this.$store.state.currentSpace.removedCards
    },
    updateRemovedCards () {
      this.updateLocalRemovedCards()
      this.loadRemoteRemovedCards()
    },
    async loadRemoteRemovedCards () {
      if (!this.currentUserCanEditSpace) { return }
      this.loading.cards = true
      const space = this.$store.state.currentSpace
      const remoteCards = await this.$store.dispatch('api/getSpaceRemovedCards', space)
      this.loading.cards = false
      const remoteCardsIsArray = utils.typeCheck(remoteCards, 'array')
      if (!remoteCards || !remoteCardsIsArray) { return }
      this.removedCards = remoteCards
      this.$store.commit('currentSpace/removedCards', remoteCards)
    },
    restoreCard (card) {
      this.$store.dispatch('currentSpace/restoreRemovedCard', card)
      this.$nextTick(() => {
        this.scrollIntoView(card)
      })
      this.updateLocalRemovedCards()
    },
    removeCardPermanent (card) {
      this.$store.dispatch('currentSpace/removeCardPermanent', card)
      this.updateLocalRemovedCards()
    },
    removeAllCardsPermanent () {
      this.$store.dispatch('currentSpace/removeAllRemovedCardsPermanent')
      this.updateLocalRemovedCards()
    },

    // Spaces

    showSpaces () {
      this.cardsVisible = false
      this.updateRemovedSpaces()
    },
    updateLocalRemovedSpaces () {
      this.removedSpaces = cache.getAllRemovedSpaces()
    },
    updateRemovedSpaces () {
      this.updateLocalRemovedSpaces()
      this.loadRemoteRemovedSpaces()
    },
    async loadRemoteRemovedSpaces () {
      let removedSpaces
      this.loading.spaces = true
      removedSpaces = await this.$store.dispatch('api/getUserRemovedSpaces')
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
    restoreSpace (space) {
      this.$store.dispatch('currentSpace/restoreRemovedSpace', space)
      this.updateLocalRemovedSpaces()
    },
    removeSpacePermanent (space) {
      this.$store.dispatch('currentSpace/removeSpacePermanent', space)
      this.updateLocalRemovedSpaces()
    },
    removeAllSpacesPermanent () {
      this.$store.dispatch('currentSpace/removeAllRemovedSpacesPermanent')
      this.updateLocalRemovedSpaces()
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateRemovedCards()
        this.updateRemovedSpaces()
        this.removeAllConfirmationIsVisible = false
      }
    }
  }
}
</script>

<style lang="stylus">
.removed
  overflow auto
  .results-section
    max-height initial
    border-top 1px solid var(--primary)
    padding-top 4px
    .button-wrap
      margin-left 4px
      margin-top 4px
      margin-bottom 8px
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
