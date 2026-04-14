<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useApiStore } from '@/stores/useApiStore'
import { useUserStore } from '@/stores/useUserStore'
import { useThemeStore } from '@/stores/useThemeStore'

import utils from '@/utils.js'
import consts from '@/consts.js'
import Header from '@/components/page/Header.vue'
import Loader from '@/components/Loader.vue'
import User from '@/components/User.vue'

import dayjs from 'dayjs'

const globalStore = useGlobalStore()
const apiStore = useApiStore()
const userStore = useUserStore()
const themeStore = useThemeStore()

onMounted(() => {
  update()
  if (consts.isDevelopment()) {
    document.title = '[DEV] Affiliate Dashboard – Kinopio'
  } else {
    document.title = 'Affiliate Dashboard – Kinopio'
  }
})

const state = reactive({
  affiliate: {},
  commissions: [],
  isLoading: false,
  error: {
    currentUserIsNotSignedIn: false,
    currentUserIsNotAffiliate: false,
    unknownServerError: false
  }
})

const isThemeDark = computed(() => themeStore.getIsThemeDark)
const closeAllDialogs = () => {
  globalStore.closeAllDialogs()
}
const currentUser = computed(() => userStore.getUserAllState)
const isAffiliate = computed(() => utils.objectHasKeys(state.affiliate))

const handleErrors = (error) => {
  if (error.status === 401) {
    state.error.currentUserIsNotAffiliate = true
  } else {
    state.error.unknownServerError = true
  }
}
const update = async () => {
  try {
    if (!userStore.getUserIsSignedIn) {
      state.error.currentUserIsNotSignedIn = true
      return
    }
    state.isLoading = true
    const data = await apiStore.getAffiliate()
    state.affiliate = data.affiliate
    state.commissions = data.commissions
    console.log('🦚 update', state.affiliate, state.commissions)
  } catch (error) {
    console.error('🚒 update', error, error.status)
    handleErrors(error)
  } finally {
    state.isLoading = false
  }
}
const formatDate = (date) => {
  return utils.shortAbsoluteDate(date)
}

// affiliate info

const promoUrl = computed(() => `${consts.kinopioDomain()}/${state.affiliate.promoCode}`)

// commissions

const total = (items) => {
  let total = 0
  items.forEach(item => {
    total += parseFloat(item.amountAffiliatePayout)
  })
  return total.toFixed(2)
}
const commissionsPending = computed(() => state.commissions.filter(item => !item.isPaid))
const commissionsPaid = computed(() => state.commissions.filter(item => item.isPaid))
const totalPendingPayout = computed(() => total(commissionsPending.value))
const totalCommissionsPaid = computed(() => total(commissionsPaid.value))
</script>

<template lang="pug">
.page(:class="{ 'is-dark-theme': isThemeDark }")
  Header
  main.page(@click="closeAllDialogs")
    .page-wrap
      section
        h1 Affiliate Dashboard
        .errors
          .badge.danger(v-if="state.error.currentUserIsNotSignedIn")
            span To access this page you must be signed in
          .badge.danger(v-if="state.error.currentUserIsNotAffiliate")
            span To access this page you must be a member of the Kinopio affiliate program.{{' '}}
            //- TODO update help page link
            a(href="/help/affiliate-program") (More Info)
          .badge.danger(v-if="state.error.unknownServerError")
            span (シ_ _)シ Something went wrong, Please try again or contact support

        Loader(:visible="state.isLoading")

      section.affiliate-info(v-if="isAffiliate")
        section.subsection
          table
            tbody
              tr.table-header
                td Affiliate
                td PromoCode
                td Referral URL
              tr
                td
                  .user
                    User(:user="currentUser" :isClickable="false" :key="currentUser.id" :isMedium="true" :hideYouLabel="true")
                    span {{currentUser.name}}
                td
                  span.badge.info {{ state.affiliate.promoCode }}
                td
                  span.badge.info {{ promoUrl }}

      section.commissions(v-if="isAffiliate")
        h2 Commissions Awaiting Payout
        .row
          span.badge.success ${{totalPendingPayout}} Pending Payout
          span (paid on the first of the each month)
        table(v-if="commissionsPending.length")
          tbody
            tr.table-header
              td Status
              td User
              td Amount Affiliate Payout
              td Amount User Paid
              td Date
            tr(v-for="item in commissionsPending")
              td
                .badge.secondary(v-if="item.isPaid") Paid
                .badge.success(v-else) Pending
              td
                .user
                  User(:user="item.user" :isClickable="false" :key="item.user.id" :isMedium="true" :hideYouLabel="true")
                  span {{item.user.name}}
              td
                span ${{item.amountAffiliatePayout}}
              td
                span ${{item.amountUserPaid}}
              td
                span {{formatDate(item.createdAt)}}

        h2 Commissions Paid
        .row
          span.badge.secondary ${{totalCommissionsPaid}} Total Paid Out
        //- same as table above
        table(v-if="commissionsPaid.length")
          tbody
            tr.table-header
              td Status
              td User
              td Amount Affiliate Payout
              td Amount User Paid
              td Date
            tr(v-for="item in commissionsPaid")
              td
                .badge.secondary(v-if="item.isPaid") Paid
                .badge.success(v-else) Pending
              td
                .user
                  User(:user="item.user" :isClickable="false" :key="item.user.id" :isMedium="true" :hideYouLabel="true")
                  span {{item.user.name}}
              td
                span ${{item.amountAffiliatePayout}}
              td
                span ${{item.amountUserPaid}}
              td
                span {{formatDate(item.createdAt)}}
</template>

<style lang="stylus">
header
  z-index 1

main.page
  user-select text
  padding-top 6rem
  padding-bottom 4rem
  margin 0
  color var(--primary)
  background-color var(--primary-background)
  min-height 100dvh
  .page-wrap
    margin-left auto
    margin-right auto
    max-width 755px
    @media(max-width 760px)
      max-width 600px

    > section
      width 100%
      margin-bottom 2rem
      padding 0 20px
      section.subsection
        display flex
        align-items center

    table
      margin 0
      td
        padding 8px
      .user
        margin-right 6px
        display flex
        align-items center

    h1,
    h2
      font-size 21px
      max-width 400px
    h1
      font-size 24px

    .commissions
      .commissions-status
        margin-bottom 10px
      table
        margin-top 1rem

</style>
