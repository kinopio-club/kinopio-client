<template lang="pug">
.user-label-inline.badge(:key="user.id" :data-id="user.id" :style="{ background: user.color }")
  .user-avatar.anon-avatar
  span.user-name(v-if="userHasName") {{ user.name }}
</template>

<script>
export default {
  name: 'UserLabelInline',
  props: {
    user: Object
  },
  computed: {
    userHasName () { return Boolean(this.user.name) }
  }
}
</script>

<style lang="stylus">
.user-label-inline
  display inline-block
  min-height initial
  padding 0 2px
  .anon-avatar
    width 15px
    height 15px
    display inline-block
    background-repeat no-repeat
    background-position center
    vertical-align middle
  .user-name
    margin-left 6px
</style>
