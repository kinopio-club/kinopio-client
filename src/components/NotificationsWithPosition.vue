<template lang="pug">
aside.notifications-with-position
  //- ^ click to force hide all notifications
  .item.badge.danger
    img.icon.cancel(src="@/assets/add.svg")
    span cray crayyy
</template>
<script>
export default {
  name: 'NotificationsWithPosition',
  created () {
    // this.$store.subscribe((mutation, state) => {
  }
}
</script>

<style lang="stylus">
.notifications-with-position
  .item
    position absolute
    top 310px // 0
    left 604px // 0
    z-index var(--max-z)
    pointer-events none
</style>
