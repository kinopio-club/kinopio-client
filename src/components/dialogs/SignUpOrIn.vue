<template lang="pug">
dialog.narrow.sign-up-or-in(v-if="visible" :open="visible")
  section
    .segmented-buttons
      button(@click="showIsSigningUp" :class="{active : isSigningUp}") Sign Up
      button(@click="hideIsSigningUp" :class="{active : !isSigningUp}") Sign In
  section(v-if="isSigningUp")
    .row
      p Create an account to share your spaces and access them anywhere
    form
      .row
        input(type="email" placeholder="Email" required)
      .row
        input(type="password" placeholder="Password" required)
      .row
        input(type="password" placeholder="Confirm Password" required)
      //.row
      //  label(:class="{active: isSignUpForNewsletter}" @click.prevent="toggleDefault")
      //    input(type="checkbox" v-model="isSignUpForNewsletter")
      //    span Monthly newsletter?
      button(type="submit") Sign Up

  section(v-else)
    form
      .row
        input(type="email" placeholder="Email" required)
      .row
        input(type="password" placeholder="Password" required)
      button(type="submit") Sign In

  //section
  //  .button-wrap
  //    a(href="#")
  //      button Privacy Policy and TOS →

</template>

<script>
// import cache from '@/cache.js'

export default {
  name: 'SignUpOrIn',
  props: {
    visible: Boolean
  },
  data () {
    return {
      isSigningUp: true
      // isSignUpForNewsletter: false
    }
  },
  // computed: {
  // },
  methods: {
    showIsSigningUp () {
      this.isSigningUp = true
    },
    hideIsSigningUp () {
      this.isSigningUp = false
    }

  }
  // watch: {
  //   visible (value) {
  //     if (value) {
  //       this.removeAllConfirmationVisible = false
  //     }
  //   }
  // }
}
</script>

<style lang="stylus">
.sign-up-or-in
  top calc(100% - 8px)
  left initial
  right 8px
</style>
