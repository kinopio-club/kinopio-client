<template lang="pug">
dialog.link-details.narrow(v-if="isVisible" :open="isVisible" :style="dialogPosition" ref="dialog")
  section.edit-card(v-if="showEditCard")
    button(@click="showCardDetails(null)") Edit Card
  section
    .container-wrap
      .background-wrap(v-if="space.background")
        img.background(:src="space.background" @click="changeSpace" v-on:keyup.enter="changeSpace")
      .meta-wrap
        a(v-if="space.url" :href="space.url")
          button(@click.prevent="changeSpace" v-on:keyup.enter.prevent="changeSpace")
            MoonPhase(v-if="space.moonPhase" :moonPhase="space.moonPhase")
            span {{space.name}} →

        template(v-if="isSpace")
          .row.badge-wrap(v-if="space.isLoadingOrInvalid")
            .badge.danger Space is loading or invalid
          .row.badge-wrap(v-if="!space.isLoadingOrInvalid")
            UserList(:users="space.users" :isClickable="false")
        template(v-if="!isSpace")
          .badge.danger Space is loading or invalid

    .row
      .badge.secondary.button-badge(@click="toggleFilterShowAbsoluteDate")
        img.icon.time(src="@/assets/time.svg")
        span.name {{dateUpdatedAt}}

  section
    .row
      input.url-textarea(ref="url" v-model="url")
    .row
      button(@click.left="copyUrl" v-if="!canNativeShare")
        span Copy Url
      .segmented-buttons(v-if="canNativeShare")
        button(@click.left="copyUrl")
          span Copy Url
        button(@click.left="shareUrl")
          img.icon(src="@/assets/share.svg")
    .row(v-if="urlIsCopied")
      .badge.success.success-message Url Copied

</template>

<script>
import User from '@/components/User.vue'
import UserList from '@/components/UserList.vue'
import scrollIntoView from '@/scroll-into-view.js'
import utils from '@/utils.js'
import cache from '@/cache.js'

import fromNow from 'fromnow'

export default {
  name: 'LinkDetails',
  components: {
    User,
    UserList
  },
  props: {
    visible: Boolean,
    position: Object,
    link: Object
  },
  data () {
    return {
      urlIsCopied: false,
      showAbsoluteDate: false
    }
  },
  computed: {
    isVisible () {
      return this.visible || this.$store.state.linkDetailsIsVisible
    },
    currentLink () { // cardId, isLink, name, space: { background, id , moonPhase, name, url, users[0] }
      return this.link || this.$store.state.currentSelectedLink
    },
    spaceUser () { return this.currentLink.space.users[0] },
    space () { return this.currentLink.space },
    isSpace () { return utils.objectHasKeys(this.currentLink.space) },
    dialogPosition () {
      const position = this.position || this.$store.state.linkDetailsPosition
      return {
        left: `${position.x}px`,
        top: `${position.y}px`
      }
    },
    url () {
      const url = this.space.url
      if (url) {
        return `${utils.kinopioDomain()}/${url}`
      } else {
        console.log(this.link)
        return this.currentLink.name
      }
    },
    cardDetailsIsVisibleForCardId () { return this.$store.state.cardDetailsIsVisibleForCardId },
    showEditCard () { return !this.cardDetailsIsVisibleForCardId },
    canNativeShare () { return Boolean(navigator.share) },
    currentCard () {
      let currentCardId = this.cardDetailsIsVisibleForCardId
      const currentCard = this.$store.getters['currentSpace/cardById'](currentCardId)
      const linkCard = this.$store.getters['currentSpace/cardById'](this.$store.state.currentSelectedLink.cardId)
      return currentCard || linkCard
    },
    currentSpaceId () { return this.$store.state.currentSpace.id },
    dateUpdatedAt () {
      const date = this.space.updatedAt
      if (this.showAbsoluteDate) {
        return new Date(date).toLocaleString()
      } else {
        return fromNow(date, { max: 1, suffix: true })
      }
    }
  },
  methods: {
    copyUrl () {
      const element = this.$refs.url
      element.select()
      element.setSelectionRange(0, 99999) // for mobile
      document.execCommand('copy')
      this.urlIsCopied = true
    },
    shareUrl () {
      const data = {
        title: 'Kinopio Space',
        text: this.space.name,
        url: this.url
      }
      navigator.share(data)
    },
    showCardDetails (card) {
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
    changeSpace () {
      this.$store.dispatch('currentSpace/changeSpace', { space: this.space })
      this.$store.dispatch('closeAllDialogs', 'linkDetails.changeSpace')
    },
    scrollIntoView () {
      if (this.hasProps) { return }
      const element = this.$refs.dialog
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
    },
    toggleFilterShowAbsoluteDate () {
      this.showAbsoluteDate = !this.showAbsoluteDate
    }

  },
  watch: {
    isVisible (visible) {
      if (visible) {
        this.urlIsCopied = false
        console.log(this.currentLink, this.currentLink.space, this.space.background)
      }
      this.$nextTick(() => {
        if (visible) {
          this.scrollIntoView()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
.link-details
  cursor auto
  section.edit-card
    background-color var(--secondary-background)
  button
    span
      word-break break-word
  .badge-wrap
    margin-top 6px

  .container-wrap
    display flex
  .background-wrap
    width 30%
    margin-right 6px
  .background
    width 100%
    border-radius 3px
    cursor pointer
    &:hover
      box-shadow var(--button-hover-shadow)
      background var(--secondary-hover-background)
    &:active
      box-shadow var(--button-active-inset-shadow)
      background var(--secondary-active-background)
</style>
