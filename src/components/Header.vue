<template lang="pug">
header
  nav
    .logo-about
      .logo(alt="kinopio logo" @click.stop="toggleAboutIsVisible" @touchend.stop @mouseup.stop :class="{active : aboutIsVisible}")
        .logo-image
        img.down-arrow(src="@/assets/down-arrow.svg")
      About(:visible="aboutIsVisible")
    .button-wrap.space-details-wrap
      button(@click.stop="toggleSpaceDetailsIsVisible" :class="{active : spaceDetailsIsVisible}")
        .badge.info.template-badge(v-show="currentSpaceIsTemplate")
          span Template
        span {{currentSpaceName}}
        //- todo abs position on button
        Loader(:visible="isLoadingSpace")
      SpaceDetails(:visible="spaceDetailsIsVisible")

    button.search-button(@click.stop="toggleSearchIsVisible" :class="{active : searchIsVisible}")
      img.icon.search(src="@/assets/search.svg")

  aside
    .top
      // Share
      .button-wrap
        button(@click.stop="toggleShareIsVisible" :class="{active : shareIsVisible}")
          span Share
        Share(:visible="shareIsVisible")

      .users
        User(v-for="user in users" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true")

    .bottom
      ResetPassword
      // Sign Up or In
      .button-wrap(v-if="!userIsSignedIn && isOnline")
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

export default {
  name: 'Header',
  components: {
    About,
    SpaceDetails,
    User,
    SignUpOrIn,
    ResetPassword,
    Share,
    Loader
  },
  data () {
    return {
      aboutIsVisible: false,
      spaceDetailsIsVisible: false,
      signUpOrInIsVisible: false,
      shareIsVisible: false,
      loadingSignUpOrIn: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.aboutIsVisible = false
        this.spaceDetailsIsVisible = false
        this.signUpOrInIsVisible = false
        this.shareIsVisible = false
      }
      if (mutation.type === 'triggerSpaceDetailsVisible') {
        this.spaceDetailsIsVisible = true
      }
      if (mutation.type === 'triggerSignUpOrInIsVisible') {
        this.signUpOrInIsVisible = true
      }
    })
  },
  computed: {
    users () {
      const currentUser = this.$store.state.currentUser
      const spaceUsers = this.$store.state.currentSpace.users
      const users = spaceUsers.filter(user => user.id !== currentUser.id)
      users.unshift(currentUser)
      return users
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
    userIsSignedIn () {
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
      const templateSpaceIds = templates.spaces().map(space => space.spaceId)
      return templateSpaceIds.includes(id)
    },
    searchIsVisible () {
      return this.$store.state.searchIsVisible
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
    },
    toggleSearchIsVisible () {
      console.log('serach toggled')
      // subscribe and set a global event
      const isVisible = this.$store.state.searchIsVisible
      this.$store.commit('closeAllDialogs')
      this.$store.commit('searchIsVisible', !isVisible)
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
  z-index 12
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
    margin-right 6px
    flex-grow 2
  .users
      margin-right 6px
  .logo-about
    position relative
    display inline-block
    margin-right 6px
  .logo
    cursor pointer
    img
      vertical-align middle
    .down-arrow
      padding-left 4px
    &:hover
      .down-arrow
        transform translateY(3px)
    &:active,
    &.active
      .down-arrow
        transform translateY(5px)
  .space-details-wrap
    max-width 250px
    @media(max-width 414px)
      width calc(100vw - 200px)
    button
      white-space nowrap
      overflow hidden
      text-overflow ellipsis
      max-width 100%
    dialog
      max-width initial
  aside
    display flex
    flex-direction column
  .top
    display flex
    flex-direction row-reverse
  .bottom
    margin-top 5px
    display flex
    justify-content flex-end
    > .button-wrap
      display inline-block

  .search-button
    margin-left 6px

</style>
