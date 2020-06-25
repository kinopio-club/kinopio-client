<template lang="pug">
dialog.narrow(v-if="visible" :open="visible" @click.stop)
  section
    p User Billing
    //- billing info, from stripe?
  section
    p yolo yolo

</template>

<script>
import Loader from '@/components/Loader.vue'

export default {
  name: 'UserBilling',
  components: {
    Loader
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      loading: {
        stripeInfo: false
      }
    }
  },
  computed: {
    // isSignedIn () {
    //   return this.$store.getters['currentUser/isSignedIn']
    // }
  },
  methods: {
    // toggleRemoveAllConfirmationVisible () {
    //   this.removeAllConfirmationVisible = !this.removeAllConfirmationVisible
    // },
    // async removeUserPermanent () {
    //   this.loading.removeUserPermanent = true
    //   await this.$store.dispatch('api/removeUserPermanent')
    //   this.loading.removeUserPermanent = false
    //   this.$emit('removeUser')
    // }
  }
  // watch: {
  //   visible (value) {
  //     if (value) {
  //     }
  //   }
  // }
}
</script>

<style lang="stylus">
</style>
