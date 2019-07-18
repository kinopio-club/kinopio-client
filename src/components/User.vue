<template lang="pug">
.user.anon-avatar(:style="{backgroundColor: user.color}" @click="showUserDetails" @touchend.stop="showUserDetails" ref="user")
  template(v-if="clickable")
    UserDetails(:user="user" :detailsOnRight="detailsOnRight")
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
    detailsOnRight: Boolean
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
