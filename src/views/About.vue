<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import Header from '@/components/page/Header.vue'
import AppsAndExtensions from '@/components/dialogs/AppsAndExtensions.vue'

const globalStore = useGlobalStore()
let unsubscribes

onMounted(() => {
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'closeAllDialogs') {
        closeDialogs()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const state = reactive({
  appsAndExtensionsIsVisible: false
})

const closeAllDialogs = () => {
  globalStore.closeAllDialogs()
}
const closeDialogs = () => {
  state.appsAndExtensionsIsVisible = false
}

const toggleAppsAndExtensionsIsVisible = () => {
  const isVisible = state.appsAndExtensionsIsVisible
  closeAllDialogs()
  state.appsAndExtensionsIsVisible = !isVisible
}
</script>

<template lang="pug">
  Header
  main.page(@click="closeAllDialogs")
    section
      h1 Kinopio
      p is a spatial note taking tool for collecting and connecting your thoughts, ideas, and feelings. Create spaces to whiteboard, brainstorm, moodboard, research, plan, and take notes.
      .row
        .button-wrap
          button(@click.left.stop="toggleAppsAndExtensionsIsVisible" :class="{active: state.appsAndExtensionsIsVisible}")
            img.icon.system(src="@/assets/system.svg")
            span Apps
          AppsAndExtensions(:visible="state.appsAndExtensionsIsVisible")
        .button-wrap
          router-link(to="/app")
            button.success Open App

</template>

<style lang="stylus">
// @font-face
//   font-family 'recoleta'
//   src url("/fonts/recoleta/Recoleta-Bold.woff2") format("woff2")
//   font-weight bold
//   font-style normal
// @font-face
//   font-family 'recoleta'
//   src url("/fonts/recoleta/Recoleta-Regular.woff2") format("woff2")
//   font-weight normal
//   font-style normal

header
  z-index 1

main.page
  user-select text
  margin 0
  padding-top 4rem
  background pink
  overflow auto
  height 100dvh
  > section
    margin 3rem
    background teal
    max-width 600px
    @media(max-width 700px)
      margin 2rem
    @media(max-width 500px)
      margin 1rem
    > .row
      margin-top 10px

  // h1
</style>
