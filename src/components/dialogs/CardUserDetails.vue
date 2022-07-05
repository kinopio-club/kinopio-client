<template lang="pug">
.user-details-wrap(:style="position")
  UserDetails(:visible="visible" :user="cardCreatedByUser")
</template>

<script>
import UserDetails from '@/components/dialogs/UserDetails.vue'
import utils from '@/utils.js'

export default {
  name: 'CardUserDetails',
  components: {
    UserDetails
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs' && this.visible) {
        this.visible = ''
      }
    })
  },
  computed: {
    visible: {
      get () {
        return Boolean(this.cardId)
      },
      set (newValue) {
        this.$store.commit('cardUserDetailsIsVisibleForCardId', newValue)
      }
    },

    cardId () { return this.$store.state.cardUserDetailsIsVisibleForCardId },
    card () {
      if (!this.cardId) { return }
      return this.$store.getters['currentCards/byId'](this.cardId)
    },
    cardCreatedByUser () {
      if (!this.card) { return }
      // same as card.createdByUser
      const userId = this.card.userId
      let user = this.$store.getters['currentSpace/userById'](userId)
      if (!user) {
        user = {
          name: '',
          color: '#cdcdcd' // secondary-active-background
        }
      }
      this.scrollIntoView()
      return user
    },
    position () {
      if (!this.cardId) { return }
      const cardElement = document.querySelector(`article [data-card-id="${this.cardId}"]`)
      const element = cardElement.parentNode.querySelector('.user-badge')
      const rect = element.getBoundingClientRect()
      const zoom = this.$store.getters.spaceCounterZoomDecimal
      const x = (rect.x + window.scrollX) * zoom
      const y = (rect.y + rect.height + window.scrollY) * zoom
      return {
        left: `${x}px`,
        top: `${y}px`
      }
    }
  },
  methods: {
    scrollIntoView () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        const element = document.querySelector('dialog.user-details')
        utils.scrollIntoView(element)
      })
    }
  }
}
</script>

<style lang="stylus">
.user-details-wrap
  position absolute
</style>
