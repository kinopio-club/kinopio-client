<template lang="pug">
dialog.narrow.user-notifications(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight -50 + 'px'}")
  section
    p
      span.badge.info(v-if="unreadCount") {{unreadCount}}
      span(v-else) {{unreadCount}}{{' '}}
      span Notifications
      Loader(:visible="loading")

  section.results-section(v-if="notifications.length" :style="{'max-height': dialogHeight + 'px'}")
    p(v-if="!loading && !notifications.length")
      span Cards added to your spaces by collaborators can be found here
    ul.results-list(v-if="notifications.length")
      template(v-for="notification in notifications")
        li(@click="click(notification)" :class="{ active: isActive(notification), 'add-favorite-user': notification.type === 'addFavoriteUser' }" :data-notification-id="notification.id")
          //- message
          .row(:class="{ 'row-align-items-start': notification.type === 'askToAddToExplore' }")
            span.badge.info.new-unread-badge(v-if="!notification.isRead")
            img.icon.add(v-if="notification.iconClass === 'add'" src="@/assets/add.svg")
            img.icon.heart(v-if="notification.iconClass === 'heart'" src="@/assets/heart.svg")
            img.icon.sunglasses(v-if="notification.iconClass === 'sunglasses'" src="@/assets/sunglasses.svg")
            span {{notification.message}}

          //- meta
          .row.row-align-items-start
            //- user
            .user-wrap
              UserLabelInline(:user="notification.user")
            //- space
            .space-name-wrap.badge.secondary(v-if="notification.spaceId" :data-space-id="notification.spaceId" @click="changeSpace(notification.spaceId)" :class="{ active: spaceIsCurrentSpace(notification.spaceId) }")
              BackgroundPreview(v-if="notification.space" :space="notification.space")
              span.space-name {{notification.space.name}}

          //- p

            //- img.icon.sunglasses(src="@/assets/sunglasses.svg" v-if="isAskToAddToExplore(notification)")
            //- template(v-if="isAskToAddToExplore(notification)")
            //-   span asked to add
            //-   span.badge.space-badge
            //-     span {{notification.space.name}}
            //-   span to Explore

          //- cardname
          .notification-info(v-if="isCard(notification)")
            //- img.icon(src="@/assets/add.svg")
            template(v-for="segment in cardNameSegments(notification.card.name)")
              img.card-image(v-if="segment.isImage" :src="segment.url")
              NameSegment(:segment="segment")

</template>

<script>
import Loader from '@/components/Loader.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import NameSegment from '@/components/NameSegment.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'
import BackgroundPreview from '@/components/BackgroundPreview.vue'

export default {
  name: 'UserNotifications',
  components: {
    Loader,
    UserLabelInline,
    NameSegment,
    BackgroundPreview
  },
  props: {
    visible: Boolean,
    loading: Boolean,
    notifications: Array,
    unreadCount: Number
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
      dialogHeight: null
    }
  },
  computed: {
    currentSpaceId () { return this.$store.state.currentSpace.id },
    currentUser () { return this.$store.state.currentUser }
  },
  methods: {
    isAskToAddToExplore (notification) {
      return notification.type === 'askToAddToExplore'
    },
    isCard (notification) {
      return notification.type === 'createCard' || notification.type === 'updateCard'
    },
    isActive (notification) {
      const isCard = this.isCard(notification)
      const isAskToAddToExplore = this.isAskToAddToExplore(notification)
      if (isCard) {
        return this.cardDetailsIsVisible(notification.card.id)
      } else if (isAskToAddToExplore) {
        return this.spaceIsCurrentSpace(notification.spaceId)
      }
    },
    click (notification) {
      const isCard = this.isCard(notification)
      const isAskToAddToExplore = this.isAskToAddToExplore(notification)
      if (isCard) {
        this.showCardDetails(notification)
      } else if (isAskToAddToExplore) {
        this.changeSpace(notification.spaceId)
      }
    },
    cardDetailsIsVisible (cardId) {
      return this.$store.state.cardDetailsIsVisibleForCardId === cardId
    },
    spaceIsCurrentSpace (spaceId) {
      return spaceId === this.currentSpaceId
    },
    changeSpace (spaceId) {
      if (this.spaceIsCurrentSpace(spaceId)) { return }
      const space = { id: spaceId }
      this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
    },
    segmentTagColor (segment) {
      const spaceTag = this.$store.getters['currentSpace/tagByName'](segment.name)
      const cachedTag = cache.tagByName(segment.name)
      if (spaceTag) {
        return spaceTag.color
      } else if (cachedTag) {
        return cachedTag.color
      } else {
        return this.currentUser.color
      }
    },
    cardNameSegments (name) {
      let url = utils.urlFromString(name)
      let imageUrl
      if (utils.urlIsImage(url)) {
        imageUrl = url
        name = name.replace(url, '')
      }
      let segments = utils.cardNameSegments(name)
      if (imageUrl) {
        segments.unshift({
          isImage: true,
          url: imageUrl
        })
      }
      return segments.map(segment => {
        if (!segment.isTag) { return segment }
        segment.color = this.segmentTagColor(segment)
        return segment
      })
    },
    markAllAsRead () {
      this.$emit('markAllAsRead')
    },
    showCardDetails (notification) {
      let space = utils.clone(notification.space)
      const card = utils.clone(notification.card)
      if (this.currentSpaceId !== space.id) {
        this.$store.commit('loadSpaceShowDetailsForCardId', card.id)
        this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
      } else {
        this.$store.dispatch('currentCards/showCardDetails', card.id)
      }
      this.$emit('markAsRead', notification.id)
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    },
    userColor (notification) {
      if (notification.user) {
        return notification.user.color
      }
    },
    userName (notification) {
      if (notification.user) {
        return notification.user.name
      }
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
        this.$emit('updateNotifications')
      }
      if (!visible) {
        this.markAllAsRead()
      }
    },
    loading (loading) {
      this.updateDialogHeight()
    }
  }
}
</script>

<style lang="stylus">
.user-notifications
  top calc(100% - 8px)
  left initial
  right 8px
  max-height calc(100vh - 25px)
  overflow auto
  section
    width 100%
  .results-section
    border-top 1px solid var(--primary-border)
    padding-top 4px
    li
      display block
  .notification-info
    margin-top 4px
    .button-badge
      box-shadow none
      &:hover,
      &:active
        box-shadow none
  .space-badge
    background-color var(--secondary-background)
  span + .space-badge
    margin-left 4px

  .background-preview
    .preview-wrap
      vertical-align -2px
      width 14px
      height 14px
      border-radius var(--small-entity-radius)

  .card-image
    width 48px
    vertical-align middle
    border-radius var(--small-entity-radius)
  .icon + .card-image
  .card-image + span
    margin-left 5px
  .loader
    width 14px
    height 14px
    vertical-align -3px
    margin-left 6px
  .sunglasses
    vertical-align -2px

  .results-list
    hr:first-child
      display none
    hr
      margin 4px 0
      margin-left -4px
      width calc(100% + 8px)
    .tag
      display inline-block
      margin-right 0
  .space-name-wrap
    display flex
    // flex-shrink 10
    margin-right 0
    .space-name
      white-space nowrap
      overflow hidden
      text-overflow ellipsis
  .user-wrap
    max-width 40%
    .user-label-inline
      max-width 94%
      white-space nowrap
      overflow hidden
      text-overflow ellipsis
  .row-align-items-start
    align-items flex-start !important
    .sunglasses
      margin-top 2px

  .inline-badge
    vertical-align 0

  // notification types

  li.add-favorite-user
    .user-wrap
      max-width initial
      .user-label-inline
        max-width initial

</style>
