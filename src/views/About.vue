<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import About from '@/components/dialogs/About.vue'

const globalStore = useGlobalStore()

onMounted(() => {
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'closeAllDialogs') {
        closeDialogs()
      }
    }
  )
})
const state = reactive({
  aboutIsVisible: false
})

const closeAllDialogs = () => {
  globalStore.closeAllDialogs()
}
const closeDialogs = () => {
  state.aboutIsVisible = false
}
const toggleAboutIsVisible = () => {
  const isVisible = state.aboutIsVisible
  globalStore.closeAllDialogs()
  state.aboutIsVisible = !isVisible
}

</script>

<template lang="pug">
  //- TODO to HeaderPage
  header
    nav
      .row
        .left
          .logo-about
            .button-wrap
              .logo(alt="kinopio logo" @click.left.stop="toggleAboutIsVisible" @touchend.stop @mouseup.left.stop :class="{active: state.aboutIsVisible}" tabindex="0")
                .logo-image
              About(:visible="state.aboutIsVisible")

        .right
          .button-wrap
            //- TODO
            button Pricing
          .button-wrap
            router-link(to="/app")
              button.success Open App

    //- keybd shortcuts
    //- donate

  main.page(@click="closeAllDialogs")
    //- .section-wrap
    section
      h1 Kinopio
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

main.page
  user-select text
  margin 0
  padding-top 5rem
  background pink
  overflow auto

  // margin 1rem
  // margin-top 5rem
  // .section-wrap
  section
    margin 1rem
    // margin-left auto
    // margin-right auto
    background teal
    max-width 800px

  // h1
</style>
