<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useApiStore } from '@/stores/useApiStore'
import { useThemeStore } from '@/stores/useThemeStore'

// import utils from '@/utils.js'
import Header from '@/components/page/Header.vue'

const globalStore = useGlobalStore()
const apiStore = useApiStore()
const themeStore = useThemeStore()

// let unsubscribes

onMounted(() => {
  console.info('🏘️🏘️', globalStore.groupIdPageToLoad)
  // groupId
  // TODO load group based on globalStore.groupIdPageToLoad
  // apiStore.getGroupPublicMeta(groupId)

  // then update page title
})

const state = reactive({
  count: 0
})

const closeAllDialogs = () => {
  globalStore.closeAllDialogs()
}

const isThemeDark = computed(() => themeStore.getIsThemeDark)

const incrementBy = () => {
  state.count = state.count + 1
}
</script>

<template lang="pug">
.page(:class="{ 'is-dark-theme': isThemeDark }")
  Header(:isGroupPage="true")
  main.page(@click="closeAllDialogs")
    .page-wrap
      button(@click="incrementBy")
        span Count is: {{ state.count }}
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
</style>
