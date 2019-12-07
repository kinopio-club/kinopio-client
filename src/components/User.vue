<template lang="pug">
.user(:data-user-id="user.id")
  .user-avatar.anon-avatar(
    @mouseup.stop="toggleUserDetails"
    @touchend.stop="toggleUserDetails"
    ref="user"
    :class="{ clickable: isClickable, active: userDetailsIsVisible }"
    :style="{backgroundColor: user.color}"
  )
  template(v-if="isClickable")
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
    isClickable: Boolean,
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
      const isVisible = this.userDetailsIsVisible
      if (this.shouldCloseAllDialogs) {
        this.$store.commit('closeAllDialogs')
      }
      this.userDetailsIsVisible = !isVisible
    }
  }
}
</script>

<style lang="stylus">
.user
  display inline-block
  position relative
  .user-avatar
    width 24px
    height 24px
    background-repeat no-repeat
    background-position center
    border-radius 3px
    pointer-events none
    &:hover,
    &:focus
      box-shadow var(--button-hover-shadow)
    &:active
      box-shadow var(--button-active-inset-shadow)
    &.clickable
      cursor pointer
      pointer-events all
    &.active
      box-shadow var(--button-active-inset-shadow)
</style>
