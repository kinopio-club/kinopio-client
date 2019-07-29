<template lang="pug">
header
  nav
    .logo-about
      .logo(@click.stop="toggleAboutIsVisible" @touchend.stop @mouseup.stop)
        img(src="@/assets/logo.png" width="50" height="45" alt="kinopio logo")
        img.down-arrow(src="@/assets/down-arrow.svg")
      About(:visible="aboutIsVisible")

  aside
    User(:user="currentUser" :clickable="true" :detailsOnRight="true" :key="currentUser.id")
</template>

<script>
import About from '@/components/dialogs/About.vue'
import User from '@/components/User.vue'

export default {
  name: 'Header',
  components: {
    About,
    User
  },
  data () {
    return {
      aboutIsVisible: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.aboutIsVisible = false
      }
    })
  },
  computed: {
    currentUser () {
      return this.$store.state.currentUser
    }
  },
  methods: {
    toggleAboutIsVisible () {
      const isVisible = this.aboutIsVisible
      this.aboutIsVisible = !isVisible
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
  .logo
    cursor pointer
    img
      vertical-align middle
    .down-arrow
      transition 0.1s transform
      padding-left 4px
    &:hover
      .down-arrow
        transform translateY(3px)
    &:active
      .down-arrow
        transform translateY(5px)
</style>
