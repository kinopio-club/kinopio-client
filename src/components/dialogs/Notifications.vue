<template lang="pug">
dialog.narrow.notifications(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight -50 + 'px'}")
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
      template(v-for="group in groupedItems")
        //- space
        li.space-name(v-if="group.spaceId" :data-space-id="group.spaceId" @click="changeSpace(group.spaceId)" :class="{ active: spaceIsCurrentSpace(group.spaceId) }")
          .background(v-if="group.background" :style="{ backgroundImage: `url(${group.background})` }")
          span.badge.space-badge
            span {{group.spaceName}}
        //- notification
        template(v-for="(notification in group.notifications")
          li(@click="showCardDetails(notification)" :class="{ active: cardDetailsIsVisible(notification.card.id) }" :data-notification-id="notification.id")
            p
              span.badge.info(v-if="!notification.isRead") New
              span.badge.user-badge.user-badge(:style="{background: notification.user.color}")
                User(:user="notification.user" :isClickable="false" :hideYouLabel="true")
                span {{notification.user.name}}
            .notification-info
              img.icon(src="@/assets/add.svg")
              template(v-for="segment in notification.card.nameSegments")
                img.card-image(v-if="segment.isImage" :src="segment.url")
                NameSegment(:segment="segment")

</template>

<script>
import Loader from '@/components/Loader.vue'
import User from '@/components/User.vue'
import NameSegment from '@/components/NameSegment.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'

export default {
  name: 'Notifications',
  components: {
    Loader,
    User,
    NameSegment
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
    currentUser () { return this.$store.state.currentUser },
    groupedItems () {
      let groups = []
      this.notifications.forEach(item => {
        item.card.nameSegments = this.cardNameSegments(item.card.name)
        const groupIndex = groups.findIndex(group => group.spaceId === item.spaceId)
        if (groupIndex !== -1) {
          groups[groupIndex].notifications.push(item)
        } else {
          groups.push({
            spaceName: item.space.name,
            spaceId: item.spaceId,
            space: item.space,
            notifications: [item],
            background: item.space.background
          })
        }
      })
      return groups
    }
  },
  methods: {
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
      let space = notification.space
      const card = notification.card
      if (this.currentSpaceId !== space.id) {
        this.$store.commit('loadSpaceShowDetailsForCardId', card.id)
        const cachedSpace = cache.space(space.id)
        if (cachedSpace) {
          space = cachedSpace
        }
        this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
      } else {
        this.$store.dispatch('currentSpace/showCardDetails', card.id)
      }
      this.$emit('markAsRead', notification.id)
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
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
.notifications
  top calc(100% - 8px)
  left initial
  right 8px
  max-height calc(100vh - 25px)
  section
    width 100%
  .results-section
    border-top 1px solid var(--primary)
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
  .background
    border-radius 3px
    display inline-grid
    height 24px
    width 24px
    vertical-align middle
    margin-right 3px
    background-repeat no-repeat
    background-size cover
  .card-image
    width 48px
    vertical-align middle
    border-radius 3px
  .icon + .card-image
  .card-image + span
    margin-left 5px
  .loader
    width 14px
    height 14px
    vertical-align -3px
    margin-left 6px

</style>
