<template lang="pug">
dialog.add-to-inbox(v-if="visible" :open="visible" @touchstart.stop.prevent @touchend.stop.prevent @click.left.stop="closeDialogs" ref="dialog" :style="dialogStyles")
  AddToInbox(:visible="true")
  section(v-if="isLoading")
    Loader(:visible="true")
  section.card-list-section(v-if="isCards && !currentSpaceIsInbox" :style="{'max-height': resultsSectionHeight + 'px'}" ref="results")
    //- p blank slate, no cards
    CardList(
      :cards="cards"
      :primaryActionIsCardListOptions="primaryActionIsCardListOptions"
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
  data () {
    return {
      cards: [],
      isLoading: false,
      resultsSectionHeight: null,
      dialogHeight: null
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
    currentSpaceIsInbox () {
      return this.currentSpace.name === 'Inbox'
    },
    primaryActionIsCardListOptions () { return true },
    dialogStyles () {
      return { maxHeight: this.dialogHeight + 'px' }
    }
  },
  methods: {
    updateDialogHeight () {
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    },
    updateResultsSectionHeight () {
      this.$nextTick(() => {
        let element = this.$refs.results
        console.log(element)
        this.resultsSectionHeight = utils.elementHeight(element) - 2
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
      this.isLoading = true
      try {
        let space = await this.$store.dispatch('api/getInboxSpace')
        console.log(space)
        let cards = this.filterCards(space.cards)
        cards = this.sortCards(cards)
        this.cards = cards
      } catch (error) {
        console.error('🚒 updateInboxCards', error)
      }
      this.isLoading = false
    },
    closeDialogs () {
      this.$store.commit('cardListItemOptionsIsVisible', false)
    }
  },
  watch: {
    visible (value) {
      if (!value) { return }
      this.$store.commit('cardListItemOptionsCard', {})
      this.updateInboxCards()
    },
    cards (value) {
      if (!value.length) { return }
      if (this.currentSpaceIsInbox) { return }
      this.updateDialogHeight()
      this.updateResultsSectionHeight()
    }
  }
}

// qa anon user
// todo no cards
// todo dismissTips update user attr
// qa mobile
</script>

<style lang="stylus">
dialog.add-to-inbox
  width 210px
  // overflow hidden
  .card-list-section
    max-height 500px
    overflow auto
    border-top 1px solid black
    margin-top 4px
    padding 4px
</style>
