<template lang="pug">
dialog.add-to-inbox(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog" :style="dialogStyles")
  AddToInbox(:visible="userHasInbox")
  section(v-if="!userHasInbox")
    //- no inbox found
    template(v-if="currentUserIsSignedIn")
      p.badge.danger
        span Could not find Inbox space
      button(@click.left="updateInboxCards")
        img.refresh.icon(src="@/assets/refresh.svg")
    //- not signed in
    template(v-else)
      p.badge.info
        span Sign Up or In for quick access to your Inbox
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
  section.card-list-section(v-if="userHasInbox" ref="results")
    Loader(:visible="isLoading")
    template(v-if="isCards")
      CardList(
        :cards="cards"
        :primaryActionIsCardListOptions="true"
    )
</template>

<script>
import AddToInbox from '@/components/AddToInbox.vue'
import CardList from '@/components/CardList.vue'
import Loader from '@/components/Loader.vue'
import inboxSpace from '@/data/inbox.json'
import utils from '@/utils.js'

import sortBy from 'lodash-es/sortBy'
import dayjs from 'dayjs'
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'AddToInboxDialog',
  components: {
    AddToInbox,
    Loader,
    CardList
  },
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
  },
  data () {
    return {
      cards: [],
      isLoading: false,
      resultsSectionHeight: null,
      dialogHeight: null,
      userHasInbox: true
    }
  },
  computed: {
    ...mapState([
      'currentSpace'
    ]),
    ...mapGetters([
    ]),
    isCards () {
      return Boolean(this.cards.length)
    },
    dialogStyles () {
      return { maxHeight: this.dialogHeight + 'px' }
    },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
  },
  methods: {
    updateDialogHeight () {
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeightFromHeader(element)
      })
    },
    filterCards (cards) {
      const defaultCards = inboxSpace.cards.map(card => card.name)
      cards = cards.filter(card => {
        return !defaultCards.includes(card.name)
      })
      cards.reverse()
      return cards
    },
    sortCards (cards) {
      cards = sortBy(cards, card => dayjs(card.nameUpdatedAt || card.updatedAt).valueOf())
      cards.reverse()
      return cards
    },
    async updateInboxCards () {
      if (!this.cards.length) {
        this.isLoading = true
      }
      try {
        if (!this.currentUserIsSignedIn) {
          this.userHasInbox = false
          return
        }
        const space = await this.$store.dispatch('currentUser/inboxSpace')
        let cards = this.filterCards(space.cards)
        cards = this.sortCards(cards)
        this.cards = cards
        this.userHasInbox = true
      } catch (error) {
        console.error('🚒 updateInboxCards', error)
        this.userHasInbox = false
      }
      this.isLoading = false
    },
    closeDialogs () {
      this.$store.commit('cardListItemOptionsIsVisible', false)
    },
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerSignUpOrInIsVisible')
    }
  },
  watch: {
    visible (value) {
      if (!value) {
        this.resultsSectionHeight = null
        this.dialogHeight = null
        return
      }
      this.$store.commit('cardListItemOptionsCard', {})
      this.updateInboxCards()
    },
    cards (value) {
      if (!value.length) { return }
      this.$nextTick(() => {
        this.updateDialogHeight()
      })
    }
  }
}

</script>

<style lang="stylus">
dialog.add-to-inbox
  width 210px
  overflow auto
  .card-list-section
    border-top 1px solid black
    margin-top 4px
    padding 4px
</style>
