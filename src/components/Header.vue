<template lang="pug">
header(:style="visualViewportPosition")
  nav
    .logo-about
      .button-wrap
        .logo(alt="kinopio logo" @click.left.stop="toggleAboutIsVisible" @touchend.stop @mouseup.left.stop :class="{active : aboutIsVisible}" tabindex="0")
          .logo-image
            .label-badge(v-if="shouldShowNewStuffIsUpdated")
              span NEW
          img.down-arrow(src="@/assets/down-arrow.svg")
        About(:visible="aboutIsVisible")
        KeyboardShortcuts(:visible="keyboardShortcutsIsVisible")
    .space-details-wrap
      .button-wrap
        button(@click.left.stop="toggleSpaceDetailsIsVisible" :class="{active : spaceDetailsIsVisible}")
          .badge.info(v-show="currentSpaceIsTemplate")
            span Template

          .badge-wrap(v-if="!userCanEditSpace && !currentSpaceIsTemplate")
            .badge.info(:class="{'invisible': readOnlyJiggle}")
              span Read Only
            .badge.info.invisible-badge(ref="readOnly" :class="{'badge-jiggle': readOnlyJiggle, 'invisible': !readOnlyJiggle}")
              span Read Only

          span {{currentSpaceName}}
          img.icon.privacy-icon(v-if="spaceIsNotClosed" :src="privacyIcon" :class="privacyName")
          .badge.status.explore(v-if="shouldShowInExplore")
            img.icon(src="@/assets/checkmark.svg")
          Loader(:visible="isLoadingSpace")
        SpaceDetails(:visible="spaceDetailsIsVisible")
        ImportArenaChannel(:visible="importArenaChannelIsVisible")

  aside
    .top
      // Share
      .button-wrap
        button(@click.left.stop="toggleShareIsVisible" :class="{active : shareIsVisible}")
          span Share
        Share(:visible="shareIsVisible")

      .users
        User(v-if="currentUserIsSpaceMember" :user="currentUser" :isClickable="true" :detailsOnRight="true" :key="currentUser.id" :shouldCloseAllDialogs="true" tabindex="0")
        User(v-for="user in users" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0")
        User(v-for="user in collaborators" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0")
        UpgradeUser(:visible="upgradeUserIsVisible" @closeDialog="closeAllDialogs" :dialogOnRight="true")

      .users.spectators
        User(v-if="!currentUserIsSpaceMember" :user="currentUser" :isClickable="true" :detailsOnRight="true" :key="currentUser.id" :shouldCloseAllDialogs="true" tabindex="0")
        User(v-for="user in spectators" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0")

    .bottom
      ResetPassword
      // Sign Up or In
      .button-wrap(v-if="!currentUserIsSignedIn && isOnline")
        button(@click.left.stop="toggleSignUpOrInIsVisible" :class="{active : signUpOrInIsVisible}")
          span Sign Up or In
          Loader(:visible="loadingSignUpOrIn")
        SignUpOrIn(:visible="signUpOrInIsVisible" @loading="setLoadingSignUpOrIn")
      .button-wrap(v-if="!userIsUpgraded && isOnline && currentUserIsSignedIn")
        button(@click.left.stop="triggerUpgradeUserIsVisible")
          span Upgrade

</template>

<script>
import About from '@/components/dialogs/About.vue'
import SpaceDetails from '@/components/dialogs/SpaceDetails.vue'
import User from '@/components/User.vue'
import SignUpOrIn from '@/components/dialogs/SignUpOrIn.vue'
import ResetPassword from '@/components/dialogs/ResetPassword.vue'
import Share from '@/components/dialogs/Share.vue'
import Loader from '@/components/Loader.vue'
import templates from '@/spaces/templates.js'
import ImportArenaChannel from '@/components/dialogs/ImportArenaChannel.vue'
import KeyboardShortcuts from '@/components/dialogs/KeyboardShortcuts.vue'
import UpgradeUser from '@/components/dialogs/UpgradeUser.vue'
import privacy from '@/spaces/privacy.js'
import utils from '@/utils.js'

const maxIterations = 30
let currentIteration, updatePositionTimer

export default {
  name: 'Header',
  components: {
    About,
    SpaceDetails,
    User,
    SignUpOrIn,
    ResetPassword,
    Share,
    Loader,
    ImportArenaChannel,
    KeyboardShortcuts,
    UpgradeUser
  },
  data () {
    return {
      aboutIsVisible: false,
      spaceDetailsIsVisible: false,
      signUpOrInIsVisible: false,
      shareIsVisible: false,
      loadingSignUpOrIn: false,
      keyboardShortcutsIsVisible: false,
      upgradeUserIsVisible: false,
      pinchZoomOffsetLeft: 0,
      pinchZoomOffsetTop: 0,
      pinchZoomScale: 1,
      readOnlyJiggle: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.closeAllDialogs()
      }
      if (mutation.type === 'triggerSpaceDetailsVisible') {
        this.spaceDetailsIsVisible = true
      }
      if (mutation.type === 'triggerSignUpOrInIsVisible') {
        this.signUpOrInIsVisible = true
      }
      if (mutation.type === 'triggerKeyboardShortcutsIsVisible') {
        this.keyboardShortcutsIsVisible = true
      }
      if (mutation.type === 'triggerUpgradeUserIsVisible') {
        this.upgradeUserIsVisible = true
      }
      if (mutation.type === 'triggerUpdatePositionInVisualViewport') {
        currentIteration = 0
        if (updatePositionTimer) { return }
        updatePositionTimer = window.requestAnimationFrame(this.updatePositionFrame)
      }
      if (mutation.type === 'currentUserIsPainting') {
        if (state.currentUserIsPainting) {
          this.addReadOnlyJiggle()
        }
      }
      if (mutation.type === 'triggerReadOnlyJiggle') {
        this.addReadOnlyJiggle()
      }
    })
  },
  mounted () {
    window.addEventListener('scroll', this.updatePositionInVisualViewport)
  },
  computed: {
    shouldShowNewStuffIsUpdated () {
      const newStuffIsUpdated = this.$store.state.newStuffIsUpdated
      const isNotDefaultSpace = !this.$store.getters['currentSpace/isHelloKinopio']
      const userCanEditSpace = this.$store.getters['currentUser/canEditSpace']()
      return newStuffIsUpdated && isNotDefaultSpace && userCanEditSpace
    },
    userCanEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    importArenaChannelIsVisible () { return this.$store.state.importArenaChannelIsVisible },
    currentSpace () { return this.$store.state.currentSpace },
    currentUser () { return this.$store.state.currentUser },
    currentUserIsSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    users () {
      let users = utils.clone(this.currentSpace.users)
      return users.filter(user => user.id !== this.currentUser.id)
    },
    collaborators () {
      let collaborators = this.currentSpace.collaborators
      return collaborators.filter(user => user.id !== this.currentUser.id)
    },
    spectators () { return this.currentSpace.spectators },
    userIsUpgraded () { return this.$store.state.currentUser.isUpgraded },
    currentSpaceName () {
      const id = this.$store.state.currentSpace.id
      const name = this.$store.state.currentSpace.name
      if (name) {
        return name
      } else {
        return `Space ${id}`
      }
    },
    currentUserIsSignedIn () {
      return this.$store.getters['currentUser/isSignedIn']
    },
    isLoadingSpace () {
      return this.$store.state.isLoadingSpace
    },
    isOnline () {
      return this.$store.state.isOnline
    },
    currentSpaceIsTemplate () {
      const id = this.$store.state.currentSpace.id
      const templateSpaceIds = templates.spaces().map(space => space.id)
      return templateSpaceIds.includes(id)
    },
    spaceIsNotClosed () {
      const space = this.$store.state.currentSpace
      return space.privacy !== 'closed'
    },
    privacyIcon () {
      const space = this.$store.state.currentSpace
      const privacyState = privacy.states().find(state => {
        return state.name === space.privacy
      })
      if (!privacyState) { return }
      return require(`@/assets/${privacyState.icon}.svg`)
    },
    privacyName () {
      const space = this.$store.state.currentSpace
      const privacyState = privacy.states().find(state => {
        return state.name === space.privacy
      })
      if (!privacyState) { return }
      return privacyState.name
    },
    shouldShowInExplore () {
      const privacy = this.$store.state.currentSpace.privacy
      if (privacy === 'private') { return false }
      return this.$store.state.currentSpace.showInExplore
    },
    visualViewportPosition () {
      if (this.pinchZoomScale === 1) { return }
      if (this.pinchZoomScale > 1) {
        return {
          transform: `translate(${this.pinchZoomOffsetLeft}px, ${this.pinchZoomOffsetTop}px) scale(${1 / this.pinchZoomScale})`,
          'transform-origin': 'left top'
        }
      } else {
        return {
          transform: `translate(${this.pinchZoomOffsetLeft}px, ${this.pinchZoomOffsetTop}px)`,
          zoom: 1 / this.pinchZoomScale,
          'transform-origin': 'left top'
        }
      }
    }
  },
  methods: {
    addReadOnlyJiggle () {
      const element = this.$refs.readOnly
      if (!element) { return }
      this.readOnlyJiggle = true
      element.addEventListener('animationend', this.removeReadOnlyJiggle, false)
    },
    removeReadOnlyJiggle () {
      this.readOnlyJiggle = false
    },
    closeAllDialogs () {
      this.aboutIsVisible = false
      this.spaceDetailsIsVisible = false
      this.signUpOrInIsVisible = false
      this.shareIsVisible = false
      this.keyboardShortcutsIsVisible = false
      this.upgradeUserIsVisible = false
    },
    updatePositionFrame () {
      currentIteration++
      this.updatePositionInVisualViewport()
      if (currentIteration < maxIterations) {
        window.requestAnimationFrame(this.updatePositionFrame)
      } else {
        window.cancelAnimationFrame(updatePositionTimer)
        updatePositionTimer = undefined
      }
    },
    updatePositionInVisualViewport () {
      if (!window.visualViewport) { return }
      this.pinchZoomScale = window.visualViewport.scale
      this.pinchZoomOffsetLeft = window.visualViewport.offsetLeft
      this.pinchZoomOffsetTop = window.visualViewport.offsetTop
    },
    toggleAboutIsVisible () {
      const isVisible = this.aboutIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.aboutIsVisible = !isVisible
    },
    toggleSpaceDetailsIsVisible () {
      const isVisible = this.spaceDetailsIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.spaceDetailsIsVisible = !isVisible
    },
    toggleSignUpOrInIsVisible () {
      const isVisible = this.signUpOrInIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.signUpOrInIsVisible = !isVisible
    },
    toggleShareIsVisible () {
      const isVisible = this.shareIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.shareIsVisible = !isVisible
    },
    setLoadingSignUpOrIn (value) {
      this.loadingSignUpOrIn = value
    },
    triggerUpgradeUserIsVisible () {
      const isVisible = this.upgradeUserIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.upgradeUserIsVisible = !isVisible
    }
  }
}
</script>

<style lang="stylus">
header
  pointer-events none
  position fixed
  top 0
  user-select none
  z-index var(--max-z)
  width 100%
  padding 8px
  display flex
  justify-content space-between
  nav,
  aside
    pointer-events none
    position relative
    display -webkit-box
    > *
      pointer-events all
  nav
    display flex
  .logo-about
    position relative
    display inline-block
    margin-right 6px
    > .button-wrap
      > .keyboard-shortcuts
        max-height calc(100vh - 120px)
        top calc(100% - 6px)

  .logo
    cursor pointer
    display flex
    > .logo-image
      min-width 45px
    img
      vertical-align middle
    .down-arrow
      padding-left 4px
    &:hover,
    &:focus
      .label-badge
        transform translateY(2px)
      .down-arrow
        transform translateY(3px)
    &:active,
    &.active
      .down-arrow
        transform translateY(5px)
  .space-details-wrap
    max-width 250px
    margin-top 8px
    @media(max-width 414px)
      max-width calc(100vw - 200px)
    button
      white-space nowrap
      overflow hidden
      text-overflow ellipsis
      max-width 100%
    dialog
      max-width initial
    .button-wrap
      > button
        .privacy-icon
          margin-left 6px

  aside
    display flex
    flex-direction column
  .top
    display flex
    flex-direction row-reverse
    > .users
      padding-right 6px
      max-width 40vw
      display flex
      flex-wrap wrap
      justify-content flex-end
      align-content flex-start

  .bottom
    margin-top 5px
    display flex
    justify-content flex-end
    > .button-wrap
      display inline-block

  button
    .explore
      display inline-flex
      margin 0
      margin-left 6px
      min-height auto
      height 14px
      vertical-align -1px

  .badge-wrap
    position relative
    display inline

  .invisible
    visibility hidden

  .invisible-badge
    display block !important
    position absolute
    left 0
    top -2px

  .users
    > .upgrade-user
      max-height calc(100vh - 50px)

.badge-jiggle
  animation-name notificationJiggle
  animation-duration 0.4s
  animation-iteration-count 1
  animation-direction forward
  animation-fill-mode forwards
  animation-timing-function ease-out
@keyframes notificationJiggle
  0%
    transform rotate(0deg)
  25%
    transform rotate(-4deg)
  50%
    transform rotate(3deg)
  75%
    transform rotate(-4deg)
  100%
    transform rotate(0deg)
</style>
