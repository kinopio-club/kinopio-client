<template lang="pug">
aside.notifications(@click.left="closeAllDialogs")
  .item(v-for="item in items" v-bind:key="item.id" :data-notification-id="item.id" :data-is-persistent-item="item.isPersistentItem" :class="notifificationClasses(item)")
    p
      span.label-badge(v-if="item.label") {{item.label}}
      template(v-if="item.icon")
        img.icon(v-if="item.icon === 'open'" src="@/assets/open.svg" class="open")
        img.icon(v-else-if="item.icon === 'press-and-hold'" src="@/assets/press-and-hold.svg" class="press-and-hold")
        img.icon(v-else-if="item.icon === 'add'" src="@/assets/add.svg" class="add")
        img.icon(v-else-if="item.icon === 'cut'" src="@/assets/cut.svg" class="cut")
        img.icon(v-else-if="item.icon === 'undo'" src="@/assets/undo.svg" class="undo")
        img.icon(v-else-if="item.icon === 'redo'" src="@/assets/undo.svg" class="redo")
        img.icon(v-else-if="item.icon === 'brush-y'" src="@/assets/brush-y.svg" class="brush-y")
        img.icon(v-else-if="item.icon === 'minimap'" src="@/assets/minimap.svg" class="minimap")
        img.icon(v-else-if="item.icon === 'offline'" src="@/assets/offline.svg" class="offline")
        img.icon(v-else-if="item.icon === 'mail'" src="@/assets/mail.svg" class="mail")
      span {{item.message}}
    .row(v-if="item.isPersistentItem")
      button(@click="removeById(item)")
        img.icon.cancel(src="@/assets/add.svg")

  .persistent-item.danger.hidden#notify-cache-is-full
    p Local storage error has occured, please refresh
    .row
      .button-wrap
        button(@click.left="refreshBrowser")
          img.refresh.icon(src="@/assets/refresh.svg")
          span Refresh

  .persistent-item.info(v-if="currentUserIsResizingCard")
    img.icon.resize(src="@/assets/resize.svg")
    span Drag to Resize
  .persistent-item.info(v-if="currentUserIsTiltingCard")
    img.icon.resize(src="@/assets/resize.svg")
    span Drag to Tilt

  .persistent-item.info(v-if="currentUserIsPaintingLocked && isTouchDevice")
    img.icon(src="@/assets/brush.svg")
    span Hold and drag to paint

  .persistent-item.info(v-if="currentUserIsPanningReady || currentUserIsPanning")
    img.icon(src="@/assets/hand.svg")
    span Hold and drag to pan

  .persistent-item.success(v-if="notifyThanksForDonating")
    p Thank you for being a
      span
        .badge.info.is-donor Donor
      span , I deeply appreciate your support
    .row
      button(@click="removeNotifyThanks")
        img.icon.cancel(src="@/assets/add.svg")
        span Feels Good

  .persistent-item.success(v-if="notifyThanksForUpgrading")
    p Thank you for upgrading, I deeply appreciate your support
    .row
      button(@click="removeNotifyThanks")
        img.icon.cancel(src="@/assets/add.svg")
        span Feels Good

  .item.info(v-if="notifySpaceIsHidden" @animationend="resetNotifySpaceIsHidden")
    p Hidden spaces are revealed through
      img.icon.filter-icon(src="@/assets/filter.svg")

  .item.info(v-if="notifyCurrentSpaceIsNowRemoved" @animationend="resetNotifyCurrentSpaceIsNowRemoved")
    p Space was removed
    .row
      button(@click.stop="showRemoved")
        img.icon(src="@/assets/remove.svg")
        img.icon.remove-undo(src="@/assets/undo.svg")
        span Restore or Permanently Delete

  .item(v-if="notifyCardsCreatedIsNearLimit" @animationend="resetNotifyCardsCreatedIsNearLimit")
    p You can add {{cardsCreatedCountFromLimit}} more cards before you'll need to upgrade
    .row
      button(@click.left.stop="triggerUpgradeUserIsVisible") Upgrade for Unlimited

  .persistent-item.danger(v-if="notifyCardsCreatedIsOverLimit" ref="cardsOverLimit" :class="{'notification-jiggle': notifyCardsCreatedIsOverLimitJiggle}" @animationend="resetNotifyCardsCreatedIsOverLimitJiggle")
    p To add more cards, you'll need to upgrade
    .row
      button(@click.left.stop="triggerUpgradeUserIsVisible") Upgrade for Unlimited

  .persistent-item.success(v-if="notifySignUpToEditSpace" ref="readOnly" :class="{'notification-jiggle': readOnlyJiggle}")
    p
      PrivacyIcon(:privacy="privacyState.name")
      button(@click.left.stop="triggerSignUpOrInIsVisible") Sign Up or In to Edit

  .persistent-item.danger(v-if="notifySpaceNotFound")
    p Space could not be found, or is private
    .row
      button(@click.left.stop="triggerSpaceDetailsVisible") Spaces
      button(v-if="!currentUserIsSignedIn" @click.left.stop="triggerSignUpOrInIsVisible") Sign Up or In
      button(@click.left="removeNotifySpaceNotFound")
        img.icon.cancel(src="@/assets/add.svg")

  .persistent-item(v-if="notifySpaceIsRemoved")
    p This space is removed
    .row
      button(@click.left="restoreSpace")
        img.icon(src="@/assets/undo.svg")
        span Restore
      button.danger(@click.left="deleteSpace")
        img.icon(src="@/assets/remove.svg")
        span Permanently Delete

  .persistent-item.danger(v-if="notifyConnectionError")
    .row
      p A server connection error has occured, please refresh
    .row
      p 🚒 Code: {{notifyConnectionErrorName}}
    .row
      .button-wrap
        a(href="mailto:support@kinopio.club?subject=Connection Error")
          button
            span Email Support
      .button-wrap
        button(@click.left="refreshBrowser")
          img.refresh.icon(src="@/assets/refresh.svg")
          span Refresh
      .button-wrap
        button(@click="removeNotifyConnectionError")
          img.icon.cancel(src="@/assets/add.svg")

  .persistent-item(v-if="notifyKinopioUpdatesAreAvailable")
    p
      span.label-badge NEW
      span Kinopio updates are available
    .row
      .button-wrap
        button(@click.left="refreshBrowser")
          img.refresh.icon(src="@/assets/refresh.svg")
          span Update

  .persistent-item.danger(v-if="notifyServerCouldNotSave")
    p Error saving changes to server, retrying…
    .row
      .button-wrap
        button(@click.left="refreshBrowser")
          img.refresh.icon(src="@/assets/refresh.svg")
          span Refresh

  .persistent-item.danger(v-if="notifySpaceOutOfSync")
    p Space is out of sync, please refresh
    .row
      .button-wrap
        button(@click.left="refreshBrowser")
          img.refresh.icon(src="@/assets/refresh.svg")
          span Refresh

  .persistent-item.info(v-if="currentSpaceIsTemplate" ref="template" :class="{'notification-jiggle': readOnlyJiggle}")
    button.button-only(@click.left="duplicateSpace")
      img.icon(src="@/assets/add.svg")
      span Duplicate to Edit

  .item.success(v-if="notifyMoveOrCopyToSpace" @animationend="resetNotifyMoveOrCopyToSpace")
    p {{notifyMoveOrCopyToSpaceDetails.message}}
    .row
      a(:href="notifyMoveOrCopyToSpaceDetails.id")
        button(@click.left.prevent.stop="changeSpace(notifyMoveOrCopyToSpaceDetails.id)") {{notifyMoveOrCopyToSpaceDetails.name}} →

  .persistent-item.danger(v-if="notifySpaceIsUnavailableOffline")
    OfflineBadge
    .row
      p
        span Space is unavailable offline.
    .row
      p Only spaces that you're a member of, and have visited recently, are available offline

</template>

<script>
import cache from '@/cache.js'
import consts from '@/consts.js'
import privacy from '@/data/privacy.js'
import utils from '@/utils.js'
import templates from '@/data/templates.js'
import PrivacyIcon from '@/components/PrivacyIcon.vue'
import OfflineBadge from '@/components/OfflineBadge.vue'

import dayjs from 'dayjs'

let checkIfShouldNotifySpaceOutOfSyncIntervalTimer

export default {
  name: 'Notifications',
  components: {
    PrivacyIcon,
    OfflineBadge
  },
  data () {
    return {
      readOnlyJiggle: false,
      notifyCardsCreatedIsOverLimitJiggle: false,
      notifySpaceOutOfSync: false
    }
  },
  created () {
    this.update()
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'addNotification') {
        this.update()
      } else if (mutation.type === 'currentUserIsPainting') {
        if (state.currentUserIsPainting) {
          this.addReadOnlyJiggle()
        }
      } else if (mutation.type === 'triggerReadOnlyJiggle') {
        this.addReadOnlyJiggle()
      } else if (mutation.type === 'notifyCardsCreatedIsOverLimit') {
        this.notifyCardsCreatedIsOverLimitJiggle = true
      } else if (mutation.type === 'currentSpace/restoreSpace') {
        this.notifySpaceOutOfSync = false
      } else if (mutation.type === 'triggerCheckIfShouldNotifySpaceOutOfSync') {
        this.checkIfShouldNotifySpaceOutOfSync()
      }
    })
  },
  mounted () {
    window.addEventListener('visibilitychange', this.updatePageVisibilityChange)
    window.addEventListener('focus', this.updatePageVisibilityChange)
    checkIfShouldNotifySpaceOutOfSyncIntervalTimer = setInterval(() => {
      this.checkIfShouldNotifySpaceOutOfSync()
    }, 1000 * 60 * 60 * 1) // check every hour
  },
  beforeUnmount () {
    window.removeEventListener('visibilitychange', this.updatePageVisibilityChange)
    window.removeEventListener('focus', this.updatePageVisibilityChange)
    clearInterval(checkIfShouldNotifySpaceOutOfSyncIntervalTimer)
  },
  computed: {
    items () { return this.$store.state.notifications },
    notifySpaceNotFound () { return this.$store.state.notifySpaceNotFound },
    notifyConnectionError () { return this.$store.state.notifyConnectionError },
    notifyConnectionErrorName () { return this.$store.state.notifyConnectionErrorName },
    notifyServerCouldNotSave () {
      const isOffline = !this.$store.state.isOnline
      if (isOffline) { return }
      return this.$store.state.notifyServerCouldNotSave
    },
    notifySpaceIsRemoved () { return this.$store.state.notifySpaceIsRemoved },
    notifySignUpToEditSpace () { return this.$store.state.notifySignUpToEditSpace },
    notifyCardsCreatedIsNearLimit () { return this.$store.state.notifyCardsCreatedIsNearLimit },
    notifyCardsCreatedIsOverLimit () { return this.$store.state.notifyCardsCreatedIsOverLimit },
    notifyKinopioUpdatesAreAvailable () { return this.$store.state.notifyKinopioUpdatesAreAvailable },
    notifyMoveOrCopyToSpace () { return this.$store.state.notifyMoveOrCopyToSpace },
    notifyMoveOrCopyToSpaceDetails () { return this.$store.state.notifyMoveOrCopyToSpaceDetails },
    notifySpaceIsHidden () { return this.$store.state.notifySpaceIsHidden },
    notifyCurrentSpaceIsNowRemoved () { return this.$store.state.notifyCurrentSpaceIsNowRemoved },
    notifyThanksForDonating () { return this.$store.state.notifyThanksForDonating },
    notifyThanksForUpgrading () { return this.$store.state.notifyThanksForUpgrading },
    currentUserIsPaintingLocked () { return this.$store.state.currentUserIsPaintingLocked },
    currentUserIsResizingCard () { return this.$store.state.currentUserIsResizingCard },
    currentUserIsTiltingCard () { return this.$store.state.currentUserIsTiltingCard },
    currentUserIsPanning () { return this.$store.state.currentUserIsPanning },
    currentUserIsPanningReady () { return this.$store.state.currentUserIsPanningReady },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    currentUserIsUpgraded () { return this.$store.state.currentUser.isUpgraded },
    isTouchDevice () { return this.$store.state.isTouchDevice },
    notifySpaceIsUnavailableOffline () { return this.$store.getters['currentSpace/isUnavailableOffline'] },
    privacyState () {
      return privacy.states().find(state => {
        return state.name === this.$store.state.currentSpace.privacy
      })
    },
    cardsCreatedCountFromLimit () {
      const cardsCreatedLimit = this.$store.state.cardsCreatedLimit
      const cardsCreatedCount = this.$store.state.currentUser.cardsCreatedCount
      return Math.max(cardsCreatedLimit - cardsCreatedCount, 0)
    },
    currentSpaceIsTemplate () {
      const currentSpace = this.$store.state.currentSpace
      if (currentSpace.isTemplate) { return true }
      const templateSpaceIds = templates.spaces().map(space => space.id)
      return templateSpaceIds.includes(currentSpace.id)
    }
  },
  methods: {
    notifificationClasses (item) {
      let classes = {
        'danger': item.type === 'danger',
        'success': item.type === 'success',
        'info': item.type === 'info',
        'persistent-item': item.isPersistentItem
      }
      return classes
    },
    removeNotifyThanks () {
      this.$store.commit('notifyThanksForDonating', false)
      this.$store.commit('notifyThanksForUpgrading', false)
    },
    cacheErrorIsVisible () {
      const element = document.getElementById('notify-cache-is-full')
      const isHidden = element.className.includes('hidden')
      return Boolean(!isHidden)
    },
    updatePageVisibilityChange (event) {
      this.checkIfShouldNotifySpaceOutOfSync()
    },
    closeAllDialogs () {
      this.$store.dispatch('closeAllDialogs')
    },
    update () {
      const notifications = this.$store.state.notifications
      notifications.forEach(item => {
        this.$nextTick(() => {
          const element = document.querySelector(`.notifications .item[data-notification-id="${item.id}"]`)
          if (element.dataset.isPersistentItem) { return }
          element.addEventListener('animationend', this.removePrevious, false)
        })
      })
    },
    removePrevious () {
      this.$store.commit('removePreviousNotification')
    },
    removeById (item) {
      this.$store.commit('removeNotificationById', item.id)
    },
    addReadOnlyJiggle () {
      const element = this.$refs.readOnly || this.$refs.template
      if (!element) { return }
      this.readOnlyJiggle = true
      element.addEventListener('animationend', this.removeReadOnlyJiggle, false)
    },
    removeReadOnlyJiggle () {
      this.readOnlyJiggle = false
    },
    removeNotifySpaceNotFound () {
      this.$store.commit('notifySpaceNotFound', false)
    },
    triggerSpaceDetailsVisible () {
      this.$store.commit('triggerSpaceDetailsVisible')
    },
    triggerSignUpOrInIsVisible () {
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    restoreSpace () {
      const space = this.$store.state.currentSpace
      this.$store.dispatch('currentSpace/restoreRemovedSpace', space)
      this.$store.commit('notifySpaceIsRemoved', false)
    },
    deleteSpace () {
      const space = this.$store.state.currentSpace
      this.$store.dispatch('currentSpace/deleteSpace', space)
      this.$store.commit('notifySpaceIsRemoved', false)
      const firstSpace = cache.getAllSpaces()[0]
      this.$store.dispatch('currentSpace/loadSpace', { space: firstSpace })
    },
    resetNotifySpaceIsHidden () {
      this.$store.commit('notifySpaceIsHidden', false)
    },
    resetNotifyCurrentSpaceIsNowRemoved () {
      this.$store.commit('notifyCurrentSpaceIsNowRemoved', false)
    },
    showRemoved () {
      this.resetNotifyCurrentSpaceIsNowRemoved()
      this.$store.commit('triggerRemovedIsVisible')
    },
    resetNotifyCardsCreatedIsNearLimit () {
      this.$store.commit('notifyCardsCreatedIsNearLimit', false)
    },
    resetNotifyMoveOrCopyToSpace () {
      this.$store.commit('notifyMoveOrCopyToSpace', false)
    },
    resetNotifyCardsCreatedIsOverLimitJiggle () {
      this.notifyCardsCreatedIsOverLimitJiggle = false
    },
    triggerUpgradeUserIsVisible () {
      this.closeAllDialogs()
      this.$store.commit('triggerUpgradeUserIsVisible')
    },
    async checkIfShouldNotifySpaceOutOfSync () {
      if (this.notifySpaceOutOfSync) { return }
      console.log('☎️ checkIfShouldNotifySpaceOutOfSync…')
      try {
        let space = utils.clone(this.$store.state.currentSpace)
        if (!this.currentUserIsSignedIn) { return }
        this.$store.commit('isLoadingSpace', true)
        const remoteSpace = await this.$store.dispatch('api/getSpaceUpdatedAt', space)
        this.$store.commit('isLoadingSpace', false)
        if (!remoteSpace) { return }
        space = this.$store.state.currentSpace
        const spaceUpdatedAt = dayjs(space.updatedAt)
        const remoteSpaceUpdatedAt = dayjs(remoteSpace.updatedAt)
        const deltaMinutes = spaceUpdatedAt.diff(remoteSpaceUpdatedAt, 'minute')
        const updatedAtIsChanged = deltaMinutes >= 1
        console.log('☎️ checkIfShouldNotifySpaceOutOfSync result', {
          updatedAtIsChanged,
          spaceUpdatedAt: spaceUpdatedAt.fromNow(),
          remoteSpaceUpdatedAt: remoteSpaceUpdatedAt.fromNow(),
          deltaMinutes
        })
        if (updatedAtIsChanged) {
          this.notifySpaceOutOfSync = true
        }
      } catch (error) {
        console.error('🚒 checkIfShouldNotifySpaceOutOfSync', error)
        this.notifySpaceOutOfSync = true
        this.$store.commit('isLoadingSpace', false)
      }
    },
    refreshBrowser () {
      window.location.reload()
    },
    duplicateSpace () {
      this.$store.dispatch('currentSpace/duplicateSpace')
    },
    changeSpace (spaceId) {
      const space = { id: spaceId }
      this.$store.dispatch('currentSpace/changeSpace', space)
      this.$store.dispatch('closeAllDialogs')
    },
    removeNotifyConnectionError () {
      this.$store.commit('notifyConnectionError', false)
    }
  }
}
</script>

<style lang="stylus">
.notifications
  margin-bottom 10px
  display flex
  flex-direction column
  align-items flex-start
  max-width 276px
  .item,
  .persistent-item
    pointer-events all
    box-shadow 3px 3px 0 var(--heavy-shadow)
    border-radius var(--entity-radius)
    margin-bottom 10px
    margin-right 0
    background-color var(--info-background)
    padding 5px 8px
    animation-name hideme
    animation-delay 5s
    animation-duration 0.1s
    animation-iteration-count 1
    animation-direction forward
    animation-fill-mode forwards
    animation-timing-function ease-out
    &.success
      background-color var(--success-background)
    &.danger
      background-color var(--danger-background)
    &:last-child
      margin-bottom 0
    p
      margin 0
      user-select text
  .persistent-item
    animation none
  .row
    margin-top 5px
    display flex
    align-items flex-end
    button
      &:first-child
        margin-left 0
  button
    margin-left 6px
  .button-only
    margin 0

  button + button,
  button + label,
  .button-wrap + .button-wrap
    margin-left 6px

  .hidden
    display none

  .notification-jiggle
    animation-name notificationJiggle
    animation-duration 0.2s
    animation-iteration-count 2
    animation-direction forward
    animation-fill-mode forwards
    animation-timing-function ease-out

  .label-badge
    position initial
    display inline-block
    color var(--primary-background)
    margin-right 6px
    font-size 10px
    vertical-align 1px

  .redo
    transform scaleX(-1)

  .icon.refresh
    vertical-align 0px

  .icon.resize
    vertical-align 2px

  .filter-icon
    margin 0
    margin-left 4px

  .badge
    &.is-donor
      margin 0
      margin-left 6px
      vertical-align 0

@keyframes notificationJiggle
  0%
    transform rotate(0deg)
  25%
    transform rotate(-3deg)
  50%
    transform rotate(2deg)
  75%
    transform rotate(-3deg)
  100%
    transform rotate(0deg)

@keyframes hideme
  from
    opacity 1
  to
    opacity 0
</style>
