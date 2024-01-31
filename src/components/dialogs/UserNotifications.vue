<template lang="pug">
dialog.narrow.user-notifications(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight -50 + 'px'}")
  section
    p
      span Notifications
      Loader(:visible="loading")
    OfflineBadge
  section.results-section(v-if="filteredNotifications.length" :style="{'max-height': dialogHeight + 'px'}")
    p(v-if="!loading && !filteredNotifications.length")
      span Cards added to your spaces by collaborators can be found here
    ul.results-list(v-if="filteredNotifications.length")
      template(v-for="notification in filteredNotifications")
        //- TODO wrap in <a> for middle click
        a(:href="spaceUrl(notification)")
          li(@click.stop.prevent="primaryAction(notification)" :class="{ active: isCurrentSpace(notification.spaceId) }" :data-notification-id="notification.id")
            div
              //- new
              .badge.info.new-unread-badge(v-if="!notification.isRead")
              //- icon
              img.icon.add(v-if="notification.iconClass === 'add'" src="@/assets/add.svg")
              img.icon.heart(v-if="notification.iconClass === 'heart'" src="@/assets/heart.svg")
              img.icon.sunglasses(v-if="notification.iconClass === 'sunglasses'" src="@/assets/sunglasses.svg")
              //- user
              span.user-wrap
                UserLabelInline(:user="notification.user")
              //- message
              span {{notification.message}}
              //- space
              span.space-name-wrap(v-if="notification.spaceId" :data-space-id="notification.spaceId" @click.stop.prevent="changeSpace(notification.spaceId)" :class="{ active: isCurrentSpace(notification.spaceId) }")
                BackgroundPreview(v-if="notification.space" :space="notification.space")
                span.space-name {{notification.space.name}}
            //- add to explore button
            .row(v-if="notification.type === 'askToAddToExplore'")
              AddToExplore(:space="notification.space" :visible="true" @updateAddToExplore="updateAddToExplore")
            //- card details
            .row(v-if="notification.card")
              a(:href="cardUrl(notification)")
                .card-details.badge.button-badge(@click.stop.prevent="showCardDetails(notification)" :class="{ active: cardDetailsIsVisible(notification.card.id) }")
                  template(v-for="segment in cardNameSegments(notification.card.name)")
                    NameSegment(:segment="segment" @showTagDetailsIsVisible="showCardDetails(notification)")
                  img.card-image(v-if="notification.detailsImage" :src="notification.detailsImage")

</template>

<script>
import Loader from '@/components/Loader.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import NameSegment from '@/components/NameSegment.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'
import BackgroundPreview from '@/components/BackgroundPreview.vue'
import AddToExplore from '@/components/AddToExplore.vue'
import OfflineBadge from '@/components/OfflineBadge.vue'

export default {
  name: 'UserNotifications',
  components: {
    Loader,
    UserLabelInline,
    NameSegment,
    BackgroundPreview,
    AddToExplore,
    OfflineBadge
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
      dialogHeight: null,
      filteredNotifications: null
    }
  },
  computed: {
    currentSpaceId () { return this.$store.state.currentSpace.id },
    currentUser () { return this.$store.state.currentUser }
  },
  methods: {
    spaceUrl (notification) {
      if (!notification.space) { return }
      return `${consts.kinopioDomain()}/${notification.space.id}`
    },
    cardUrl (notification) {
      if (!notification.card) { return }
      return `${consts.kinopioDomain()}/${notification.space.id}/${notification.card.id}`
    },
    isAskToAddToExplore (notification) {
      return notification.type === 'askToAddToExplore'
    },
    cardDetailsIsVisible (cardId) {
      return this.$store.state.cardDetailsIsVisibleForCardId === cardId
    },
    isCurrentSpace (spaceId) {
      return spaceId === this.currentSpaceId
    },
    primaryAction (notification) {
      if (notification.space) {
        this.changeSpace(notification.spaceId)
      }
    },
    changeSpace (spaceId) {
      this.$store.commit('cardDetailsIsVisibleForCardId', null)
      if (this.isCurrentSpace(spaceId)) { return }
      const space = { id: spaceId }
      this.$store.dispatch('currentSpace/changeSpace', space)
    },
    showCardDetails (notification) {
      let space = utils.clone(notification.space)
      const card = utils.clone(notification.card)
      if (this.currentSpaceId !== space.id) {
        this.$store.commit('loadSpaceShowDetailsForCardId', card.id)
        this.$store.dispatch('currentSpace/changeSpace', space)
      } else {
        this.$store.dispatch('currentCards/showCardDetails', card.id)
      }
      this.$emit('markAsRead', notification.id)
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
    },
    updateAddToExplore (space) {
      const isCurrentSpace = space.id === this.$store.state.currentSpace.id
      this.filteredNotifications = this.filteredNotifications.map(notification => {
        if (!notification.space) {
          return notification
        }
        if (notification.space.id === space.id) {
          notification.space.showInExplore = space.showInExplore
        }
        return notification
      })
      if (isCurrentSpace) {
        this.$store.dispatch('currentSpace/updateSpace', { showInExplore: space.showInExplore })
      } else {
        space = { id: space.id, showInExplore: space.showInExplore }
        this.$store.dispatch('api/updateSpace', space)
      }
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.filteredNotifications = this.notifications
        this.updateDialogHeight()
        this.$store.commit('shouldExplicitlyHideFooter', true)
      } else {
        this.$store.commit('shouldExplicitlyHideFooter', false)
        this.markAllAsRead()
        this.filteredNotifications = null
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
      border-bottom-left-radius 0
      border-bottom-right-radius 0
      border-bottom 1px solid var(--primary-border)
      &:hover,
      &:active,
      &.active,
      &:focus
        border-radius var(--entity-radius)

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
    margin-right 3px !important
    .preview-wrap
      vertical-align -2px
      width 14px
      height 14px
      border-radius var(--small-entity-radius)
  .row
    margin-top 10px
  .card-details
    background-color var(--secondary-background)
    border-radius var(--entity-radius)
    display inline-block
    width fit-content
    max-width 100%
    margin 0

  .card-image
    vertical-align middle
    border-radius var(--entity-radius)
    max-height 100px
    display block
    margin 4px 0px
  .loader
    width 14px
    height 14px
    vertical-align -3px
    margin-left 6px
  .sunglasses
    vertical-align -2px

  .results-list
    a
      text-decoration none
    hr:first-child
      display none
    hr
      margin 4px 0
      margin-left -4px
      width calc(100% + 8px)
    .tag
      display inline-block
      margin-right 0
  .user-label-inline
    margin-right 3px
  .space-name-wrap
    margin-left 3px
  .new-unread-badge
    display inline-block
</style>
