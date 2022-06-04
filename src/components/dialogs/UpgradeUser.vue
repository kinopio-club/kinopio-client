<template lang="pug">
dialog.upgrade-user.narrow(v-if="visible" :open="visible" @click.left.stop @keydown.stop :class="{'right-side': dialogOnRight}" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    .row
      p Upgrade your account for unlimited cards and uploads
    .row
      .segmented-buttons
        button(:class="{active: priceIsMonthly}" @click.left="togglePriceIsMonthly(true)") $6/month
        button(:class="{active: !priceIsMonthly}" @click.left="togglePriceIsMonthly(false)") $60/year
          .badge.label-badge -17%
    .should-sign-up(v-if="!currentUserIsSignedIn")
      p To upgrade your account, you'll need to sign up first
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In

    Checkout(:visible="currentUserIsSignedIn" :isAccountUpgrade="true" :priceIsMonthly="priceIsMonthly")

  section(v-if="currentUserIsSignedIn")
    img.icon(src="@/assets/lock.svg")
    span Payments securely processed by Stripe. Card info is not sent to Kinopio.

</template>

<script>
import Checkout from '@/components/Checkout.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

export default {
  name: 'UpgradeUser',
  components: {
    Loader,
    Checkout
  },
  props: {
    visible: Boolean,
    dialogOnRight: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
  },
  data () {
    return {
      dialogHeight: null,
      priceIsMonthly: true
    }
  },
  computed: {
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
  },
  methods: {
    shouldHideFooter (event) {
      const isTouchDevice = this.$store.state.isTouchDevice
      if (!isTouchDevice) { return }
      this.$store.commit('shouldHideFooter', true)
    },
    triggerSignUpOrInIsVisible () {
      this.$store.commit('closeAllDialogs', 'UpgradeUser.triggerSignUpOrInIsVisible')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    },
    togglePriceIsMonthly (value) {
      this.priceIsMonthly = value
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
      }
    }
  }
}
</script>

<style lang="stylus">
.upgrade-user
  overflow auto
  max-height calc(100vh - 210px)
  &.right-side
    left initial
    right 8px
  .user
    margin-right 6px
    vertical-align middle
  .summary
    margin-top 10px
    margin-bottom 10px
  .badge
    display inline-block
  .loading-stripe,
  .badge.danger
    margin-bottom 10px
  button
    position relative
  .label-badge
    color var(--primary-background)
    font-size 12px
    min-height initial
    position absolute
    left initial
    right -15px
    top -6px
    margin 0
</style>
