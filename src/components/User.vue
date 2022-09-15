<template lang="pug">
.user(:data-user-id="userId" :key="userId" ref="user" @keydown.stop.enter="toggleUserDetailsIsVisible" :class="{active: userDetailsIsVisibleForUser}")
  .user-avatar.anon-avatar(
    @mouseup.left.stop="toggleUserDetailsIsVisible"
    @touchend.stop="toggleUserDetailsIsVisible"
    ref="user"
    :class="{ clickable: isClickable, 'is-small': isSmall }"
    :style="{backgroundColor: userColor}"
  )
    .label-badge.you-badge(v-if="isCurrentUser && !hideYouLabel")
      span YOU
    .label-badge(v-if="labelBadge")
      span {{labelBadge}}
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'User',
  props: {
    isClickable: Boolean,
    user: Object,
    detailsOnRight: Boolean,
    shouldCloseAllDialogs: Boolean,
    hideYouLabel: Boolean,
    isSmall: Boolean,
    labelBadge: String
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
    },
    userDetailsIsVisible () { return this.$store.state.userDetailsIsVisible },
    userDetailsIsUser () {
      const userDetailsUser = this.$store.state.userDetailsUser
      return this.user.id === userDetailsUser.id
    },
    userDetailsIsVisibleForUser () { return this.userDetailsIsVisible && this.userDetailsIsUser }
  },
  methods: {
    toggleUserDetailsIsVisible () {
      const isVisible = this.userDetailsIsVisibleForUser
      if (this.shouldCloseAllDialogs) {
        this.$store.dispatch('closeAllDialogs', 'User.toggleUserDetailsIsVisible')
      }
      if (isVisible) {
        this.$store.commit('userDetailsIsVisible', false)
        return
      }
      this.showUserDetails()
    },
    showUserDetails () {
      const element = this.$refs.user
      let options = { element, shouldIgnoreZoom: true }
      if (this.detailsOnRight) {
        options.offsetX = -190
      }
      const position = utils.childDialogPositionFromParent(options)
      this.$store.commit('userDetailsUser', this.user)
      this.$store.commit('userDetailsPosition', position)
      this.$store.commit('userDetailsIsVisible', true)
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
    background-color var(--secondary-active-background)
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
