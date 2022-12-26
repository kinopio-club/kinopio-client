<template lang="pug">
dialog.add-to-inbox(v-if="visible" :open="visible" @touchstart.stop.prevent @touchend.stop.prevent @click.left.stop ref="dialog")
  AddToInbox(:visible="true")
  section(v-if="isLoading")
    Loader(:visible="true")
  section.card-list-section(v-if="isCards && !currentSpaceIsInbox")
    //- p blank slate, no cards
    AddToInboxCardOptions(:visible="addToInboxCardOptionsIsVisible" :card="addToInboxCardOptionsCard")
    CardList(
      :cards="cards"
      :secondaryActionLabel="secondaryActionLabel"
      @selectCard="moveCardToSpace"
      @secondaryAction="showCard"
    )
</template>

<script>
import AddToInboxCardOptions from '@/components/dialogs/AddToInboxCardOptions.vue'
import AddToInbox from '@/components/AddToInbox.vue'
import CardList from '@/components/CardList.vue'
import Loader from '@/components/Loader.vue'
import inboxSpace from '@/data/inbox.json'

import sortBy from 'lodash-es/sortBy'
import dayjs from 'dayjs'
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'AddToInboxDialog',
  components: {
    AddToInbox,
    Loader,
    CardList,
    AddToInboxCardOptions
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      cards: [],
      isLoading: false,
      addToInboxCardOptionsIsVisible: false,
      addToInboxCardOptionsCard: {}
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
    secondaryActionLabel () {
      return 'Move'
    }
  },
  methods: {
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
    moveCardToSpace (card) {
      console.log('🐸', card)
      // get center vp: half vp + scroll - ~halfcardwidthheight
      // api patch: update id w new card x,y, and spaceid
      // commit the card to state: currentCards/create
      // animate//highlight the card
    },
    showCard (card) {
      console.log('😅', card)
      // opens the inbox , then opens the card
    }
  },
  watch: {
    visible (value) {
      if (!value) { return }
      this.addToInboxCardOptionsIsVisible = false
      this.updateInboxCards()
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
  overflow hidden
  .card-list-section
    max-height 500px
    overflow auto
    border-top 1px solid black
    margin-top 4px
    padding 4px
</style>
