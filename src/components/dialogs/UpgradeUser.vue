<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UpgradeUserStripe from '@/components/UpgradeUserStripe.vue'
import UpgradeUserApple from '@/components/UpgradeUserApple.vue'
import UpgradeFAQ from '@/components/dialogs/UpgradeFAQ.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'

const store = useStore()
const dialog = ref(null)

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    } else if (mutation.type === 'triggerCloseChildDialogs') {
      closeUpgradeFAQ()
    }
  })
})

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  state.upgradeFAQIsVisible = false
  if (value) {
    console.log('🎡', 'isSecureAppContext', consts.isSecureAppContext, 'isSecureAppContextIOS', consts.isSecureAppContextIOS)
    updateDialogHeight()
    store.commit('shouldExplicitlyHideFooter', true)
  } else {
    store.commit('shouldExplicitlyHideFooter', false)
  }
})

const state = reactive({
  upgradeFAQIsVisible: false,
  dialogHeight: null,
  period: 'year' // year, life
})

const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const isSecureAppContextIOS = computed(() => consts.isSecureAppContextIOS)
const toggleUpgradeFAQIsVisible = () => {
  state.upgradeFAQIsVisible = !state.upgradeFAQIsVisible
}
const closeUpgradeFAQ = () => {
  state.upgradeFAQIsVisible = false
}
const studentDiscountIsAvailable = computed(() => store.state.currentUser.studentDiscountIsAvailable)
const paymentProcessor = computed(() => {
  if (isSecureAppContextIOS.value) {
    return 'Apple'
  } else {
    return 'Stripe'
  }
})

// price

const currentPrice = computed(() => {
  const isStudentDiscount = studentDiscountIsAvailable.value
  return consts.price(state.period, isStudentDiscount)
})
const monthlyPrice = computed(() => consts.price('month'))
const yearlyPrice = computed(() => {
  const isStudentDiscount = studentDiscountIsAvailable.value
  return consts.price('year', isStudentDiscount)
})
const yearlyDiscount = computed(() => {
  const base = monthlyPrice.value.amount * 12
  const yearly = yearlyPrice.value.amount
  // https://www.calculatorsoup.com/calculators/algebra/percent-difference-calculator.php
  const numerator = base - yearly
  const denomenator = (base + yearly) / 2
  const result = (numerator / denomenator) * 100
  return Math.round(result)
})
const lifetimePrice = computed(() => consts.price('life'))
const updatePeriod = (value) => {
  state.period = value
}
const price = (period) => {
  const isStudentDiscount = studentDiscountIsAvailable.value
  return consts.price(period, isStudentDiscount)
}

// dialog

const triggerSignUpOrInIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}
const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialog.value
  state.dialogHeight = utils.elementHeight(element)
}
const closeChildDialogs = () => {
  store.commit('triggerCloseChildDialogs')
}
</script>

<template lang="pug">
dialog.upgrade-user.wide(v-if="props.visible" :open="props.visible" @click.left.stop="closeChildDialogs" @keydown.stop ref="dialog" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    .row.title-row
      p Upgrade your account for unlimited cards and uploads
      .button-wrap
        button.small-button(@click.stop="toggleUpgradeFAQIsVisible" :class="{active: state.upgradeFAQIsVisible}")
          span ?
          UpgradeFAQ(:visible="state.upgradeFAQIsVisible")

    //- student info
    .row(v-if="studentDiscountIsAvailable && isSecureAppContextIOS")
      .badge.danger Your account qualifies for a student discount but you have to upgrade via the web to use it
    .row(v-else-if="studentDiscountIsAvailable")
      .badge.success Your account qualifies for a student discount
    //- period picker
    .row
      .segmented-buttons
        button(:class="{active: state.period === 'month'}" @click.left="updatePeriod('month')") ${{monthlyPrice.amount}}/month
        button(:class="{active: state.period === 'year'}" @click.left="updatePeriod('year')") ${{yearlyPrice.amount}}/year
          .badge.label-badge -{{yearlyDiscount}}%
        button(v-if="!isSecureAppContextIOS" :class="{active: state.period === 'life'}" @click.left="updatePeriod('life')") ${{lifetimePrice.amount}}/life
    //- checkout
    template(v-if="!currentUserIsSignedIn")
      p To upgrade your account, you'll need to sign up first
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
    template(v-if="currentUserIsSignedIn")
      UpgradeUserStripe(:visible="!isSecureAppContextIOS" :price="currentPrice")
      UpgradeUserApple(:visible="isSecureAppContextIOS" :price="currentPrice")

  section(v-if="currentUserIsSignedIn")
    p
      img.icon(src="@/assets/lock.svg")
      span Payments securely processed by {{paymentProcessor}}
</template>

<style lang="stylus">
dialog.upgrade-user
  max-height calc(100vh - 210px)
  left initial
  right 8px
  .badge
    display inline-block
  button
    position relative
  .label-badge
    color var(--primary-background)
    font-size 12px
    min-height initial
    position absolute
    left initial
    right 0
    top -9px
    margin 0
    z-index 1
  p
    color var(--primary)
  @media(max-height 650px)
    top -60px !important

  .title-row
    align-items flex-start
    .button-wrap,
    .small-button
      margin-top 0
</style>
