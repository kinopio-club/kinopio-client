<template lang="pug">
.user(:data-user-id="userId" :key="userId" ref="element" @keydown.stop.enter="toggleUserDetails" :class="{ active: userDetailsIsVisible}")
  .user-avatar.anon-avatar(
    @mouseup.left.stop="toggleUserDetails"
    @touchend.stop="toggleUserDetails"
    ref="user"
    :class="{ clickable: isClickable, active: userDetailsIsVisible, 'is-small': isSmall }"
    :style="{backgroundColor: userColor}"
  )
    .label-badge.you-badge(v-if="isCurrentUser && !hideYouLabel")
      span YOU
    .label-badge(v-if="labelBadge")
      span {{labelBadge}}
  template(v-if="isClickable")
    UserDetails(:visible="userDetailsIsVisible" :user="user" :detailsOnRight="detailsOnRight")
</template>

<script>
import UserDetails from '@/components/dialogs/UserDetails.vue'

let unsubscribe

export default {
  name: 'User',
  components: {
    UserDetails
  },
  props: {
    isClickable: Boolean,
    user: Object,
    detailsOnRight: Boolean,
    shouldCloseAllDialogs: Boolean,
    hideYouLabel: Boolean,
    isSmall: Boolean,
    labelBadge: String
  },
  data () {
    return {
      userDetailsIsVisible: false
    }
  },
  mounted () {
    unsubscribe = this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.userDetailsIsVisible = false
      }
    })
  },
  beforeUnmount () {
    unsubscribe()
  },
  computed: {
    userId () {
      if (!this.user) { return }
      return this.user.id
    },
    userColor () {
      if (!this.user) { return }
      return this.user.color
    },
    isCurrentUser () {
      if (!this.user) { return }
      return this.user.id === this.$store.state.currentUser.id
    }
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
        this.$store.dispatch('closeAllDialogs', 'User.toggleUserDetails')
      }
      this.$nextTick(() => {
        this.userDetailsIsVisible = !isVisible
      })
    }
  }
}
</script>

<style lang="stylus">
.user
  display inline-block
  position relative
  &:hover,
  &:active
    outline none
  &.active
    outline none
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
      .label-badge
        transform translateY(2px)
    &:active,
    &.active
      box-shadow var(--button-active-inset-shadow)
    &.clickable
      cursor pointer
      pointer-events all
    &.is-small
      width 17px
      height 16px
  .label-badge
    bottom -7px
    width initial
  .you-badge
    width 100%
button
  .user
    margin 0
    margin-right 6px
    vertical-align middle
    .user-avatar
      width 15px
      height 15px
      margin-top -2px
</style>
