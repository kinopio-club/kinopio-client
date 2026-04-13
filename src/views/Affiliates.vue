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
  document.title = 'Kinopio Affiliates'
})

const state = reactive({
  affiliate: {},
  commissions: [],
  isLoading: false,
  error: {
    currentUserIsNotSignedIn: false,
    currentUserIsNotAffiliate: false,
    unknownServerError: false
  },
  filterPendingOnly: false
})

const isThemeDark = computed(() => themeStore.getIsThemeDark)
const closeAllDialogs = () => {
  globalStore.closeAllDialogs()
}
const currentUser = computed(() => userStore.getUserAllState)
const isAffiliate = computed(() => utils.objectHasKeys(state.affiliate))

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
    console.log('❤️', userStore.name, userStore.getUserIsSignedIn, globalStore.isSpacePage, state.affiliate, state.commissions)
  } catch (error) {
    console.error('🚒 update', error)
    // currentUserIsNotAffiliate
    // unknownServerError
  } finally {
    state.isLoading = false
  }
}

const promoUrl = computed(() => `${consts.kinopioDomain()}/${state.affiliate.promoCode}`)
const toggleFilterPendingOnly = (value) => {
  state.filterPendingOnly = value
}
const commissionsFiltered = computed(() => {
  if (state.filterPendingOnly) {
    return state.commissions.filter(item => !item.isPaid)
  } else {
    return state.commissions
  }
})

</script>

<template lang="pug">
.page(:class="{ 'is-dark-theme': isThemeDark }")
  Header
  main.page(@click="closeAllDialogs")
    .page-wrap
      section
        //- TODO errors
        .badge.danger(v-if="state.error.currentUserIsNotSignedIn")
          span To access this page you must be signed in and part of the affiliate program

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
                td {{ state.affiliate.promoCode }}
                td
                  .badge.info {{ promoUrl }}

      section.commissions(v-if="isAffiliate")
        h2 Commissions
        section.subsection.commissions-status
          .row
            span.badge.success $234
            span Total Pending Payout (paid on the first of the each month)
        .row
          .segmented-buttons
            button(:class="{ active: !state.filterPendingOnly }" @click="toggleFilterPendingOnly(false)")
              span All
            button(:class="{ active: state.filterPendingOnly }" @click="toggleFilterPendingOnly(true)")
              span Pending

        table
          tbody
            tr.table-header
              td Status
              //- td Customer

            //- v-for state.commissionsFiltered
            tr
              td
                .badge.success Pending
</template>

<style lang="stylus">
// :root
//   --page-entity-radius 16px

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
    // background pink
    margin-left auto
    margin-right auto
    // margin-left 2rem
    // margin-right 2rem
    max-width 755px
    @media(max-width 760px)
      max-width 600px

    > section
      width 100%
      margin-bottom 2rem
      padding 0 20px // TODO remove if pagewrap has margin
      section.subsection
        display flex
        align-items center

    table
      margin 0
      .table-header
        td
          border-bottom 0
      .user
        margin-right 6px
        display flex
        align-items center

    h2
      font-size 21px
      max-width 400px

    .commissions
      .commissions-status
        margin-bottom 10px
      table
        margin-top 1rem

</style>
