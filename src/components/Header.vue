<template lang="pug">
header
  nav
    .logo-about
      .logo(@click.stop="toggleAboutIsVisible" @touchend.stop @mouseup.stop :class="{active : aboutIsVisible}")
        img(src="@/assets/logo.png" width="50" height="45" alt="kinopio logo")
        img.down-arrow(src="@/assets/down-arrow.svg")
      About(:visible="aboutIsVisible")
    .button-wrap.space-details
      button(@click.stop="toggleSpaceDetailsIsVisible" :class="{active : spaceDetailsIsVisible}")
        //img.icon.space-moon(src="@/assets/space-moon.svg")
        span {{currentSpaceName}}
        Loader(:visible="loadingSpace")
      SpaceDetails(:visible="spaceDetailsIsVisible")

  aside
    .top
      User(:user="currentUser" :clickable="true" :detailsOnRight="true" :key="currentUser.id" :shouldCloseAllDialogs="true")
      //- .button-wrap.share
      //-   button Share
    .bottom
      .button-wrap.sign-up-in(v-if="!userIsSignedIn && isBeta && isOnline")
        button(@click.stop="toggleSignUpOrInIsVisible" :class="{active : signUpOrInIsVisible}") Sign Up or In
        SignUpOrIn(:visible="signUpOrInIsVisible")

</template>

<script>
import About from '@/components/dialogs/About.vue'
import SpaceDetails from '@/components/dialogs/SpaceDetails.vue'
import User from '@/components/User.vue'
import SignUpOrIn from '@/components/dialogs/SignUpOrIn.vue'
import Loader from '@/components/Loader.vue'

export default {
  name: 'Header',
  components: {
    About,
    SpaceDetails,
    User,
    SignUpOrIn,
    Loader
  },
  data () {
    return {
      aboutIsVisible: false,
      spaceDetailsIsVisible: false,
      signUpOrInIsVisible: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.aboutIsVisible = false
        this.spaceDetailsIsVisible = false
        this.signUpOrInIsVisible = false
      }
      if (mutation.type === 'triggerSpaceDetailsVisible') {
        this.spaceDetailsIsVisible = true
      }
    })
  },
  computed: {
    currentUser () {
      return this.$store.state.currentUser
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
    loadingSpace () {
      return this.$store.state.loadingSpace
    },
    isBeta () {
      return this.$store.state.isBeta
    },
    isOnline () {
      return this.$store.state.isOnline
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
    pointer-events all
    position relative
    display -webkit-box
  nav
    margin-right 6px
    flex-grow 2
  .user
    float right
    position relative
    margin-bottom 5px
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
  .space-details
    max-width 250px
    @media(max-width 414px)
      width calc(100% - 70px)
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
  .sign-up-in
    display block
  .share
    float right
    margin-right 6px
</style>
