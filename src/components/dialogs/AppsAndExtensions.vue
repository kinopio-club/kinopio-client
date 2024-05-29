<script setup>
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

let shouldRestoreUrlPath, title, pathname
const dialog = ref(null)

onMounted(() => {
  updateCurrentDeviceView()
  state.isAndroid = utils.isAndroid()
  shouldRestoreUrlPath = true
  store.subscribe((mutation, state) => {
    if (mutation.type === 'closeAllDialogs') {
      const element = dialog.value
      if (!element) { return }
      if (shouldRestoreUrlPath) {
        shouldRestoreUrlPath = false
        restoreUrlPath()
      }
    }
  })
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
})

const props = defineProps({
  visible: Boolean
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateCurrentDeviceView()
    updateDialogHeight()
    stripUrlPath()
  } else {
    restoreUrlPath()
  }
})

const state = reactive({
  dialogHeight: null,
  isDesktop: true,
  isAndroid: false
})

// platform

const toggleIsAndroid = (value) => {
  state.isAndroid = value
}
const toggleIsDesktop = (value) => {
  state.isDesktop = value
}
const updateCurrentDeviceView = () => {
  if (store.getters.isTouchDevice) {
    state.isDesktop = false
  } else {
    state.isDesktop = true
  }
}

// url

const stripUrlPath = () => {
  title = document.title
  pathname = window.location.pathname
  let url = '/'
  // temporary url change for bookmarking, doesn't update vue-router history
  history.replaceState(history.state, '', url)
}
const restoreUrlPath = () => {
  // temporary url change for bookmarking, doesn't update vue-router history
  history.replaceState({}, title, pathname)
}

// dialog

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialog.value
  state.dialogHeight = utils.elementHeight(element)
}

</script>

<template lang="pug">
dialog.apps.narrow(v-if="visible" @click.stop :open="visible" ref="dialog" :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
    .segmented-buttons
      button(:class="{active: state.isDesktop}" @click="toggleIsDesktop(true)")
        span Desktop
      button(:class="{active: !state.isDesktop}" @click="toggleIsDesktop(false)")
        span Mobile

  section(v-if="state.isDesktop")
    .logo-wrap
      .app-frame
        .logo-image
      span.arrow.icon →
      img.icon(src="@/assets/computer.svg")
    .row
      p App for Mac, Windows, and Linux
    .row
      a(href="https://dl.todesktop.com/201223j48l03cxi" download)
        button
          img.icon(src="@/assets/system.svg")
          span Download App
    .row
      p Extensions
    .row
      .button-wrap
        a(href="https://addons.mozilla.org/en-US/firefox/addon/add-to-kinopio")
          button
            span Firefox{{' '}}
            img.icon.visit(src="@/assets/visit.svg")
      .button-wrap
        a(href="https://chrome.google.com/webstore/detail/kinopio/hodmmkfpchpgmaemlicohlkiigpejakn")
          button
            span Chrome{{' '}}
            img.icon.visit(src="@/assets/visit.svg")
    .row
      .button-wrap
        a(href="https://apps.apple.com/app/add-to-kinopio/id1614926102")
          button
            span Safari{{' '}}
            img.icon.visit(src="@/assets/visit.svg")
      .button-wrap
        a(href="https://www.raycast.com/pirijan/kinopio-inbox")
          button
            span Raycast{{' '}}
            img.icon.visit(src="@/assets/visit.svg")
    .row
      .button-wrap
        a(href="https://phonetonote.com/")
          button
            span SMS via phonetonote{{' '}}
            img.icon.visit(src="@/assets/visit.svg")

  section(v-if="!state.isDesktop")
    .logo-wrap
      .app-frame
        .logo-image
      span.arrow.icon →
      img.icon(src="@/assets/phone.svg")

    .row
      .segmented-buttons
        button(@click="toggleIsAndroid(false)" :class="{ active: !state.isAndroid }")
          span iOS
        button(@click="toggleIsAndroid(true)" :class="{ active: state.isAndroid }")
          span Android

    template(v-if="state.isAndroid")
      p Kinopio is a web-app which you can add directly,
        ol
          li
            span Tap the Menu button
            .badge.info
              img.icon(src="@/assets/android-menu.svg")
            span at the top of the screen
          li
            span Then tap
              .badge.info
                span Add to Home screen
    template(v-else)
      .row
        a(href="https://apps.apple.com/us/app/kinopio/id6448743101")
          button
            img.icon(src="@/assets/apple.svg")
            span Download from App Store

</template>

<style lang="stylus">
dialog.apps
  overflow auto
  .logo-wrap
    display flex
    align-items center
    margin-bottom 10px
    .arrow
      margin-left 5px
  .logo-image
    width 35px
    height 30px
    background-repeat no-repeat
    background-size cover
    background-position center
  .app-frame
    border 1px solid var(--secondary-background)
    background-color var(--secondary-background)
    border-radius 10px
    padding 6px
    display inline-block

  .badge
    display inline
    margin-left 6px
  .add
    padding-left 5px

  // copied from WhatsNew.vue
  ol
    margin 0
    margin-top 2px
    padding-left 15px
    li
      padding-top 10px
      margin-left 5px
      user-select text
</style>
