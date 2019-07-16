<template lang="pug">
.user.anon-avatar(:style="{backgroundColor: user.color}" @click="showUserDetails")
  template(v-if="clickable")
    UserDetails(:user="user")
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
    user: Object
  },
  methods: {
    showUserDetails () {
      if (this.clickable) {
        this.$store.commit('userDetailsIsVisible', true)
      }
    }
  }
}
</script>

<style lang="stylus">
.user
  width 22px
  height 22px
  background-repeat no-repeat
  background-position center
  border-radius 3px

</style>
