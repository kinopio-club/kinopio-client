<template lang="pug">
.user
  .user-avatar.anon-avatar(
    @mouseup.stop="toggleUserDetails"
    @touchend.stop="toggleUserDetails"
    ref="user"
    :class="{ clickable: clickable }"
    :style="{backgroundColor: user.color}"
  )
  template(v-if="clickable")
    UserDetails(:visible="userDetailsIsVisible" :user="user" :detailsOnRight="detailsOnRight")
</template>

<script>
import UserDetails from '@/components/dialogs/UserDetails.vue'

export default {
  name: 'User',
  components: {
    UserDetails
  },
  props: {
    clickable: Boolean,
    user: Object,
    detailsOnRight: Boolean,
    shouldCloseAllDialogs: Boolean
  },
  data () {
    return {
      userDetailsIsVisible: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.userDetailsIsVisible = false
      }
    })
  },
  methods: {
    // displaySide () {
    //     //   const dialogFromRight = this.$refs.user.getBoundingClientRect().right
    //     //   const viewportWidth = this.$store.state.viewportWidth
    //     //   const dialogWidth = 200 + 8
    //     //   const isEnoughSpaceOnTheRight = Boolean((viewportWidth - dialogFromRight) < dialogWidth)
    //     //   this.detailsIsOnRightSide = isEnoughSpaceOnTheRight
    //     // }
    // },
    toggleUserDetails () {
      if (!this.clickable) { return }
      if (this.shouldCloseAllDialogs) {
        this.$store.commit('closeAllDialogs')
      }
      this.userDetailsIsVisible = !this.userDetailsIsVisible
    }
  }
}
</script>

<style lang="stylus">
.user-avatar
  width 24px
  height 24px
  background-repeat no-repeat
  background-position center
  border-radius 3px
  &:hover,
  &:focus
    box-shadow var(--button-hover-shadow)
  &:active
    box-shadow var(--button-active-inset-shadow)
  &.clickable
    cursor pointer
</style>
