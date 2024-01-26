<template lang="pug">
.user-label-inline.badge(
  :key="user.id"
  :data-id="user.id"
  :style="{ background: user.color }"
  :class="{ 'button-badge': isClickable }"
  @mouseup="toggleUserDetailsIsVisible"
  @touchend="toggleUserDetailsIsVisible"
  ref="user"
  :title="title"
  @click.stop
)
  .user-avatar-inline(:class="{ 'is-on-dark-background': isOnDarkBackground }")
    img.anon-avatar(src="@/assets/anon-avatar.svg" :class="{ 'is-dark': colorIsDark }")
  span.user-name(v-if="userHasName && !shouldHideName" :class="{ 'is-dark': colorIsDark }") {{ user.name }}
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'UserLabelInline',
  props: {
    user: Object,
    isClickable: Boolean,
    shouldHideName: Boolean,
    title: String,
    isOnDarkBackground: Boolean
  },
  computed: {
    userHasName () { return Boolean(this.user.name) },
    colorIsDark () { return utils.colorIsDark(this.user.color) },
    userDetailsIsVisible () { return this.$store.state.userDetailsIsVisible },
    userDetailsIsUser () {
      const userDetailsUser = this.$store.state.userDetailsUser
      return this.user.id === userDetailsUser.id
    },
    userDetailsIsVisibleForUser () { return this.userDetailsIsVisible && this.userDetailsIsUser }
  },
  methods: {
    toggleUserDetailsIsVisible () {
      if (!this.isClickable) { return }
      event.stopPropagation()
      const isVisible = this.userDetailsIsVisibleForUser
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
.user-label-inline
  display inline-block
  min-height initial
  padding 0 2px
  background var(--secondary-background)
  &.is-on-dark-background
    background var(--secondary-active-background)
  .user-avatar-inline
    width 4px
    margin-right 4px
    display inline-block
    .anon-avatar
      left 4px
      top 8px
      width 10.5px
  .user-name
    margin-left 6px
    color var(--primary-on-light-background)
    &.is-dark
      color var(--primary-on-dark-background)

.button-badge
  .user-label-inline
    padding-bottom 0
    .anon-avatar
      top 6px
</style>
