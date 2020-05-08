<template lang="pug">
header
  nav
    .logo-about
      .button-wrap
        .logo(alt="kinopio logo" @click.stop="toggleAboutIsVisible" @touchend.stop @mouseup.stop :class="{active : aboutIsVisible}" tabindex="0")
          .logo-image
            .label-badge(v-if="shouldShowNewStuffIsUpdated")
              span NEW
          img.down-arrow(src="@/assets/down-arrow.svg")
        About(:visible="aboutIsVisible")
    .space-details-wrap
      .button-wrap
        button(@click.stop="toggleSpaceDetailsIsVisible" :class="{active : spaceDetailsIsVisible}")
          .badge.info.template-badge(v-show="currentSpaceIsTemplate")
            span Template
          span {{currentSpaceName}}
          img.icon.privacy-icon(v-if="spaceIsNotClosed" :src="privacyIcon" :class="privacyName")
          .badge.status.explore(v-if="shouldShowInExplore")
            img.icon(src="@/assets/checkmark.svg")
          Loader(:visible="isLoadingSpace")
        SpaceDetails(:visible="spaceDetailsIsVisible")
        ImportArenaChannel(:visible="importArenaChannelIsVisible")
        KeyboardShortcuts(:visible="keyboardShortcutsIsVisible")

  aside
    .top
      // Share
      .button-wrap
        button(@click.stop="toggleShareIsVisible" :class="{active : shareIsVisible}")
          span Share
        Share(:visible="shareIsVisible")

      .users
        User(v-for="user in users" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0")

      .users.spectators
        User(v-for="user in spectators" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0")

    .bottom
      ResetPassword
      // Sign Up or In
      .button-wrap(v-if="!currentUserIsSignedIn && isOnline")
        button(@click.stop="toggleSignUpOrInIsVisible" :class="{active : signUpOrInIsVisible}")
          span Sign Up or In
          Loader(:visible="loadingSignUpOrIn")
        SignUpOrIn(:visible="signUpOrInIsVisible" @loading="setLoadingSignUpOrIn")

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
import privacy from '@/spaces/privacy.js'
import utils from '@/utils.js'

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
    KeyboardShortcuts
  },
  data () {
    return {
      aboutIsVisible: false,
      spaceDetailsIsVisible: false,
      signUpOrInIsVisible: false,
      shareIsVisible: false,
      loadingSignUpOrIn: false,
      keyboardShortcutsIsVisible: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.aboutIsVisible = false
        this.spaceDetailsIsVisible = false
        this.signUpOrInIsVisible = false
        this.shareIsVisible = false
        this.keyboardShortcutsIsVisible = false
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
    })
  },
  computed: {
    shouldShowNewStuffIsUpdated () {
      const newStuffIsUpdated = this.$store.state.newStuffIsUpdated
      const isNotDefaultSpace = !this.$store.getters['currentSpace/isHelloKinopio']
      const userCanEditSpace = this.$store.getters['currentUser/canEditSpace']()
      return newStuffIsUpdated && isNotDefaultSpace && userCanEditSpace
    },
    importArenaChannelIsVisible () { return this.$store.state.importArenaChannelIsVisible },
    users () {
      const currentUser = this.$store.state.currentUser
      const currentSpace = this.$store.state.currentSpace
      const collaborators = currentSpace.collaborators
      const currentUserIsSpaceMember = this.$store.getters['currentUser/isSpaceMember']()
      let users
      users = utils.clone(currentSpace.users)
      if (collaborators) {
        collaborators.forEach(collaborator => users.push(collaborator))
      }
      if (currentUserIsSpaceMember) {
        users = users.filter(user => user.id !== currentUser.id)
        users.unshift(currentUser)
      }
      return users
    },
    spectators () {
      const currentUser = this.$store.state.currentUser
      const currentUserIsSpaceMember = this.$store.getters['currentUser/isSpaceMember']()
      let spectators = utils.clone(this.$store.state.currentSpace.spectators || [])
      if (!currentUserIsSpaceMember) {
        spectators.unshift(currentUser)
      }
      return spectators
    },
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
    }
  },
  methods: {
    toggleAboutIsVisible () {
      const isVisible = this.aboutIsVisible
      this.$store.commit('closeAllDialogs')
      this.aboutIsVisible = !isVisible
    },
    toggleSpaceDetailsIsVisible () {
      const isVisible = this.spaceDetailsIsVisible
      this.$store.commit('closeAllDialogs')
      this.spaceDetailsIsVisible = !isVisible
    },
    toggleSignUpOrInIsVisible () {
      const isVisible = this.signUpOrInIsVisible
      this.$store.commit('closeAllDialogs')
      this.signUpOrInIsVisible = !isVisible
    },
    toggleShareIsVisible () {
      const isVisible = this.shareIsVisible
      this.$store.commit('closeAllDialogs')
      this.shareIsVisible = !isVisible
    },
    setLoadingSignUpOrIn (value) {
      this.loadingSignUpOrIn = value
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
      width calc(100vw - 200px)
    button
      white-space nowrap
      overflow hidden
      text-overflow ellipsis
      max-width 100%
    dialog
      max-width initial
    .button-wrap
      > .keyboard-shortcuts
        max-height calc(100vh - 100px)
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
</style>
