<template lang="pug">
dialog.narrow.dialog-name(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p Connect to Twitter

  section(v-if="!currentUserIsSignedIn")
    p
      span.badge.info Sign Up or In
      span to save tweet threads to Kinopio
    button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In

  section(v-if="currentUserIsSignedIn")
    p what it does, instruction
    p twitter user name (input v-model)
    p badge confirmation, ready to save threads
</template>

<script>
export default {
  name: 'ConnectToTwitter',
  props: {
    visible: Boolean
  },
  data () {
    return {
    }
  },
  computed: {
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
  },
  methods: {
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'ConnectToTwitter')
      this.$store.commit('triggerSignUpOrInIsVisible')
    }
  }
}
</script>

<style lang="stylus">
// dialog.dialog-name
</style>
