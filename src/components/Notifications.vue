<template lang="pug">
aside.notifications(@click.left="closeAllDialogs")
  .item(v-for="item in items" v-bind:key="item.id" :data-notification-id="item.id" :class="item.type")
    p
      img.icon(v-if="item.icon" :src="icon(item.icon).path" :class="item.icon")
      span {{item.message}}

  .item.success(v-if="notifySpaceIsOpenAndEditable")
    p
      img.icon.open(src="@/assets/open.svg")
      span This space is open, which means you can add to it too

  .item(v-if="notifyCardsCreatedIsNearLimit" @animationend="resetNotifyCardsCreatedIsNearLimit")
    p You can add {{cardsCreatedCountFromLimit}} more cards before you'll need to upgrade for $4/month
    .row
      button(@click.left.stop="triggerUpgradeUserIsVisible") Upgrade for Unlimited

  .persistent-item.danger(v-if="notifyCardsCreatedIsOverLimit" ref="cardsOverLimit" :class="{'notification-jiggle': notifyCardsCreatedIsOverLimitJiggle}" @animationend="resetNotifyCardsCreatedIsOverLimitJiggle")
    p To add more cards, you'll need to upgrade for $4/month
    .row
      button(@click.left.stop="triggerUpgradeUserIsVisible") Upgrade for Unlimited

  .persistent-item.success(v-if="notifySignUpToEditSpace" ref="readOnly" :class="{'notification-jiggle': readOnlyJiggle}")
    p
      img.icon(:src="privacyIcon" :class="privacyName")
      template(v-if="spacePrivacyIsOpen")
        span This space is open to edits, but you'll need to sign up or in first
      template(v-else)
        span You're invited to edit this space, but you'll need to sign up or in first
    .row
      button(@click.left.stop="triggerSignUpOrInIsVisible") Sign Up or In

  .persistent-item.danger(v-if="notifySpaceNotFound")
    p Space could not be found, or is private
    .row
      button(@click.left.stop="triggerSpaceDetailsVisible") Your Spaces
      button(v-if="!currentUserIsSignedIn" @click.left.stop="triggerSignUpOrInIsVisible") Sign Up or In

  .persistent-item(v-if="notifySpaceIsRemoved")
    p This space is removed
    .row
      button(@click.left="restoreSpace")
        img.icon(src="@/assets/undo.svg")
        span Restore
      button.danger(@click.left="removeSpacePermanent")
        img.icon(src="@/assets/remove.svg")
        span Permanently Remove

  .persistent-item.danger(v-if="notifyConnectionError")
    p A connection error has occured, please refresh
    .row
      .button-wrap
        a(href="mailto:support@kinopio.club?subject=Connection Error")
          button Email Support
        button(@click.left="refreshBrowser") Refresh

  .persistent-item.danger(v-if="notifyServerCouldNotSave")
    p Error saving changes to server, retrying…

  .persistent-item.danger(v-if="notifySpaceOutOfSync")
    p Space is out of sync, please refresh
    .row
      .button-wrap
        button(@click.left="refreshBrowser") Refresh

  .item.success(ref="newUser" v-if="notifyNewUser && !hasNotifiedNewUser")
    p Welcome to Kinopio
    .row
      button(@click.left="createNewHelloSpace")
        img.icon(src="@/assets/add.svg")
        span How does this work?

  .persistent-item.info(v-if="currentSpaceIsTemplate" ref="template" :class="{'notification-jiggle': readOnlyJiggle}")
    button(@click.left="duplicateSpace")
      img.icon(src="@/assets/add.svg")
      span Use Template

  .persistent-item.danger.hidden#notify-local-storage-is-full(v-if="!currentUserIsSignedIn")
    p Cannot save changes because your localStorage is full, sign up to fix
    .row
      button(@click.left.stop="triggerSignUpOrInIsVisible") Sign Up or In

</template>

<script>
import cache from '@/cache.js'
import privacy from '@/data/privacy.js'
import utils from '@/utils.js'
import templates from '@/data/templates.js'

let wasOffline

export default {
  name: 'Notifications',
  data () {
    return {
      readOnlyJiggle: false,
      notifyCardsCreatedIsOverLimitJiggle: false,
      notifySpaceOutOfSync: false,
      hasNotifiedNewUser: false
    }
  },
  created () {
    this.update()
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'addNotification') {
        this.update()
      }
      if (mutation.type === 'currentUserIsPainting') {
        if (state.currentUserIsPainting) {
          this.addReadOnlyJiggle()
        }
      }
      if (mutation.type === 'triggerReadOnlyJiggle') {
        this.addReadOnlyJiggle()
      }
      if (mutation.type === 'notifyCardsCreatedIsOverLimit') {
        this.notifyCardsCreatedIsOverLimitJiggle = true
      }
      if (mutation.type === 'isOnline') {
        const isOnline = Boolean(mutation.payload)
        if (!isOnline) {
          console.log('☎️ is offline', !isOnline)
          wasOffline = true
        } else if (isOnline && wasOffline) {
          this.checkIfShouldNotifySpaceOutOfSync()
          wasOffline = false
        }
      }
      if (mutation.type === 'currentSpace/restoreSpace') {
        this.notifySpaceOutOfSync = false
      }
      if (mutation.type === 'notifyNewUser') {
        this.$nextTick(() => {
          const element = this.$refs.newUser
          if (!element) { return }
          element.addEventListener('animationend', this.removeNotifyNewUser, false)
        })
      }
    })
  },
  computed: {
    items () { return this.$store.state.notifications },
    notifySpaceNotFound () { return this.$store.state.notifySpaceNotFound },
    notifyConnectionError () { return this.$store.state.notifyConnectionError },
    notifyServerCouldNotSave () { return this.$store.state.notifyServerCouldNotSave },
    notifySpaceIsRemoved () { return this.$store.state.notifySpaceIsRemoved },
    notifyNewUser () { return this.$store.state.notifyNewUser },
    notifySignUpToEditSpace () { return this.$store.state.notifySignUpToEditSpace },
    notifySpaceIsOpenAndEditable () { return this.$store.state.notifySpaceIsOpenAndEditable },
    notifyCardsCreatedIsNearLimit () { return this.$store.state.notifyCardsCreatedIsNearLimit },
    notifyCardsCreatedIsOverLimit () { return this.$store.state.notifyCardsCreatedIsOverLimit },
    currentUserIsSignedIn () {
      return this.$store.getters['currentUser/isSignedIn']
    },
    privacyState () {
      return privacy.states().find(state => {
        return state.name === this.$store.state.currentSpace.privacy
      })
    },
    privacyIcon () { return require(`@/assets/${this.privacyState.icon}.svg`) },
    privacyName () { return this.privacyState.name },
    spacePrivacyIsOpen () { return this.privacyName === 'open' },
    cardsCreatedCountFromLimit () {
      const cardsCreatedLimit = this.$store.state.cardsCreatedLimit
      const cardsCreatedCount = this.$store.state.currentUser.cardsCreatedCount
      return Math.max(cardsCreatedLimit - cardsCreatedCount, 0)
    },
    currentSpaceIsTemplate () {
      const id = this.$store.state.currentSpace.id
      const templateSpaceIds = templates.spaces().map(space => space.id)
      return templateSpaceIds.includes(id)
    }
  },
  methods: {
    icon (icon) {
      return {
        path: require(`@/assets/${icon}.svg`)
      }
    },
    closeAllDialogs () {
      this.$store.dispatch('closeAllDialogs', 'Notifications.closeAllDialogs')
    },
    update () {
      const notifications = this.$store.state.notifications
      notifications.forEach(item => {
        this.$nextTick(() => {
          const element = document.querySelector(`.notifications .item[data-notification-id="${item.id}"]`)
          element.addEventListener('animationend', this.remove, false)
        })
      })
    },
    remove () {
      this.$store.commit('removeNotification')
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
    removeNotifyNewUser () {
      this.$store.commit('notifyNewUser', false)
      this.hasNotifiedNewUser = true
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
    removeSpacePermanent () {
      const space = this.$store.state.currentSpace
      this.$store.dispatch('currentSpace/removeSpacePermanent', space)
      this.$store.commit('notifySpaceIsRemoved', false)
      const firstSpace = cache.getAllSpaces()[0]
      this.$store.dispatch('currentSpace/loadSpace', { space: firstSpace })
    },
    createNewHelloSpace () {
      this.$store.commit('notifyNewUser', false)
      window.location.href = '/'
    },
    resetNotifyCardsCreatedIsNearLimit () {
      this.$store.commit('notifyCardsCreatedIsNearLimit', false)
    },
    resetNotifyCardsCreatedIsOverLimitJiggle () {
      this.notifyCardsCreatedIsOverLimitJiggle = false
    },
    triggerUpgradeUserIsVisible () {
      this.closeAllDialogs()
      this.$store.commit('triggerUpgradeUserIsVisible')
    },
    async checkIfShouldNotifySpaceOutOfSync () {
      const space = utils.clone(this.$store.state.currentSpace)
      const canEditSpace = this.$store.getters['currentUser/canEditSpace'](space)
      let remoteSpace
      if (canEditSpace) {
        remoteSpace = await this.$store.dispatch('api/getSpace', { space })
      } else {
        remoteSpace = await this.$store.dispatch('api/getSpaceAnonymously', space)
      }
      console.log('☎️ spaceUpdatedAt local remote', space.updatedAt === remoteSpace.updatedAt, space.updatedAt, remoteSpace.updatedAt)
      if (space.updatedAt !== remoteSpace.updatedAt) {
        this.notifySpaceOutOfSync = true
      }
    },
    refreshBrowser () {
      window.location.reload()
    },
    duplicateSpace () {
      const duplicatedSpaceName = this.$store.state.currentSpace.name + ' copy'
      this.$store.dispatch('currentSpace/duplicateSpace')
      this.$store.commit('addNotification', { message: `${duplicatedSpaceName} is now yours to edit`, type: 'success' }, { root: true })
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
  max-width 260px
  .item,
  .persistent-item
    pointer-events all
    box-shadow 3px 3px 0 var(--heavy-shadow)
    border-radius 3px
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

  button + button,
  button + label
    margin-left 6px

  .hidden
    display: none

  .notification-jiggle
    animation-name notificationJiggle
    animation-duration 0.2s
    animation-iteration-count 2
    animation-direction forward
    animation-fill-mode forwards
    animation-timing-function ease-out

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
