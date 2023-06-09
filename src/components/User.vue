<template lang="pug">
.user(:title="user.name" :data-user-id="userId" :key="userId" ref="user" @keydown.stop.enter="toggleUserDetailsIsVisible" :class="{active: userDetailsIsVisibleForUser, 'is-small': isSmall }")
  .user-avatar(
    @mouseup.left.stop="toggleUserDetailsIsVisible"
    @touchend.stop="toggleUserDetailsIsVisible"
    ref="user"
    :class="{ clickable: isClickable }"
    :style="{backgroundColor: userColor}"
  )
    img.anon-avatar(src="@/assets/anon-avatar.svg" :class="{ 'is-dark': colorIsDark }")
  .label-badge.you-badge.small-badge(v-if="isCurrentUser && !hideYouLabel")
    span YOU
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
    isSmall: Boolean
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
    userDetailsIsVisibleForUser () { return this.userDetailsIsVisible && this.userDetailsIsUser },
    colorIsDark () { return utils.colorIsDark(this.userColor) }
  },
  methods: {
    toggleUserDetailsIsVisible () {
      const isVisible = this.userDetailsIsVisibleForUser
      if (this.shouldCloseAllDialogs) {
        this.$store.dispatch('closeAllDialogs')
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
        options.transformOriginIsTopRight = true
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
    width 28px
    height 28px
    border-radius var(--entity-radius)
    pointer-events none
    background-color var(--secondary-active-background)
    &:hover,
    &:focus
      box-shadow var(--button-hover-shadow)
    &:active,
    &.active
      box-shadow var(--button-active-inset-shadow)
    &.clickable
      cursor pointer
      pointer-events all
  &.is-small
    .user-avatar
      width 17px
      height 16px
      .anon-avatar
        left 3px
        top 5px
        width 10.5px

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
      height 14px
      margin-top -2px
      .anon-avatar
        left 2px
        top 3px
        width 10.5px

</style>
