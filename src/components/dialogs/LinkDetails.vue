<template lang="pug">
dialog.link-details.narrow(v-if="isVisible" :open="isVisible" :style="styles" ref="dialog")
  section.edit-card(v-if="showEditCard")
    button(@click="showCardDetails(null)") Edit Card
  section
    .container-wrap(v-if="space.url")
      .background-wrap(@click.left.stop="changeSpace" @keyup.enter.prevent="changeSpace")
        a(:href="space.url")
          BackgroundPreview(:space="space" :isButton="true" :buttonIsActive="linkIsCurrentSpace")
      .meta-wrap
        a(:href="space.url")
          button.variable-length-content(@click.prevent="changeSpace" v-on:keyup.enter.prevent="changeSpace" :class="{active: linkIsCurrentSpace}")
            MoonPhase(v-if="space.moonPhase" :moonPhase="space.moonPhase")
            span {{space.name}} →

    template(v-if="isSpace")
      .row.badges-wrap(v-if="space.isLoadingOrInvalid")
        .badge.danger Space is loading, invalid, or private
          img.icon.private(src="@/assets/lock.svg")

      .row.badges-wrap(v-else-if="!space.isLoadingOrInvalid")
        UserList(:users="users" :isClickable="false")

    .badges-wrap(v-if="isSpace && !space.isLoadingOrInvalid")
      .badge.info.inline-badge(v-if="spaceIsTemplate") Template
      .badge.secondary.button-badge(@click="toggleFilterShowAbsoluteDate")
        img.icon.time(src="@/assets/time.svg")
        span.name {{dateUpdatedAt}}

    template(v-if="isSpace && !space.isLoadingOrInvalid")
      p
        Loader(:visible="loading")
        textarea(v-if="cardsText") {{cardsText}}
</template>

<script>
import User from '@/components/User.vue'
import UserList from '@/components/UserList.vue'
import MoonPhase from '@/components/MoonPhase.vue'
import BackgroundPreview from '@/components/BackgroundPreview.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'
import templates from '@/data/templates.js'

import join from 'lodash-es/join'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

export default {
  name: 'LinkDetails',
  components: {
    User,
    UserList,
    Loader,
    MoonPhase,
    BackgroundPreview
  },
  props: {
    visible: Boolean,
    position: Object,
    link: Object
  },
  data () {
    return {
      showAbsoluteDate: false,
      loading: true,
      cardsText: '',
      users: [],
      remoteSpaceId: ''
    }
  },
  computed: {
    isVisible () {
      return this.visible || this.$store.state.linkDetailsIsVisible
    },
    currentLink () { // cardId, isLink, name, space: { background, id , moonPhase, name, url, users[0] }
      return this.link || this.$store.state.currentSelectedLink
    },
    space () { return this.currentLink.space },
    isSpace () { return utils.objectHasKeys(this.currentLink.space) },
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal },
    pinchCounterZoomDecimal () { return this.$store.state.pinchCounterZoomDecimal },
    styles () {
      const position = this.position || this.$store.state.linkDetailsPosition
      const isChildDialog = this.cardDetailsIsVisibleForCardId
      let zoom = this.$store.getters.spaceZoomDecimal
      if (isChildDialog) {
        zoom = 1
      }
      const x = zoom * position.x
      const y = zoom * position.y
      let scale
      if (utils.isSignificantlyPinchZoomed()) {
        scale = this.pinchCounterZoomDecimal
      }
      return {
        left: `${x}px`,
        top: `${y}px`,
        transform: `scale(${scale})`
      }
    },
    url () {
      const url = this.space.url
      if (url) {
        return `${utils.kinopioDomain()}/${url}`
      } else {
        return this.currentLink.name
      }
    },
    cardDetailsIsVisibleForCardId () { return this.$store.state.cardDetailsIsVisibleForCardId },
    showEditCard () { return !this.cardDetailsIsVisibleForCardId },
    canNativeShare () { return Boolean(navigator.share) },
    currentCard () {
      let currentCardId = this.cardDetailsIsVisibleForCardId
      const currentCard = this.$store.getters['currentCards/byId'](currentCardId)
      const linkCard = this.$store.getters['currentCards/byId'](this.$store.state.currentSelectedLink.cardId)
      return currentCard || linkCard
    },
    currentSpaceId () { return this.$store.state.currentSpace.id },
    linkIsCurrentSpace () { return this.space.id === this.currentSpaceId },
    dateUpdatedAt () {
      const date = this.space.updatedAt
      if (this.showAbsoluteDate) {
        return new Date(date).toLocaleString()
      } else {
        return dayjs(date).fromNow()
      }
    },
    spaceIsTemplate () {
      const templateSpaceIds = templates.spaces().map(template => template.id)
      return templateSpaceIds.includes(this.space.id)
    }
  },
  methods: {
    async getRemoteSpace () {
      this.loading = true
      const remoteSpace = await this.$store.dispatch('api/getSpace', { space: this.space, shouldRequestRemote: true })
      this.remoteSpaceId = remoteSpace.id
      this.loading = false
      return remoteSpace
    },
    async getCardsTextAndCollaboratorsFromRemoteSpace () {
      if (!this.isSpace) { return }
      const remoteSpace = await this.getRemoteSpace()
      remoteSpace.collaborators.forEach(user => this.users.push(user))
      let text = remoteSpace.cards.map(card => { return card.name })
      text = join(text, '\n')
      this.cardsText = text
      this.scrollIntoView()
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
        this.$store.dispatch('closeAllDialogs')
        this.$store.dispatch('currentCards/showCardDetails', cardId)
      }
    },
    changeSpace () {
      if (this.space.id) {
        this.$store.dispatch('currentSpace/changeSpace', { space: this.space, isRemote: true })
        this.$store.dispatch('closeAllDialogs')
      } else {
        window.location.href = this.space.url
      }
    },
    scrollIntoView () {
      this.$nextTick(() => {
        const element = this.$refs.dialog
        utils.scrollIntoView(element)
      })
    },
    toggleFilterShowAbsoluteDate () {
      this.showAbsoluteDate = !this.showAbsoluteDate
    },
    updateSpaceUser () {
      if (!this.isSpace) { return }
      this.users.push(this.space.users[0])
    },
    checkIfShouldRequestSpace () {
      if (!this.isSpace || this.space.isLoadingOrInvalid) { return }
      return this.remoteSpaceId !== this.space.id
    },
    updatePinchCounterZoomDecimal () {
      this.$store.commit('pinchCounterZoomDecimal', utils.pinchCounterZoomDecimal())
    }
  },
  watch: {
    isVisible (visible) {
      if (visible) {
        this.updatePinchCounterZoomDecimal()
        const shouldRequestSpace = this.checkIfShouldRequestSpace()
        if (!shouldRequestSpace) {
          this.scrollIntoView()
          return
        }
        this.users = []
        this.cardsText = ''
        this.updateSpaceUser()
        this.getCardsTextAndCollaboratorsFromRemoteSpace()
      }
    }
  }
}
</script>

<style lang="stylus">
.link-details
  cursor auto
  transform-origin top left
  section.edit-card
    background-color var(--secondary-background)
  button
    span
      word-break break-word
  .container-wrap + .badges-wrap
    margin-top 6px
  .container-wrap
    display flex
    align-items flex-start
  .secondary
    background-color var(--secondary-background)
  .badges-wrap
    display flex
    .user-list
      display flex
      flex-wrap wrap
  textarea
    background-color var(--secondary-background)
    border 0
    border-radius var(--small-entity-radius)
    padding 4px
    margin-bottom 0
    height 100px !important
    overflow scroll
  .background-wrap
    max-width 30%
    margin-right 6px
  .icon.private
    margin-left 6px
</style>
