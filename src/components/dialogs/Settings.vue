<template lang="pug">
dialog.settings.narrow(v-if="visible" :open="visible" @click.stop)
  section
    p Settings
  section
    button(v-if="!removeAllConfirmationVisible" @click="toggleRemoveAllConfirmationVisible")
      img.icon(src="@/assets/remove.svg")
      span Remove All Your Data
    span(v-if="removeAllConfirmationVisible")
      p
        span.badge.danger Permanently remove
        span(v-if="isSignedIn") all your spaces and user data from this computer and Kinopio's servers?
        span(v-else) all your spaces and user data from this computer?
      .segmented-buttons
        button(@click="toggleRemoveAllConfirmationVisible")
          span Cancel
        button.danger(@click="removeUserPermanent")
          img.icon(src="@/assets/remove.svg")
          span Remove All
          Loader(:visible="loading.removeUserPermanent")

</template>

<script>
import api from '@/api.js'
import Loader from '@/components/Loader.vue'

export default {
  name: 'Settings',
  components: {
    Loader
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      removeAllConfirmationVisible: false,
      loading: {
        removeUserPermanent: false
      }
    }
  },
  computed: {
    isSignedIn () {
      return this.$store.getters['currentUser/isSignedIn']
    }
  },
  methods: {
    toggleRemoveAllConfirmationVisible () {
      this.removeAllConfirmationVisible = !this.removeAllConfirmationVisible
    },
    async removeUserPermanent () {
      this.loading.removeUserPermanent = true
      await api.removeUserPermanent()
      this.loading.removeUserPermanent = false
      this.$emit('removeUser')
    }
  },
  watch: {
    visible (value) {
      if (value) {
        this.removeAllConfirmationVisible = false
      }
    }
  }
}
</script>

<style lang="stylus">
</style>
