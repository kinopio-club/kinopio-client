<template lang="pug">
header
  nav
    .logo
      img(
        alt="kinopio logo"
        src="@/assets/logo.png"
        width="50"
        height="45"
        @click.stop="toggleAboutIsVisible"
        @touchend.stop
        @mouseup.stop
      )
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
  .logo
    position relative
    img
      cursor pointer
</style>
