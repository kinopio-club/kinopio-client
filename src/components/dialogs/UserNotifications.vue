<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useThemeStore } from '@/stores/useThemeStore'

import Loader from '@/components/Loader.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import NameSegment from '@/components/NameSegment.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'
import AddToExplore from '@/components/AddToExplore.vue'
import OfflineBadge from '@/components/OfflineBadge.vue'
import GroupLabel from '@/components/GroupLabel.vue'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()
const themeStore = useThemeStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['markAsRead', 'markAllAsRead'])

const props = defineProps({
  visible: Boolean,
  loading: Boolean,
  notifications: Array
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
    state.filteredNotifications = props.notifications
    globalStore.shouldExplicitlyHideFooter = true
  } else {
    globalStore.shouldExplicitlyHideFooter = false
    markAllAsRead()
    state.filteredNotifications = null
  }
})
watch(() => props.loading, (value, prevValue) => {
  updateDialogHeight()
})

watch(() => props.notifications, (value, prevValue) => {
  state.filteredNotifications = props.notifications
})

const state = reactive({
  filteredNotifications: null,
  dialogHeight: null
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const currentUser = computed(() => userStore.getUserAllState)

// space

const currentSpaceId = computed(() => spaceStore.id)
const isCurrentSpace = (spaceId) => {
  return spaceId === currentSpaceId.value
}
const spaceUrl = (notification) => {
  if (!notification.space) { return }
  return `${consts.kinopioDomain()}/${notification.space.id}`
}

// card

const cardUrl = (notification) => {
  if (!notification.card) { return }
  return `${consts.kinopioDomain()}/${notification.space.id}/${notification.card.id}`
}
const cardDetailsIsVisible = (cardId) => {
  return globalStore.cardDetailsIsVisibleForCardId === cardId
}
const showCardDetails = (notification) => {
  const space = utils.clone(notification.space)
  const card = utils.clone(notification.card)
  if (currentSpaceId.value !== space.id) {
    globalStore.loadSpaceFocusOnCardId = card.id
    spaceStore.changeSpace(space)
  } else {
    cardStore.showCardDetails(card.id)
  }
  emit('markAsRead', notification.id)
}
const segmentTagColor = (segment) => {
  const spaceTag = spaceStore.getSpaceTagByName(segment.name)
  const userTag = userStore.getUserTagByName(segment.name)
  if (spaceTag) {
    return spaceTag.color
  } else if (userTag) {
    return userTag.color
  } else {
    return currentUser.value.color
  }
}
const cardNameSegments = (name) => {
  const url = utils.urlFromString(name)
  let imageUrl
  if (utils.urlIsImage(url)) {
    imageUrl = url
    name = name.replace(url, '')
  }
  const segments = utils.cardNameSegments(name)
  if (imageUrl) {
    segments.unshift({
      isImage: true,
      url: imageUrl
    })
  }
  return segments.map(segment => {
    if (!segment.isTag) { return segment }
    segment.color = segmentTagColor(segment)
    return segment
  })
}
const markAllAsRead = () => {
  emit('markAllAsRead')
}
const isThemeDark = computed(() => themeStore.getIsThemeDark)
const cardBackgroundIsDark = (card) => {
  if (card.backgroundColor) {
    return utils.colorIsDark(card.backgroundColor)
  } else {
    return isThemeDark.value
  }
}

// user

const userColor = (notification) => {
  if (notification.user) {
    return notification.user.color
  }
}
const userName = (notification) => {
  if (notification.user) {
    return notification.user.name
  }
}
const deleteUserNotifications = async () => {
  globalStore.triggerClearUserNotifications()
  await apiStore.deleteAllNotifications()
}

// actions

const primaryAction = (notification) => {
  if (notification.space) {
    changeSpace(notification.spaceId)
  }
}
const changeSpace = (spaceId) => {
  globalStore.updateCardDetailsIsVisibleForCardId(null)
  if (isCurrentSpace(spaceId)) { return }
  const space = { id: spaceId }
  spaceStore.changeSpace(space)
}

// explore

const isAskToAddToExplore = (notification) => {
  return notification.type === 'askToAddToExplore'
}
const updateAddToExplore = async (space) => {
  const isCurrentSpace = space.id === spaceStore.id
  state.filteredNotifications = state.filteredNotifications.map(notification => {
    if (!notification.space) {
      return notification
    }
    if (notification.space.id === space.id) {
      notification.space.showInExplore = space.showInExplore
    }
    return notification
  })
  if (isCurrentSpace) {
    await spaceStore.updateSpace({ showInExplore: space.showInExplore })
  } else {
    space = { id: space.id, showInExplore: space.showInExplore }
    apiStore.updateSpace(space)
  }
}

</script>

<template lang="pug">
dialog.narrow.user-notifications(v-if="props.visible" :open="props.visible" ref="dialogElement" :style="{'max-height': state.dialogHeight -50 + 'px'}")
  section
    .row.title-row
      div
        span Notifications
        Loader(:visible="props.loading")
      .button-wrwap
        button.small-button.remove-button.danger(@click.left.stop="deleteUserNotifications")
            img.icon(src="@/assets/remove.svg")

    OfflineBadge

  section(v-if="!props.loading && !state.filteredNotifications.length")
    p Cards added to your spaces by collaborators can be found here

  section.results-section(v-if="state.filteredNotifications.length" :style="{'max-height': state.dialogHeight + 'px'}")
    ul.results-list(v-if="state.filteredNotifications.length")
      template(v-for="notification in state.filteredNotifications")
        a(:href="spaceUrl(notification)")
          li(@click.stop.prevent="primaryAction(notification)" :class="{ active: isCurrentSpace(notification.spaceId) }" :data-notification-id="notification.id" :data-notification-icon-class="notification.iconClass")
            .row
              //- new
              .badge.info.new-unread-badge(v-if="!notification.isRead")
              div
                //- icon
                img.icon.heart(v-if="notification.iconClass === 'heart'" src="@/assets/heart.svg")
                img.icon.sunglasses(v-if="notification.iconClass === 'sunglasses'" src="@/assets/sunglasses.svg")
                //- user
                span.user-wrap
                  UserLabelInline(:user="notification.user")
                //- message
                span {{notification.message}}&nbsp;
                //- group
                template(v-if="notification.type === 'addSpaceToGroup'")
                  GroupLabel(:group="notification.group")
                //- space
                span.space-name-wrap(v-if="notification.spaceId" :data-space-id="notification.spaceId" @click.stop.prevent="changeSpace(notification.spaceId)" :class="{ active: isCurrentSpace(notification.spaceId) }")
                  img.preview-thumbnail-image(v-if="notification.space.previewThumbnailImage" :src="notification.space.previewThumbnailImage")
                  span.space-name {{notification.space.name}}
            //- add to explore button
            .row(v-if="notification.type === 'askToAddToExplore'")
              AddToExplore(:space="notification.space" :visible="true" @updateAddToExplore="updateAddToExplore")
            //- card details
            .row(v-if="notification.card")
              a(:href="cardUrl(notification)")
                .card-details.badge.button-badge(@click.stop.prevent="showCardDetails(notification)" :class="{ active: cardDetailsIsVisible(notification.card.id) }" :style="{backgroundColor: notification.card.backgroundColor}")
                  template(v-for="segment in cardNameSegments(notification.card.name)")
                    NameSegment(:segment="segment" @showTagDetailsIsVisible="showCardDetails(notification)" :backgroundColorIsDark="cardBackgroundIsDark(notification.card)")
                  img.card-image(v-if="notification.detailsImage" :src="notification.detailsImage")
</template>

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
    &.title-row
      margin-top 0
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
    display inline
  .new-unread-badge
    position absolute
    top 0
    right 0
    left initial
    margin 0
  .icon-wrap
    display inline-block
    margin-right 5px
    position relative
  .preview-thumbnail-image
    width 24px
    height 22px
    overflow hidden
    object-fit cover
    object-position 0 0
    border-radius var(--entity-radius)
    image-rendering crisp-edges
    flex-shrink 0
    margin-right 3px
    vertical-align middle
  .group-label
    margin-left 4px
    .group-badge
      margin-right 0
</style>
