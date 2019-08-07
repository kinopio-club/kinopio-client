<template lang="pug">
header
  nav
    .logo-about
      .logo(@click.stop="toggleAboutIsVisible" @touchend.stop @mouseup.stop :class="{active : aboutIsVisible}")
        img(src="@/assets/logo.png" width="50" height="45" alt="kinopio logo")
        img.down-arrow(src="@/assets/down-arrow.svg")
      About(:visible="aboutIsVisible")
    //.button-wrap
    //  button(@click.stop="toggleSpaceDetailsIsVisible" :class="{active : spaceDetailsIsVisible}")
    //    img.icon.space-moon(src="@/assets/space-moon.svg")
    //    span {{currentSpaceName}}
    //  SpaceDetails(:visible="spaceDetailsIsVisible")

  aside
    User(:user="currentUser" :clickable="true" :detailsOnRight="true" :key="currentUser.id" :shouldCloseAllDialogs="true")
</template>

<script>
import About from '@/components/dialogs/About.vue'
import SpaceDetails from '@/components/dialogs/SpaceDetails.vue'
import User from '@/components/User.vue'

export default {
  name: 'Header',
  components: {
    About,
    SpaceDetails,
    User
  },
  data () {
    return {
      aboutIsVisible: false,
      spaceDetailsIsVisible: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.aboutIsVisible = false
        this.spaceDetailsIsVisible = false
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
      if (name.length) {
        return name
      } else {
        return `space-${id}`
      }
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
  z-index calc(var(--max-z) - 1)
  width 100%
  padding 8px
  display flex
  justify-content space-between
  nav,
  aside
    pointer-events all
  .user
    float right
    position relative
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

</style>
