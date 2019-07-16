<template lang="pug">
.user.anon-avatar(:style="{backgroundColor: user.color}" @click="showUserDetails" ref="user")
  template(v-if="clickable")
    UserDetails(:user="user" :detailsIsOnRightSide="detailsIsOnRightSide")
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
  data () {
    return {
      detailsIsOnRightSide: false
    }
  },
  methods: {
    showUserDetails () {
      if (this.clickable) {
        const dialogFromRight = this.$refs.user.getBoundingClientRect().right
        const clientWidth = this.$store.state.pageWidth
        const dialogWidth = 200 + 8
        this.detailsIsOnRightSide = Boolean((clientWidth - dialogFromRight) < dialogWidth)
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
