<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useApiStore } from '@/stores/useApiStore'
import { useUserStore } from '@/stores/useUserStore'
import { useThemeStore } from '@/stores/useThemeStore'

import utils from '@/utils.js'
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
  }
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

// const commissionsFiltered = computed(() => {
// // filter pending (unpaid only)
// })

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
          span Affiliate
          //- span.badge.secondary
          User(:user="currentUser" :isClickable="false" :key="currentUser.id" :isMedium="true" :hideYouLabel="true")
          span {{currentUser.name}}

      section.commissions(v-if="isAffiliate")
        //- p skdf
      //- section testing.......
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
    .affiliate-info
      .user
        margin 0 6px
    // h1
    //   font-family var(--header-font-9)
    //   font-size 66px
    //   margin-block initial
    //   margin-bottom 1rem
    //   max-width 400px
    h2
      font-size 21px
      max-width 400px
</style>
