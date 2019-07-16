<template lang="pug">
header
  nav
    img.logo(alt="logo" src="@/assets/logo.png" width="50" height="45")
  aside
    .users
      .user.anon-avatar(:style="{backgroundColor: currentUser.color}")
</template>

<script>
export default {
  name: 'Header',
  computed: {
    currentUser () {
      return this.$store.state.currentUser
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
    cursor pointer
    float right
</style>
