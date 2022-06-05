<template lang="pug">
dialog.donate.narrow(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p Donate
  section
    p As you may know, Kinopio is built by me, Pirijan.
    p Donations help support me. I'm grateful and flattered that you're even here.
    p
      span You'll also get a {{' '}}
      span.badge.donor
        span Donor
      span badge on your user profile
    p
      .segmented-buttons
        button(@click="updateAmount(5)" :class="{ active: this.currentAmount === 5 }")
          span $5
        button(@click="updateAmount(20)" :class="{ active: this.currentAmount === 20 }")
          span $20
        button(@click="updateAmount(50)" :class="{ active: this.currentAmount === 50 }")
          span $50
        button(@click="toggleCustomAmountIsVisible" :class="{ active: customAmountIsVisible }")
          span Custom

    p(v-if="customAmountIsVisible")
      .row
        span $
        input.name.user-details-name(placeholder="100" v-model="customAmount" ref="input" type="number")

    template(v-if="currentAmount")
      p
        .row
          User(:user="currentUser" :isClickable="false" :hideYouLabel="true" :key="currentUser.id")
          .badge.info
            span ${{currentAmount}}/once
      button
        span Donate
        //- Loader(:visible="isLoading")
      p You'll be billed ${{currentAmount}}, using the payment method you used to upgrade

</template>

<script>
import User from '@/components/User.vue'

export default {
  name: 'Donate',
  components: {
    User
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      customAmountIsVisible: false,
      currentAmount: 0,
      isLoading: false
    }
  },
  computed: {
    customAmount: {
      get () {
        return this.currentAmount
      },
      set (value) {
        value = parseInt(value)
        this.currentAmount = value
      }
    },
    currentUser () { return this.$store.state.currentUser }
  },
  methods: {
    toggleCustomAmountIsVisible (value) {
      value = !this.customAmountIsVisible
      this.customAmountIsVisible = value
      if (!value) { return }
      this.$nextTick(() => {
        const element = this.$refs.input
        const length = this.currentAmount.toString().length
        element.focus()
        element.setSelectionRange(0, length)
      })
    },
    updateAmount (value) {
      this.currentAmount = value
      this.customAmountIsVisible = false
    },
    donate () {
      this.isLoading = true
      try {
        // const result = await this.$store.dispatch('api/donate', {
        //   value: parseInt(this.currentAmount)
        // })
        // console.log('🚛', result)
      } catch (error) {
        console.error('🚒', error)
        // this.error =
      }
      this.isLoading = false
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.currentAmount = 0
      }
    }
  }
}
</script>

<style lang="stylus">
dialog.donate
  overflow auto
  max-height calc(100vh - 210px)
  left initial
  right 8px
  .summary
    margin-top 10px
    margin-bottom 10px
  .badge
    display inline-block
  .user
    margin-right 6px
  .donor
    background-color var(--user-badge-donor)
</style>
