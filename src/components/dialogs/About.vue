<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, useTemplateRef, nextTick } from 'vue'
import { useStore } from 'vuex'

import AppsAndExtensions from '@/components/dialogs/AppsAndExtensions.vue'
import Help from '@/components/dialogs/Help.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'
import AboutMe from '@/components/AboutMe.vue'

import dayjs from 'dayjs'

const store = useStore()

const dialogElement = useTemplateRef('dialogElement')

let checkKinopioUpdatesIntervalTimer

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
  const isOffline = !store.state.isOnline
  if (isOffline) { return }
  initChangelog()
})

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    closeDialogs()
    updateDialogHeight()
    store.commit('shouldExplicitlyHideFooter', true)
  } else {
    store.commit('shouldExplicitlyHideFooter', false)
  }
})

const state = reactive({
  whatsNewIsVisible: false,
  appsAndExtensionsIsVisible: false,
  helpIsVisible: false,
  changelog: [],
  dialogHeight: null
})

const childDialogIsVisible = computed(() => {
  return state.whatsNewIsVisible || state.appsAndExtensionsIsVisible || state.helpIsVisible
})
const isSecureAppContextIOS = computed(() => consts.isSecureAppContextIOS)
const refreshBrowser = () => {
  window.location.reload()
}
const closeDialogs = () => {
  state.whatsNewIsVisible = false
  state.appsAndExtensionsIsVisible = false
  state.helpIsVisible = false
}
const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

// check changelog updates

const changelogIsUpdated = computed(() => store.state.changelogIsUpdated)
const initChangelog = async () => {
  await updateChangelog()
  cache.updatePrevChangelogTime()
  if (!utils.arrayHasItems(state.changelog)) { return }
  checkKinopioUpdatesIntervalTimer = setInterval(() => {
    updateChangelog()
  }, 1000 * 60 * 60 * 1) // 1 hour
}
const updateChangelog = async () => {
  try {
    let posts = await store.dispatch('api/getChangelog')
    if (!posts) { return }
    posts = posts.slice(0, 20)
    state.changelog = posts
    checkChangelogIsUpdated()
    checkIfShouldNotify()
  } catch (error) {
    console.error('🚒 updateChangelog', error)
  }
}
const checkChangelogIsUpdated = () => {
  const newId = state.changelog[0].id
  const prevId = cache.prevReadChangelogId()
  const isUpdated = parseInt(prevId) < parseInt(newId)

  store.commit('changelogIsUpdated', isUpdated)
}
const checkIfShouldNotify = async () => {
  let prevTime = cache.prevChangelogTime()
  if (!prevTime) { return }
  let newest = state.changelog[0]
  newest = dayjs(newest.createdAt)
  prevTime = dayjs(prevTime)
  const timeSinceNewest = prevTime.diff(newest, 'second')
  const isNew = timeSinceNewest < 0
  store.commit('notifyKinopioUpdatesAreAvailable', isNew)
}

// changelog

const changeSpaceToChangelog = () => {
  const space = { id: consts.changelogSpaceId() }
  const changelogId = state.changelog[0].id
  cache.updatePrevReadChangelogId(changelogId)
  store.commit('changelogIsUpdated', false)
  store.dispatch('currentSpace/changeSpace', space)
  store.commit('addNotification', { message: 'Changelog space opened', type: 'success' })
}

// donate

const triggerDonateIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerDonateIsVisible')
}

// keyboard shortcuts

const toggleKeyboardShortcutsIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerKeyboardShortcutsIsVisible')
}

// apps and extensions

const toggleAppsAndExtensionsIsVisible = () => {
  const isVisible = state.appsAndExtensionsIsVisible
  closeDialogs()
  state.appsAndExtensionsIsVisible = !isVisible
}

// help

const toggleHelpIsVisible = () => {
  const isVisible = state.helpIsVisible
  closeDialogs()
  state.helpIsVisible = !isVisible
}

// roadmap

const changeSpaceToRoadmap = () => {
  const space = { id: consts.roadmapSpaceId() }
  store.dispatch('currentSpace/changeSpace', space)
  store.commit('addNotification', { message: 'Roadmap space opened', type: 'success' })
}

</script>

<template lang="pug">
dialog.about.narrow(v-if="visible" :open="visible" @click.left="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}" :class="{ overflow: !childDialogIsVisible }")
  section
    .row.title-row
      p About Kinopio
      span
        button.small-button(@click.left="refreshBrowser" title="Refresh")
          img.refresh.icon(src="@/assets/refresh.svg")

  section
    .row
      p Thinking canvas for new ideas and hard problems
    .row
      .button-wrap
        button(@click.stop="toggleHelpIsVisible" :class="{active: state.helpIsVisible}")
          span Help
        Help(:visible="state.helpIsVisible")
      .button-wrap
        a(href="/roadmap")
          button(@click.left.stop.prevent="changeSpaceToRoadmap")
            span 💐 Roadmap
    .row
      .button-wrap
        a(href="/changelog")
          button(@click.left.stop.prevent="changeSpaceToChangelog")
            span Changelog
            img.updated.icon(src="@/assets/updated.gif" v-if="changelogIsUpdated")
    //- .row
    //-   a(href="https://kinopio.club/pop-up-shop-u9XxpuIzz2_LvQUAayl65")
    //-     button
    //-       img.icon(src="@/assets/sticker.svg")
    //-       span Pop Up Shop{{' '}}
              //- img.icon.visit(src="@/assets/visit.svg")
  section
    .row
      .button-wrap
        button(@click.left.stop="toggleAppsAndExtensionsIsVisible" :class="{active: state.appsAndExtensionsIsVisible}")
          img.icon.system(src="@/assets/system.svg")
          span Apps and Extensions
        AppsAndExtensions(:visible="state.appsAndExtensionsIsVisible")
    .row
      .button-wrap
        button(@click.left.stop="toggleKeyboardShortcutsIsVisible")
          .badge.keyboard-shortcut.badge-in-button ?
          span Keyboard Shortcuts
  section
    .row
      p 100% funded and made possible by people like you
    .row
      AboutMe
    .row
      .button-wrap
        a(href="https://kinopio.club/discord")
          button
            span Discord{{' '}}
            img.icon.visit(src="@/assets/visit.svg")
      .button-wrap
        a(href="https://kinopio.club/forum")
          button
            span Forum{{' '}}
            img.icon.visit(src="@/assets/visit.svg")
    .row
      //- .button-wrap
      //-   a(href="/blog")
      //-     button
      //-       span Blog →
      .button-wrap(v-if="!isSecureAppContextIOS")
        button(@click.left.stop="triggerDonateIsVisible")
          img.icon(src="@/assets/heart-empty.svg")
          span Donate
</template>

<style lang="stylus">
.about
  top calc(100% - 6px) !important
  &.overflow
    overflow auto
  .updated
    margin 0
    margin-left 3px
  .keyboard-shortcut
    padding 0 4px !important
  .about-video
    border-radius var(--entity-radius)
  .icon.system
    vertical-align -1px
</style>
