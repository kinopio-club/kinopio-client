<template lang="pug">
dialog.removed(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    .segmented-buttons
      button(@click.left="showCards" :class="{active: cardsVisible}")
        img.icon(src="@/assets/remove.svg")
        span Cards in this Space
      button(@click.left="showSpaces" :class="{active: !cardsVisible}")
        img.icon(src="@/assets/remove.svg")
        span Spaces

  section(v-if="!items.length")
    .row(v-if="isLoading")
      Loader(:visible="loading.cards || loading.spaces")
    template(v-if="cardsVisible")
      p Removed cards from {{currentSpaceName}} can be restored here
      p(v-if="!currentUserCanEditSpace")
        span.badge.info
          PrivacyIcon(:privacy="currentSpace.privacy" :closedIsNotVisible="true")
          span You need to be a collaborator
    template(v-if="!cardsVisible")
      p Removed spaces can be restored here

  section.results-section(v-if="items.length" ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    section.results-actions
      .row(v-if="isLoading")
        Loader(:visible="loading.cards || loading.spaces")
      button(@click="toggleDeleteAllConfirmationIsVisible" v-if="!deleteAllConfirmationIsVisible")
        img.icon(src="@/assets/remove.svg")
        span Delete All
      template(v-if="deleteAllConfirmationIsVisible")
        p
          span Permanently delete all removed {{cardsOrSpacesLabel}} and uploads?
        .segmented-buttons
          button(@click.left.stop="toggleDeleteAllConfirmationIsVisible")
            img.icon.cancel(src="@/assets/add.svg")
            span Cancel
          button.danger(@click.left.stop="deleteAllPermanent")
            img.icon(src="@/assets/remove.svg")
            span Delete All

    ul.results-list
      template(v-for="item in items" :key="item.id")
        li(@click.left="restore(item)" tabindex="0" v-on:keyup.enter="restore(item)")
          .badge
            img.undo.icon(src="@/assets/undo.svg")
          .name {{item.name}}
          button(v-if="!isRemoveConfirmationVisible(item)" @click.left.stop="showRemoveConfirmation(item)")
            img.icon(src="@/assets/remove.svg")

          .remove-confirmation(v-if="isRemoveConfirmationVisible(item)")
            p Permanently delete?
            .segmented-buttons
              button(@click.left.stop="hideRemoveConfirmation")
                img.icon.cancel(src="@/assets/add.svg")
              button.danger(@click.left.stop="deletePermanent(item)")
                img.icon(src="@/assets/remove.svg")
                span Delete
</template>

<script>
import merge from 'lodash-es/merge'

import scrollIntoView from '@/scroll-into-view.js'
import cache from '@/cache.js'
import Loader from '@/components/Loader.vue'
import PrivacyIcon from '@/components/PrivacyIcon.vue'
import utils from '@/utils.js'

export default {
  name: 'Removed',
  components: {
    Loader,
    PrivacyIcon
  },
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
        this.updateResultsSectionHeight()
      }
    })
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
      },
      resultsSectionHeight: null,
      dialogHeight: null,
      deleteAllConfirmationIsVisible: false
    }
  },
  computed: {
    isLoading () {
      return this.loading.cards || this.loading.spaces
    },
    removedCardsWithName () {
      return this.removedCards.filter(card => card.name)
    },
    cardsOrSpacesLabel () {
      if (this.cardsVisible) {
        return 'cards'
      } else {
        return 'spaces'
      }
    },
    items () {
      let items = []
      if (this.cardsVisible && !this.currentUserCanEditSpace) {
        items = []
      } else if (this.cardsVisible) {
        items = this.removedCardsWithName
      } else {
        items = this.removedSpaces
      }
      items = items.filter(item => Boolean(item))
      return items
    },
    currentSpace () { return this.$store.state.currentSpace },
    currentSpaceName () { return this.currentSpace.name },
    currentUserCanEditSpace () {
      return this.$store.getters['currentUser/canEditSpace']()
    }
  },
  methods: {
    toggleDeleteAllConfirmationIsVisible () {
      this.deleteAllConfirmationIsVisible = !this.deleteAllConfirmationIsVisible
    },
    scrollIntoView (card) {
      const element = document.querySelector(`article [data-card-id="${card.id}"]`)
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
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
    deletePermanent (item) {
      if (this.cardsVisible) {
        this.deleteCard(item)
      } else {
        this.deleteSpace(item)
      }
    },
    deleteAllPermanent () {
      if (this.cardsVisible) {
        this.deleteAllCardsPermanent()
      } else {
        this.deleteAllSpacesPermanent()
      }
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeightFromHeader(element)
      })
    },
    updateResultsSectionHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeightFromHeader(element, true)
      })
    },

    // Cards

    showCards () {
      this.cardsVisible = true
      this.deleteAllConfirmationIsVisible = false
      this.updateRemovedCards()
    },
    updateLocalRemovedCards () {
      this.removedCards = this.$store.state.currentCards.removedCards
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
      if (!utils.arrayExists(remoteCards)) { return }
      this.removedCards = remoteCards
      this.$store.commit('currentCards/removedCards', remoteCards)
    },
    restoreCard (card) {
      this.$store.dispatch('currentCards/restoreRemoved', card)
      this.$nextTick(() => {
        this.scrollIntoView(card)
      })
      this.updateLocalRemovedCards()
    },
    deleteCard (card) {
      this.$store.dispatch('currentCards/deleteCard', card)
      this.updateLocalRemovedCards()
    },
    deleteAllCardsPermanent () {
      this.$store.dispatch('currentCards/deleteAllRemoved')
      this.updateLocalRemovedCards()
    },

    // Spaces

    showSpaces () {
      this.cardsVisible = false
      this.deleteAllConfirmationIsVisible = false
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
        const localSpace = this.removedSpaces.find(local => {
          if (local) {
            return local.id === remote.id
          }
        })
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
    deleteSpace (space) {
      this.$store.dispatch('currentSpace/deleteSpace', space)
      this.updateLocalRemovedSpaces()
    },
    deleteAllSpacesPermanent () {
      this.$store.dispatch('currentSpace/deleteAllRemovedSpacesPermanent')
      this.updateLocalRemovedSpaces()
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.deleteAllConfirmationIsVisible = false
        this.updateRemovedCards()
        this.updateRemovedSpaces()
        this.updateDialogHeight()
        this.updateResultsSectionHeight()
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
  .results-actions
    padding 4px
</style>
