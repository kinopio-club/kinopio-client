<template lang="pug">
dialog.link-details.narrow(v-if="isVisible" :open="isVisible" :style="dialogPosition" ref="dialog")
  section.edit-card(v-if="cardDetailsIsVisibleForCardId")
    button(@click="showCardDetails(null)") Edit Card
  section
    img.background(v-if="space.background" src="space.background")
    a(:href="space.url")
      button(@click.prevent.stop)
        MoonPhase(v-if="space.moonPhase" :moonPhase="space.moonPhase")
        span {{space.name}} →

    .row.badge-wrap(v-if="space.isLoadingOrInvalid")
      .badge.danger Space is loading or invalid
    .row.badge-wrap(v-if="!space.isLoadingOrInvalid")
      UserList(:users="space.users" :isClickable="false")

  section
    .row
      input.url-textarea(ref="url" v-model="url")
    button(@click.left="copyUrl" v-if="!canNativeShare")
      span Copy Url
    .segmented-buttons(v-if="canNativeShare")
      button(@click.left="copyUrl")
        span Copy Url
      button(@click.left="shareUrl")
        img.icon(src="@/assets/share.svg")

</template>

<script>
import User from '@/components/User.vue'
import UserList from '@/components/UserList.vue'
import scrollIntoView from '@/scroll-into-view.js'
import utils from '@/utils.js'
import cache from '@/cache.js'

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
      urlIsCopied: false
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
    dialogPosition () {
      const position = this.position || this.$store.state.linkDetailsPosition
      return {
        left: `${position.x}px`,
        top: `${position.y}px`
      }
    },
    url () { return `${utils.kinopioDomain()}/${this.space.url}` },
    cardDetailsIsVisibleForCardId () { return this.$store.state.cardDetailsIsVisibleForCardId },
    canNativeShare () { return Boolean(navigator.share) }
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
    scrollIntoView () {
      if (this.hasProps) { return }
      const element = this.$refs.dialog
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
    }
  },
  watch: {
    isVisible (visible) {
      if (visible) {
        this.urlIsCopied = false
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
</style>
